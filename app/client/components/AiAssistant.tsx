"use client";

import * as React from "react";
import Image from "next/image";
import { twMerge } from "tailwind-merge";
import { useChat } from "ai/react";
import { UIMessage } from "ai";
import Input from "@mui/joy/Input";
import IconButton from "@mui/joy/IconButton";
import {
  ArrowUp,
  Bot,
  BotMessageSquare,
  Mic,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { VoiceAnimation, AnimationState } from "./VoiceAnimation";
import ToolPanel from "./voice_agent/ToolPanel";

interface Event {
  event_id?: string;
  type: string;
  timestamp?: string;
  item?: {
    type: string;
    role: string;
    content: Array<{
      type: string;
      text: string;
    }>;
  };
  response?: {
    output?: Array<{
      type: string;
      name?: string;
      arguments?: string;
    }>;
  };
}

export function AiAssistant() {
  // Is the assistant window open?
  const [active, setActive] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const formRef = React.useRef<HTMLFormElement>(null);
  const [isClient, setIsClient] = React.useState(false);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [dataChannel, setDataChannel] = useState<RTCDataChannel | null>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const audioElement = useRef<HTMLAudioElement | null>(null);
  const audioContext = useRef<AudioContext | null>(null);
  const [voiceAnimationState, setVoiceAnimationState] = useState<AnimationState>(AnimationState.IDLE);
  const [showVoiceAnimation, setShowVoiceAnimation] = useState(false);

  // Initialize client-side state
  useEffect(() => {
    setIsClient(true);
  }, []);

  const { messages, input, handleSubmit, handleInputChange, status } = useChat({
    initialMessages: [
      {
        id: "0",
        content: "Hello, how can I help you today?",
        role: "assistant",
      },
    ],
  });

  async function startSession() {
    try {
      // Set voice animation to thinking state while starting
      setVoiceAnimationState(AnimationState.THINKING);
      setShowVoiceAnimation(true);
      setActive(true);
      
      // Get a session token for OpenAI Realtime API
      const tokenResponse = await fetch("/api/voice/token");
      const data = await tokenResponse.json();
      const EPHEMERAL_KEY = data.client_secret.value;

      // Create a peer connection
      const pc = new RTCPeerConnection();

      // Set up to play remote audio from the model
      audioElement.current = document.createElement("audio");
      audioElement.current.autoplay = true;
      pc.ontrack = (e) => {
        const mediaStream = e.streams[0];
        audioContext.current = new AudioContext();
        const source = audioContext.current.createMediaStreamSource(mediaStream);
        
        // Create an analyzer to get raw PCM data
        const analyzer = audioContext.current.createAnalyser();
        analyzer.fftSize = 2048;
        
        // Create a processor to handle the PCM data
        const processor = audioContext.current.createScriptProcessor(1024, 1, 1);
        
        processor.onaudioprocess = (e: AudioProcessingEvent) => {
          const inputData = e.inputBuffer.getChannelData(0);
          const pcmData = new Int16Array(inputData.length);
          for (let i = 0; i < inputData.length; i++) {
            pcmData[i] = Math.min(1, Math.max(-1, inputData[i])) * 0x7FFF;
          }
        };
        
        source.connect(analyzer);
        analyzer.connect(processor);
        processor.connect(audioContext.current.destination);
        
        if (audioElement.current) {
          audioElement.current.srcObject = mediaStream;
        }
      };

      // Add local audio track for microphone input
      const ms = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      pc.addTrack(ms.getTracks()[0]);

      // Set up data channel for sending and receiving events
      const dc = pc.createDataChannel("oai-events");
      setDataChannel(dc);

      // Start the session using SDP
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const baseUrl = "https://api.openai.com/v1/realtime";
      const model = "gpt-4o-realtime-preview-2024-12-17";
      const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
        method: "POST",
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${EPHEMERAL_KEY}`,
          "Content-Type": "application/sdp",
        },
      });

      const answer = {
        type: "answer" as const,
        sdp: await sdpResponse.text(),
      };
      await pc.setRemoteDescription(answer);

      peerConnection.current = pc;

      // Move event listener setup to the useEffect that handles dataChannel changes
    } catch (error) {
      console.error("Failed to start session:", error);
      // Reset animation if error
      setShowVoiceAnimation(false);
    }
  }

  function stopSession() {
    if (dataChannel) {
      dataChannel.close();
    }

    peerConnection.current?.getSenders().forEach((sender) => {
      if (sender.track) {
        sender.track.stop();
      }
    });

    if (peerConnection.current) {
      peerConnection.current.close();
    }

    setIsSessionActive(false);
    setDataChannel(null);
    peerConnection.current = null;
    setShowVoiceAnimation(false);

    if (audioContext.current) {
      audioContext.current.close();
    }
  }

  function sendClientEvent(message: Event) {
    if (dataChannel) {
      const timestamp = new Date().toLocaleTimeString();
      message.event_id = message.event_id || crypto.randomUUID();
      
      // Create a copy of the message without the timestamp for sending to API
      const messageToSend = { ...message };
      delete messageToSend.timestamp;
      dataChannel.send(JSON.stringify(messageToSend));

      // Add timestamp to local copy for UI display
      if (!message.timestamp) {
        message.timestamp = timestamp;
      }
      setEvents((prev) => [message, ...prev]);
      
      // Set animation state based on the event type
      if (showVoiceAnimation) {
        if (message.type === "conversation.item.create" && message.item?.role === "assistant") {
          setVoiceAnimationState(AnimationState.SPEAKING);
        } else if (message.type === "response.create") {
          setVoiceAnimationState(AnimationState.THINKING);
        }
      }
    }
  }

  function sendTextMessage(message: string) {
    const event: Event = {
      type: "conversation.item.create",
      item: {
        type: "message",
        role: "user",
        content: [
          {
            type: "input_text",
            text: message,
          },
        ],
      },
    };

    sendClientEvent(event);
    sendClientEvent({ type: "response.create" });
  }

  useEffect(() => {
    if (dataChannel) {
      dataChannel.addEventListener("message", (e) => {
        const event = JSON.parse(e.data) as Event;
        // Add timestamp for local display only
        const eventWithTimestamp = { 
          ...event, 
          timestamp: event.timestamp || new Date().toLocaleTimeString() 
        };
        setEvents((prev) => [eventWithTimestamp, ...prev]);
      });

      dataChannel.addEventListener("open", () => {
        setIsSessionActive(true);
        setEvents([]);
        setVoiceAnimationState(AnimationState.IDLE);
      });
    }
  }, [dataChannel]);

  // Add an effect to set animation state based on events
  useEffect(() => {
    if (!isSessionActive || !showVoiceAnimation) return;
    
    // Look for speaking events in the last few events
    const recentEvents = events.slice(0, 5);
    // Debug log to see what events we're getting
    console.log("Recent events for animation state:", recentEvents.map(e => e.type));
    //console.log(JSON.stringify(recentEvents, null, 2));
    const isSpeaking = recentEvents.some(event => 
      event.type === "audio.speech.start" || 
      event.type === "stream.message" || 
      event.type === "audio.play.start" ||
      (event.type === "conversation.item.create" && event.item?.role === "assistant")
    );
    
    const isThinking = recentEvents.some(event => 
      event.type === "response.create" || 
      event.type === "response.thinking" ||
      event.type === "audio.transcription" ||
      event.type === "audio.record.start"
    );
    
    if (isSpeaking) {
      console.log("Setting animation state to SPEAKING");
      setVoiceAnimationState(AnimationState.SPEAKING);
    } else if (isThinking) {
      console.log("Setting animation state to THINKING");
      setVoiceAnimationState(AnimationState.THINKING);
    } else {
      console.log("Setting animation state to IDLE");
      setVoiceAnimationState(AnimationState.IDLE);
    }
  }, [events, isSessionActive, showVoiceAnimation]);

  // For testing animation states directly when not connected
  const cycleAnimationState = () => {
    if (!showVoiceAnimation) {
      setShowVoiceAnimation(true);
      setVoiceAnimationState(AnimationState.IDLE);
      return;
    }
    
    if (voiceAnimationState === AnimationState.IDLE) {
      setVoiceAnimationState(AnimationState.THINKING);
    } else if (voiceAnimationState === AnimationState.THINKING) {
      setVoiceAnimationState(AnimationState.SPEAKING);
    } else {
      setVoiceAnimationState(AnimationState.IDLE);
    }
  };

  // Helper to format date (e.g., 'April 28')
  function formatDate(date: Date) {
    return date.toLocaleDateString(undefined, { month: 'long', day: 'numeric' });
  }

  // Helper to format time (e.g., '16:15')
  function formatTime(date: Date) {
    return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', hour12: false });
  }

  // Group messages by date for date separators
  const groupedMessages = messages.reduce((acc, msg) => {
    const date = msg.createdAt ? new Date(msg.createdAt) : new Date();
    const dateStr = formatDate(date);
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(msg);
    return acc;
  }, {} as Record<string, UIMessage[]>);
  const dateKeys = Object.keys(groupedMessages);

  return (
    <div
      className="flex flex-col items-start fixed bottom-4 left-4 gap-2 z-50 font-sans"
      ref={ref}
    >
      <div
        className={twMerge(
          "w-[440px] bg-black rounded-2xl shadow-2xl transition-all duration-300 transform border border-neutral-800",
          active ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none",
          active && "opacity-100 pointer-events-auto"
        )}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-2">
          <div className="text-2xl font-bold text-white flex justify-between items-center">
            <span>Get help</span>
            {showVoiceAnimation && (
              <div className="text-sm font-normal text-neutral-400 flex items-center gap-2">
                <span className={voiceAnimationState === AnimationState.SPEAKING ? "text-green-400" : ""}>
                  {voiceAnimationState === AnimationState.SPEAKING ? "Speaking" : 
                   voiceAnimationState === AnimationState.THINKING ? "Thinking" : "Listening"}
                </span>
                <button 
                  className="text-white p-1 bg-neutral-800 rounded-full hover:bg-neutral-700"
                  onClick={stopSession}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
        {/* Content area - either show messages or voice animation */}
        {showVoiceAnimation ? (
          <div className="w-full h-[50vh] relative flex items-center justify-center overflow-hidden">
            {/* Animation container */}
            <div className="h-full w-full absolute inset-0">
              <VoiceAnimation state={voiceAnimationState} />
              <ToolPanel
            sendClientEvent={sendClientEvent}
            events={events}
            isSessionActive={isSessionActive}
          />
            </div>
            {/* Debug button for testing animation states - remove in production */}
            <button
              onClick={cycleAnimationState}
              className="absolute bottom-4 right-4 text-xs text-white bg-neutral-800 px-2 py-1 rounded-md opacity-50 hover:opacity-100"
            >
              Test
            </button>
          </div>
        ) : (
          <div className="overflow-y-auto max-h-[70vh] flex flex-col gap-2 px-4 pb-4">
            {dateKeys.map((dateKey) => (
              <React.Fragment key={dateKey}>
                {/* Date Separator */}
                <div className="flex justify-center my-2">
                  <span className="text-xs text-neutral-500 font-semibold bg-black px-3 py-1 rounded-full">
                    {dateKey}
                  </span>
                </div>
                {groupedMessages[dateKey].map((message, idx) => (
                  <Message
                    key={message.id}
                    message={message}
                    fromAi={message.role === "assistant"}
                    timestamp={formatTime(message.createdAt ? new Date(message.createdAt) : new Date())}
                  />
                ))}
              </React.Fragment>
            ))}
          </div>
        )}
        <form
          onSubmit={handleSubmit}
          className="w-full flex flex-col items-end p-4 pt-0 bg-black"
          ref={formRef}
        >
          <div className="flex items-center w-full bg-neutral-900 rounded-2xl px-4 py-3 gap-2">
            {/* Microphone icon on the left */}
            {isClient && (
              <button type="button" onClick={() => isSessionActive ? stopSession() : startSession()} className="focus:outline-none">
                <Mic size={22} className={isSessionActive || showVoiceAnimation ? "text-red-500" : "text-neutral-400"} />
              </button>
            )}
            {/* Input field */}
            <input
              value={input}
              onChange={handleInputChange}
              className="flex-1 bg-transparent outline-none border-none text-white placeholder:text-neutral-500 text-base font-sans font-semibold"
              placeholder="Write a message..."
              maxLength={100}
            />
            {/* Send button */}
            <button
              type="submit"
              className="flex items-center justify-center w-9 h-9 rounded-full bg-neutral-800 hover:bg-neutral-700 transition-colors"
              style={{ minWidth: 36, minHeight: 36 }}
            >
              <ArrowUp className="text-white" size={20} />
            </button>
          </div>
        </form>
      </div>
      <div
        className={twMerge(
          "opacity-80 cursor-pointer h-12 w-12 p-2 rounded-full bg-white hover:bg-gray-200 hover:opacity-100 transition-all duration-150 hover:shadow-[0px_0px_25px_0px_darkgray]",
          active && "opacity-100",
          isSessionActive && "bg-red-100"
        )}
        onClick={() => {
          if (!showVoiceAnimation) {
            setActive(!active);
          }
        }}
      >
        <Image src="/tradeAi.png" alt="logo" width={100} height={100} />
      </div>
    </div>
  );
}

function Message({ message, fromAi, timestamp }: { message: UIMessage; fromAi: boolean; timestamp: string }) {
  // Define short message threshold
  const isShort = (message.content || '').length <= 15;

  return (
    <div
      className={twMerge(
        "max-w-[80%] flex flex-col",
        fromAi ? "self-start items-start" : "self-end items-end"
      )}
    >
      <div
        className={twMerge(
          "rounded-2xl break-words text-base relative",
          fromAi
            ? "bg-neutral-800 text-white px-4 py-3 rounded-2xl"
            : "bg-white text-black px-4 py-3 rounded-2xl shadow"
        )}
        style={{ minWidth: '60px' }}
      >
        {isShort ? (
          <div className="flex items-center w-full justify-between" style={{ minHeight: '1.8em' }}>
            <span className="font-sans font-semibold text-sm ">{message.content || "..."}</span>
            <span className="text-xs font-semibold text-neutral-500 ml-2">{timestamp}</span>
          </div>
        ) : (
          <>
            <span className="font-sans font-semibold text-sm" style={{ display: 'block', paddingBottom: '2.2em' }}>{message.content || "..."}</span>
            <span
              className={twMerge(
                "text-xs font-semibold text-neutral-500 absolute right-4",
                fromAi ? "" : ""
              )}
              style={{ bottom: '0.5em', marginBottom: '0.75em' }}
            >
              {timestamp}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
