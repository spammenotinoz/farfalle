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

      {/* Centered nav links — Perplexity style */}
      <nav className="absolute left-1/2 -translate-x-1/2 hidden md:flex items-center gap-6">
        {[
          { href: "/", label: "Home" },
          { href: "/search/history", label: "Library" },
        ].map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            {label}
          </Link>
        ))}
      </nav>

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
