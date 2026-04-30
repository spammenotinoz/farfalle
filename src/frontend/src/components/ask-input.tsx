"use client";

import TextareaAutosize from "react-textarea-autosize";
import { useState } from "react";
import { Button } from "./ui/button";
import { ArrowUp, Mic } from "lucide-react";
import { ModelSelection } from "./model-selection";
import ProToggle from "./pro-toggle";
import { ResearchDepthControl } from "./research-depth";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { cn } from "@/lib/utils";

export const AskInput = ({
  sendMessage,
  isFollowingUp = false,
}: {
  sendMessage: (message: string) => void | Promise<void>;
  isFollowingUp?: boolean;
}) => {
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const handleSend = async () => {
    const message = input.trim();
    if (message.length < 3 || isStreaming) return;
    setIsStreaming(true);
    try {
      await sendMessage(message);
      setInput("");
    } finally {
      setIsStreaming(false);
    }
  };

  const handleVoiceToggle = () => {
    if (!isRecording) {
      setIsRecording(true);
      if (
        "webkitSpeechRecognition" in window ||
        "SpeechRecognition" in window
      ) {
        const SpeechRecognition =
          (window as any).SpeechRecognition ||
          (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((result: any) => result[0].transcript)
            .join("");
          setInput(transcript);
        };

        recognition.onend = () => setIsRecording(false);
        recognition.onerror = () => setIsRecording(false);

        recognition.start();
        (window as any).speechRecognition = recognition;
      }
    } else {
      if ((window as any).speechRecognition) {
        (window as any).speechRecognition.stop();
      }
      setIsRecording(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <form
      className="w-full"
      onSubmit={(e) => {
        e.preventDefault();
        if (input.trim().length < 3) return;
        handleSend();
      }}
    >
      <div
        className={cn(
          "w-full flex flex-col bg-card border transition-all duration-200",
          isFollowingUp ? "items-center rounded-md shadow-sm" : "rounded-md shadow-sm",
          !isRecording && "focus-within:ring-2 focus-within:ring-tint/30",
        )}
      >
        {/* Recording indicator */}
        {isRecording && (
          <div className="flex items-center gap-3 px-4 py-2 border-b rounded-t-md bg-destructive/5">
            <div className="w-2.5 h-2.5 rounded-full bg-destructive animate-pulse flex-shrink-0" />
            <span className="text-sm font-medium text-destructive">
              {formatTime(0)}
            </span>
            <span className="text-sm text-muted-foreground">Listening...</span>
          </div>
        )}

        <div
          className={cn(
            "flex items-end gap-2",
            isFollowingUp ? "p-1.5 px-2" : "p-3",
          )}
        >
          {/* Voice button */}
          <div className="flex items-center flex-shrink-0">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors",
                      isRecording && "text-destructive hover:text-destructive",
                      isFollowingUp ? "h-8 w-8" : "h-9 w-9",
                    )}
                    onClick={handleVoiceToggle}
                  >
                    <Mic size={isFollowingUp ? 17 : 19} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isRecording ? "Stop recording" : "Voice input"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Textarea */}
          <TextareaAutosize
            className={cn(
              "w-full bg-transparent resize-none focus:outline-none text-foreground placeholder:text-muted-foreground",
              isFollowingUp
                ? "text-sm py-1.5 max-h-28"
                : "text-base py-2 max-h-48",
            )}
            placeholder={
              isRecording
                ? "Listening..."
                : isFollowingUp
                  ? "Ask a follow-up..."
                  : "Search anything..."
            }
            onChange={(e) => setInput(e.target.value)}
            value={input}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (input.trim().length >= 3 && !isStreaming) handleSend();
              }
            }}
          />

          {/* Send button */}
          <div className="flex-shrink-0">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="submit"
                    variant="default"
                    size="icon"
                    className={cn(
                      "rounded-md bg-foreground text-background hover:bg-foreground/80 transition-all duration-200",
                      isFollowingUp ? "h-8 w-8" : "h-9 w-9",
                    )}
                    disabled={input.trim().length < 3 || isStreaming}
                  >
                    <ArrowUp size={isFollowingUp ? 16 : 18} strokeWidth={2.5} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Send</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Bottom bar: model selector (homepage only) */}
        {!isFollowingUp && (
          <div className="flex flex-col gap-2 border-t px-3 pb-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-2">
              <ModelSelection />
              <ProToggle />
            </div>
            <ResearchDepthControl />
          </div>
        )}
      </div>
    </form>
  );
};
