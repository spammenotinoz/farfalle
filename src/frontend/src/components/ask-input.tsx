"use client";

import TextareaAutosize from "react-textarea-autosize";
import { useState } from "react";
import { Button } from "./ui/button";
import { ArrowUp, Mic } from "lucide-react";
import { ModelSelection } from "./model-selection";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

const InputBar = ({
  input,
  setInput,
  onSend,
  isStreaming,
}: {
  input: string;
  setInput: (input: string) => void;
  onSend: () => void;
  isStreaming: boolean;
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const handleVoiceToggle = () => {
    if (!isRecording) {
      setIsRecording(true);
      setRecordingTime(0);
      if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
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

        recognition.onerror = () => {
          setIsRecording(false);
        };

        recognition.onend = () => {
          setIsRecording(false);
        };

        (window as any).speechRecognition = recognition;
        recognition.start();
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

  useState<number | null>(null);

  return (
    <div className="w-full flex flex-col rounded-2xl border-2 bg-card/80 backdrop-blur-sm transition-all duration-200 focus-within:border-tint/50 focus-within:shadow-lg">
      {isRecording && (
        <div className="flex items-center gap-3 px-4 py-2 border-b bg-destructive/5">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-destructive animate-pulse" />
            <span className="text-sm font-medium text-destructive">
              {formatTime(recordingTime)}
            </span>
          </div>
          <span className="text-sm text-muted-foreground">Listening...</span>
        </div>
      )}

      <div className="flex items-end gap-2 p-2">
        <TextareaAutosize
          className="w-full bg-transparent text-md resize-none focus:outline-none p-2 max-h-40"
          placeholder={isRecording ? "Listening..." : "Ask anything..."}
          onChange={(e) => setInput(e.target.value)}
          value={input}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (input.trim().length >= 3) onSend();
            }
          }}
        />

        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant={isRecording ? "destructive" : "ghost"}
                  size="icon"
                  className="rounded-full hover:bg-muted transition-colors"
                  onClick={handleVoiceToggle}
                >
                  <Mic size={20} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isRecording ? "Stop recording" : "Voice input"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Button
            type="submit"
            variant="default"
            size="icon"
            className="rounded-full bg-tint hover:bg-tint/80 overflow-hidden transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={input.trim().length < 3 || isStreaming}
            onClick={onSend}
          >
            <ArrowUp size={20} />
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between px-3 py-2 border-t bg-muted/20">
        <div className="flex items-center gap-2">
          <ModelSelection />
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="hidden sm:inline">
            {input.length > 0 && `${input.length} chars`}
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">↵</kbd>
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">⌘</kbd>
            to send
          </span>
        </div>
      </div>
    </div>
  );
};

const FollowingUpInput = ({
  input,
  setInput,
  onSend,
  isStreaming,
}: {
  input: string;
  setInput: (input: string) => void;
  onSend: () => void;
  isStreaming: boolean;
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  useState<number | null>(null);

  const handleVoiceToggle = () => {
    if (!isRecording) {
      setIsRecording(true);
      setRecordingTime(0);
      if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
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

        recognition.onend = () => {
          setIsRecording(false);
        };

        (window as any).speechRecognition = recognition;
        recognition.start();
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
    <div className="w-full flex flex-row rounded-full border-2 bg-card/80 backdrop-blur-sm items-center transition-all duration-200 focus-within:border-tint/50">
      {isRecording && (
        <div className="flex items-center gap-2 px-3 border-r">
          <div className="w-3 h-3 rounded-full bg-destructive animate-pulse" />
          <span className="text-xs text-destructive">{formatTime(recordingTime)}</span>
        </div>
      )}

      <TextareaAutosize
        className="w-full bg-transparent text-md resize-none focus:outline-none p-2"
        placeholder={isRecording ? "Listening..." : "Ask a follow-up..."}
        onChange={(e) => setInput(e.target.value)}
        value={input}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (input.trim().length >= 3) onSend();
          }
        }}
      />

      <div className="flex items-center gap-1 pr-2">
        <Button
          type="button"
          variant={isRecording ? "destructive" : "ghost"}
          size="icon"
          className="rounded-full hover:bg-muted h-8 w-8"
          onClick={handleVoiceToggle}
        >
          <Mic size={18} />
        </Button>
        <Button
          type="submit"
          variant="default"
          size="icon"
          className="rounded-full bg-tint hover:bg-tint/80 overflow-hidden h-8 w-8 disabled:opacity-50"
          disabled={input.trim().length < 3 || isStreaming}
          onClick={onSend}
        >
          <ArrowUp size={18} />
        </Button>
      </div>
    </div>
  );
};

export const AskInput = ({
  sendMessage,
  isFollowingUp = false,
}: {
  sendMessage: (message: string) => void;
  isFollowingUp?: boolean;
}) => {
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);

  const handleSend = () => {
    if (input.trim().length < 3) return;
    sendMessage(input);
    setInput("");
  };

  return (
    <form
      className="w-full overflow-hidden"
      onSubmit={(e) => {
        if (input.trim().length < 3) return;
        e.preventDefault();
        handleSend();
      }}
    >
      {isFollowingUp ? (
        <FollowingUpInput
          input={input}
          setInput={setInput}
          onSend={handleSend}
          isStreaming={isStreaming}
        />
      ) : (
        <InputBar
          input={input}
          setInput={setInput}
          onSend={handleSend}
          isStreaming={isStreaming}
        />
      )}
    </form>
  );
};
