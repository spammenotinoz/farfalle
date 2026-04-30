"use client";

import Link from "next/link";
import { ModeToggle } from "./mode-toggle";
import { Button } from "./ui/button";
import { PlusIcon, SearchCheck } from "lucide-react";
import { useChatStore, chatStore } from "@/stores";
import { useRouter } from "next/navigation";

export function Navbar() {
  const router = useRouter();
  const { messages } = useChatStore();
  const hasMessages = messages.length > 0;

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center px-6"
      style={{
        background: "hsl(var(--background) / 0.85)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid hsl(var(--border) / 0.5)",
      }}
    >
      {/* Logo */}
      <Link
        href="/"
        className="flex items-center gap-2.5 flex-shrink-0"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-foreground text-background">
          <SearchCheck size={17} />
        </div>
        <span className="text-base font-semibold hidden sm:block text-foreground">
          Research
        </span>
      </Link>

      {/* Right controls */}
      <div className="ml-auto flex items-center gap-2">
        <ModeToggle />
        {hasMessages && (
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-sm font-medium h-8 px-3 hover:bg-muted transition-colors"
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
    </header>
  );
}
