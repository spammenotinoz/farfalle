import { memo } from "react";
import { ChatMessage } from "../../generated";

export const UserMessageContent = memo(({ message }: { message: ChatMessage }) => (
  <div className="my-4 animate-message-in">
    <h2 className="text-xl md:text-2xl font-semibold leading-tight text-foreground">
      {message.content}
    </h2>
  </div>
));

UserMessageContent.displayName = "UserMessageContent";
