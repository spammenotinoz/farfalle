"use client";

import Link from "next/link";
import { ModeToggle } from "./mode-toggle";
import { useTheme } from "next-themes";
import { Button } from "./ui/button";
import { PlusIcon } from "lucide-react";
import { useChatStore, chatStore } from "@/stores";
import { useRouter } from "next/navigation";

export function Navbar() {
  const router = useRouter();
  const { theme } = useTheme();
  const { messages } = useChatStore();
  const onHomePage = messages.length === 0;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center px-5 bg-background/80 backdrop-blur-md border-b border-border/60">
      <div className="w-full flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={theme === "light" ? "/logo-black.png" : "/logo-white.png"}
            alt="Logo"
            className="w-8 h-8 rounded-lg"
          />
          <span className="text-base font-semibold hidden sm:block tracking-tight text-foreground">
            Ultimate Search
          </span>
        </Link>

        {/* Right controls */}
        <div className="flex items-center gap-1.5">
          <ModeToggle />
          {!onHomePage && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-sm font-medium h-8 px-3"
              onClick={() => {
                chatStore.getState().clearMessages();
                router.push("/");
              }}
            >
              <PlusIcon className="w-4 h-4" />
              <span className="hidden sm:inline">New</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
