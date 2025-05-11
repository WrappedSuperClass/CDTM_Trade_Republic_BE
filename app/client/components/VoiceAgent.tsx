"use client";

import { useEffect, useRef, useState } from "react";
import EventLog from "./voice_agent/EventLog";
import SessionControls from "./voice_agent/SessionControls";
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

export function VoiceAgent() {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [dataChannel, setDataChannel] = useState<RTCDataChannel | null>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const audioElement = useRef<HTMLAudioElement | null>(null);
  const audioBuffer = useRef<any[]>([]);
  const audioContext = useRef<AudioContext | null>(null);

  async function startSession() {
    try {
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
    } catch (error) {
      console.error("Failed to start session:", error);
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

    if (audioContext.current) {
      audioContext.current.close();
    }
  }

  function sendClientEvent(message: Event) {
    if (dataChannel) {
      const timestamp = new Date().toLocaleTimeString();
      message.event_id = message.event_id || crypto.randomUUID();
      dataChannel.send(JSON.stringify(message));

      if (!message.timestamp) {
        message.timestamp = timestamp;
      }
      setEvents((prev) => [message, ...prev]);
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
        if (!event.timestamp) {
          event.timestamp = new Date().toLocaleTimeString();
        }
        setEvents((prev) => [event, ...prev]);
      });

      dataChannel.addEventListener("open", () => {
        setIsSessionActive(true);
        setEvents([]);
      });
    }
  }, [dataChannel]);

  return (
    <div className="h-full flex flex-col bg-gray-900 rounded-lg overflow-hidden">
      <div className="flex-1 flex">
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto p-4">
            <EventLog events={events} />
          </div>
          <div className="h-32 p-4">
            <SessionControls
              startSession={startSession}
              stopSession={stopSession}
              sendClientEvent={sendClientEvent}
              sendTextMessage={sendTextMessage}
              serverEvents={events}
              isSessionActive={isSessionActive}
            />
          </div>
        </div>
        <div className="w-[380px] p-4 pt-0 overflow-y-auto">
          <ToolPanel
            sendClientEvent={sendClientEvent}
            events={events}
            isSessionActive={isSessionActive}
          />
        </div>
      </div>
    </div>
  );
} 