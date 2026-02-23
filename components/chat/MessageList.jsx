import { MessageBubble, ProcessingIndicator } from "..";

export default function MessageList({
  messages,
  currentStreamResponse,
  processingMessage,
  endRef,
  onRegenerate,
  onEdit,
}) {
  return (
    <div className="flex-1 w-full overflow-y-auto py-8 px-4 pt-24 relative">
      <div className="space-y-3 max-w-220 mx-auto">
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            onRegenerate={onRegenerate}
            onEdit={onEdit}
          />
        ))}

        {!!currentStreamResponse?.trim() && (
          <MessageBubble
            message={{
              id: "streaming",
              role: "assistant",
              content: currentStreamResponse,
            }}
            onRegenerate={onRegenerate}
            onEdit={onEdit}
          />
        )}

        {!!processingMessage && (
          <div className="flex justify-start px-1">
            <ProcessingIndicator message={processingMessage} />
          </div>
        )}

        <div ref={endRef} />
      </div>
    </div>
  );
}
