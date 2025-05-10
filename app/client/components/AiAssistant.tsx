"use client";

import * as React from "react";
import Image from "next/image";
import { twMerge } from "tailwind-merge";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import { useChat } from "ai/react";
import { UIMessage } from "ai";
import Input from "@mui/joy/Input";
import IconButton from "@mui/joy/IconButton";
import {
  ArrowUp,
  AudioLines,
  Bot,
  BotMessageSquare,
  Waves,
} from "lucide-react";
import { Mic } from "lucide-react";
import { useEffect } from "react";

export function AiAssistant() {
  // Is the asisstant window open?
  const [active, setActive] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const formRef = React.useRef<HTMLFormElement>(null);
  const [isClient, setIsClient] = React.useState(false);

  // Initialize client-side state
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Always call useSpeechRecognition, but only use its values when on client
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  const { messages, input, handleSubmit, handleInputChange, status } = useChat({
    initialMessages: [
      {
        id: "0",
        content: "Hello, how can I help you today?",
        role: "assistant",
      },
    ],
  });

  // Submit on speech
  useEffect(() => {
    if (isClient && !listening && transcript) {
      resetTranscript();
      formRef.current?.submit();
    }
  }, [isClient, listening, transcript, resetTranscript]);

  return (
    <div
      className="flex flex-col items-end fixed bottom-4 right-8 gap-2"
      ref={ref}
    >
      <div
        className={twMerge(
          "flex flex-col justify-end gap-4 min-h-[100px] w-[400px] bg-white rounded-lg opacity-0 pointer-events-none transition-all duration-150 ease-out",
          active && "opacity-100 pointer-events-auto"
        )}
      >
        <div className="overflow-y-auto max-h-[70vh] flex flex-col gap-2 p-4 pb-0">
          {messages.map((message) => (
            <Message
              key={message.id}
              message={message}
              fromAi={message.role === "assistant"}
            />
          ))}
        </div>
        <form
          onSubmit={handleSubmit}
          className="w-full flex gap-1 p-4 pt-0"
          ref={formRef}
        >
          <IconButton style={{ marginLeft: "-10px" }}>
            <Bot size={20} />
          </IconButton>
          <Input
            value={input}
            onChange={handleInputChange}
            className="w-full"
            startDecorator={
              isClient &&
              browserSupportsSpeechRecognition && (
                <IconButton>
                  <Mic size={20} />
                </IconButton>
              )
            }
          />
          <IconButton
            variant="solid"
            sx={{ backgroundColor: "black" }}
            onClick={() => {
              formRef.current?.submit();
            }}
          >
            <ArrowUp />
          </IconButton>
        </form>
      </div>
      <div
        className={twMerge(
          "opacity-80 cursor-pointer  h-16 w-16 p-3 rounded-full bg-white hover:bg-gray-200 hover:opacity-100 transition-all duration-150 hover:shadow-[0px_0px_25px_0px_darkgray]",
          active && "opacity-100",
          listening && "listening"
        )}
        onClick={() => {
          setActive(!active);
        }}
      >
        <Image src="/tradeAi.png" alt="logo" width={100} height={100} />
      </div>
    </div>
  );
}

function Message({ fromAi, message }: { fromAi: boolean; message: UIMessage }) {
  return (
    <div
      className={twMerge(
        "rounded-lg break-words",
        fromAi
          ? "bg-white text-black place-self-start mr-10 p-2"
          : "bg-black place-self-end rounded-br-none ml-10 px-4 py-2"
      )}
    >
      {message.content || "..."}
    </div>
  );
}
