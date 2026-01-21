import { ChatPanel } from "@/components/chat-panel";
import { Navbar } from "@/components/nav";
import { Suspense } from "react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16">
        <div className="flex grow mx-auto max-w-screen-md px-4 md:px-8">
          <Suspense>
            <ChatPanel />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
