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
    <header className="fixed top-0 left-0 right-0 z-50 px-4 py-2.5 bg-background/80 backdrop-blur-md border-b">
      <div className="mx-auto flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={theme === "light" ? "/logo-black.png" : "/logo-white.png"}
            alt="Logo"
            className="w-9 h-9 rounded-lg"
          />
          <span className="text-lg font-semibold hidden sm:block tracking-tight">
            Ultimate Search
          </span>
        </Link>

        {/* Right controls */}
        <div className="flex items-center gap-2">
          <ModeToggle />
          {!onHomePage && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-sm"
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
