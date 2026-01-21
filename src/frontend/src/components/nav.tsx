"use client";

import Link from "next/link";
import { ModeToggle } from "./mode-toggle";
import { useTheme } from "next-themes";
import { Button } from "./ui/button";
import { PlusIcon, Search } from "lucide-react";
import { useChatStore } from "@/stores";
import { useRouter } from "next/navigation";

const NewChatButton = () => {
  const router = useRouter();
  const { clearMessages } = useChatStore();
  return (
    <Button
      variant="secondary"
      size="sm"
      className="gap-2"
      onClick={() => {
        clearMessages();
        router.push("/");
      }}
    >
      <PlusIcon className="w-4 h-4" />
      <span className="hidden sm:inline">New</span>
    </Button>
  );
};

export function Navbar() {
  const router = useRouter();
  const { theme } = useTheme();
  const { messages } = useChatStore();
  const onHomePage = messages.length === 0;

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 px-4 py-2 bg-background/80 backdrop-blur-md border-b">
        <div className="mx-auto max-w-screen-md flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
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
            <ModeToggle />
            {!onHomePage && <NewChatButton />}
          </div>
        </div>
      </header>
    </>
  );
}
