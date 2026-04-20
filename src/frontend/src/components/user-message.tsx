import { memo } from "react";
import { ChatMessage } from "../../generated";

export const UserMessageContent = memo(({ message }: { message: ChatMessage }) => (
  <div className="py-6 animate-message-in">
    <h2 className="text-2xl md:text-3xl font-bold leading-snug text-foreground tracking-tight">
      {message.content}
    </h2>
  </div>
));

UserMessageContent.displayName = "UserMessageContent";
