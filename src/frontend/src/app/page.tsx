import { ChatPanel } from "@/components/chat-panel";
import { Navbar } from "@/components/nav";
import { Suspense } from "react";

export default function Home() {
  return (
    <div className="app-container">
      <Navbar />
      <main className="app-main pt-16">
        <div className="content-column flex flex-col flex-1 min-h-0">
          <Suspense>
            <ChatPanel />
          </Suspense>
        </div>
        {/* Sources sidebar — populated by ChatPanel via portal */}
        <div id="sources-sidebar" className="hidden lg:block" />
      </main>
    </div>
  );
}
