"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import { ChatPanel } from "@/components/chat-panel";

export default function ChatPage() {
  const { slug } = useParams();
  const threadId = parseInt(slug as string, 10);

  return (
    <div className="app-container">
      <main className="app-main pt-16">
        <div className="content-column flex flex-col flex-1 min-h-0">
          <Suspense>
            <ChatPanel threadId={threadId} />
          </Suspense>
        </div>
        <div id="sources-sidebar-search" className="hidden lg:block" />
      </main>
    </div>
  );
}
