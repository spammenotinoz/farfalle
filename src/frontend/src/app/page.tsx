import { ChatPanel } from "@/components/chat-panel";
import { Navbar } from "@/components/nav";
import { Suspense } from "react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16">
        <div className="chat-layout">
          <div className="chat-center">
            <Suspense>
              <ChatPanel />
            </Suspense>
          </div>
          <div className="chat-sidebar" id="sources-sidebar">
            {/* Sources sidebar — populated by ChatPanel via portal */}
          </div>
        </div>
      </main>
    </div>
  );
}
