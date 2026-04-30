"use client";

import { ErrorMessage } from "@/components/assistant-message";
import RecentChat from "@/components/recent-chat";
import { Separator } from "@/components/ui/separator";
import { useChatHistory } from "@/hooks/history";
import { HistoryIcon, Search } from "lucide-react";
import React from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Navbar } from "@/components/nav";
import { Skeleton } from "@/components/ui/skeleton";

export default function RecentsPage() {
  const { data: chats, isLoading, error } = useChatHistory();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="mx-auto max-w-3xl pt-20 px-4 pb-16">
          <div className="flex items-center space-x-3 mb-6">
            <HistoryIcon className="w-6 h-6 text-tint" />
            <h1 className="text-2xl font-semibold">Chat History</h1>
          </div>
          <Separator className="mb-6" />
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="p-4">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-3xl pt-20 px-4 pb-16">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-md bg-tint/10 flex items-center justify-center">
              <HistoryIcon className="w-5 h-5 text-tint" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold">Chat History</h1>
              <p className="text-sm text-muted-foreground">
                {chats?.length || 0} conversations
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Search size={16} />
              <span className="hidden sm:inline">Search</span>
            </Button>
          </div>
        </div>

        <Separator className="mb-6" />

        {error && <ErrorMessage content={error.message} />}

        {chats && chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <HistoryIcon className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-medium mb-2">No conversations yet</h2>
            <p className="text-sm text-muted-foreground max-w-sm">
              Start a new conversation by asking a question on the home page.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => window.location.href = "/"}
            >
              Start a new chat
            </Button>
          </div>
        ) : (
          <ul className="space-y-3">
            {chats?.map((chat, index) => (
              <motion.div
                key={chat.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <RecentChat {...chat} />
                {index < (chats?.length || 0) - 1 && (
                  <Separator className="mt-3 opacity-50" />
                )}
              </motion.div>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
