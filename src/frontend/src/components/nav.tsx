"use client";

import Link from "next/link";
import { ModeToggle } from "./mode-toggle";
import { useTheme } from "next-themes";
import { Button } from "./ui/button";
import { HistoryIcon, PlusIcon, Search, Command } from "lucide-react";
import { useChatStore } from "@/stores";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { cn } from "@/lib/utils";

const NewChatButton = () => {
  const router = useRouter();
  return (
    <Button
      variant="secondary"
      size="sm"
      className="gap-2"
      onClick={() => router.push("/")}
    >
      <PlusIcon className="w-4 h-4" />
      <span className="hidden sm:inline">New</span>
    </Button>
  );
};

const TextLogo = () => {
  return (
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 rounded-lg bg-tint/10 flex items-center justify-center">
        <Search className="w-5 h-5 text-tint" />
      </div>
      <span className="text-xl font-semibold hidden sm:block">Ultimate Search</span>
    </div>
  );
};

const keyboardShortcuts = [
  { key: "Ctrl + Enter", description: "Send message" },
  { key: "Ctrl + /", description: "Focus search" },
  { key: "Ctrl + K", description: "Quick actions" },
  { key: "Esc", description: "Close dialog" },
];

export function Navbar() {
  const router = useRouter();
  const { theme } = useTheme();
  const { messages } = useChatStore();
  const [showShortcuts, setShowShortcuts] = useState(false);

  const onHomePage = messages.length === 0;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "/") {
        e.preventDefault();
        setShowShortcuts(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 px-4 py-2 bg-background/80 backdrop-blur-md border-b">
        <div className="mx-auto max-w-screen-md flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" passHref className="flex items-center gap-2">
              <img
                src={theme === "light" ? "/logo-black.png" : "/logo-white.png"}
                alt="Logo"
                className="w-10 h-10 rounded-lg"
              />
              <span className="text-xl font-semibold hidden sm:block">
                Ultimate Search
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            {onHomePage && (
              <Dialog open={showShortcuts} onOpenChange={setShowShortcuts}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-muted-foreground">
                    <Command className="w-4 h-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Command className="w-5 h-5" />
                      Keyboard Shortcuts
                    </DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-3 py-4">
                    {keyboardShortcuts.map((shortcut) => (
                      <div
                        key={shortcut.key}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm text-muted-foreground">
                          {shortcut.description}
                        </span>
                        <kbd className="px-2 py-1 bg-muted rounded-md text-xs font-mono">
                          {shortcut.key}
                        </kbd>
                      </div>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
            )}

            {onHomePage && (
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground"
                onClick={() => router.push("/history")}
              >
                <HistoryIcon className="w-5 h-5" />
              </Button>
            )}

            <ModeToggle />

            {!onHomePage && <NewChatButton />}
          </div>
        </div>
      </header>
    </>
  );
}
