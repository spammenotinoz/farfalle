"use client";

import { useState, useEffect, Suspense } from "react";
import { useParams } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { ChatMessage } from "../../../../generated";
import { ChatPanel } from "@/components/chat-panel";

export default function ChatPage() {
  const { slug } = useParams();
  const threadId = parseInt(slug as string, 10);

  return (
    <div className="h-screen">
      <div className="chat-layout">
        <div className="chat-center">
          <Suspense>
            <ChatPanel threadId={threadId} />
          </Suspense>
        </div>
        <div className="chat-sidebar" id="sources-sidebar-search">
          {/* Sources sidebar — populated by ChatPanel via portal */}
        </div>
      </div>
    </div>
  );
}
