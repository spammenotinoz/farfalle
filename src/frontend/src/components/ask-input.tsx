"use client";

import TextareaAutosize from "react-textarea-autosize";
import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "./ui/button";
import { ArrowUp, Mic, ImagePlus, X } from "lucide-react";
import { ModelSelection } from "./model-selection";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { motion, AnimatePresence } from "framer-motion";

interface Attachment {
  id: string;
  type: "image";
  url: string;
  file?: File;
}

const InputBar = ({
  input,
  setInput,
  attachments,
  onRemoveAttachment,
  onSend,
  isStreaming,
}: {
  input: string;
  setInput: (input: string) => void;
  attachments: Attachment[];
  onRemoveAttachment: (id: string) => void;
  onSend: () => void;
  isStreaming: boolean;
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files) {
        const newAttachments: Attachment[] = Array.from(files).map((file) => ({
          id: Math.random().toString(36).substr(2, 9),
          type: "image",
          url: URL.createObjectURL(file),
          file,
        }));
        // In a real implementation, we'd upload these to the server
        // For now, we'll just use the local URLs
      }
      e.target.value = "";
    },
    [],
  );

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleVoiceToggle = () => {
    if (!isRecording) {
      // Start recording
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
      // Stop recording
      if ((window as any).speechRecognition) {
        (window as any).speechRecognition.stop();
      }
      setIsRecording(false);
    }
  };

  const canSend = input.trim().length >= 3 || attachments.length > 0;

  return (
    <div className="w-full flex flex-col rounded-2xl border-2 bg-card/80 backdrop-blur-sm transition-all duration-200 focus-within:border-tint/50 focus-within:shadow-lg">
      <AnimatePresence>
        {attachments.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-wrap gap-2 p-3 border-b"
          >
            {attachments.map((attachment) => (
              <motion.div
                key={attachment.id}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="relative group"
              >
                <img
                  src={attachment.url}
                  alt="Attachment"
                  className="w-20 h-20 object-cover rounded-lg"
                />
                <button
                  onClick={() => onRemoveAttachment(attachment.id)}
                  className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={12} />
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {isRecording && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="flex items-center gap-3 px-4 py-2 border-b bg-destructive/5"
        >
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-destructive animate-pulse" />
            <span className="text-sm font-medium text-destructive">
              {formatTime(recordingTime)}
            </span>
          </div>
          <span className="text-sm text-muted-foreground">Listening...</span>
        </motion.div>
      )}

      <div className="flex items-end gap-2 p-2">
        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="rounded-full hover:bg-muted"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImagePlus size={20} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Attach image</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>

        <TextareaAutosize
          className="w-full bg-transparent text-md resize-none focus:outline-none p-2 max-h-40"
          placeholder={
            isRecording
              ? "Listening..."
              : "Ask anything or paste an image URL..."
          }
          onChange={(e) => setInput(e.target.value)}
          value={input}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (canSend) onSend();
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
            disabled={!canSend || isStreaming}
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
  attachments,
  onRemoveAttachment,
  onSend,
  isStreaming,
}: {
  input: string;
  setInput: (input: string) => void;
  attachments: Attachment[];
  onRemoveAttachment: (id: string) => void;
  onSend: () => void;
  isStreaming: boolean;
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files) {
        const newAttachments: Attachment[] = Array.from(files).map((file) => ({
          id: Math.random().toString(36).substr(2, 9),
          type: "image",
          url: URL.createObjectURL(file),
          file,
        }));
      }
      e.target.value = "";
    },
    [],
  );

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

  const canSend = input.trim().length >= 3 || attachments.length > 0;

  return (
    <div className="w-full flex flex-row rounded-full border-2 bg-card/80 backdrop-blur-sm items-center transition-all duration-200 focus-within:border-tint/50">
      <div className="flex items-center gap-1 pl-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="rounded-full hover:bg-muted h-8 w-8"
          onClick={() => fileInputRef.current?.click()}
        >
          <ImagePlus size={18} />
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>

      <TextareaAutosize
        className="w-full bg-transparent text-md resize-none focus:outline-none p-2"
        placeholder={
          isRecording ? "Listening..." : "Ask a follow-up..."
        }
        onChange={(e) => setInput(e.target.value)}
        value={input}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (canSend) onSend();
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
          disabled={!canSend || isStreaming}
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
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  const handleSend = () => {
    if (input.trim().length < 3 && attachments.length === 0) return;
    sendMessage(input);
    setInput("");
    setAttachments([]);
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <>
      <form
        className="w-full overflow-hidden"
        onSubmit={(e) => {
          if (input.trim().length < 3 && attachments.length === 0) return;
          e.preventDefault();
          handleSend();
        }}
      >
        {isFollowingUp ? (
          <FollowingUpInput
            input={input}
            setInput={setInput}
            attachments={attachments}
            onRemoveAttachment={handleRemoveAttachment}
            onSend={handleSend}
            isStreaming={isStreaming}
          />
        ) : (
          <InputBar
            input={input}
            setInput={setInput}
            attachments={attachments}
            onRemoveAttachment={handleRemoveAttachment}
            onSend={handleSend}
            isStreaming={isStreaming}
          />
        )}
      </form>
    </>
  );
};
