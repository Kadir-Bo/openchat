import { Copy, RefreshCcw, RotateCcw, Loader } from "react-feather";
import ReactMarkdown from "react-markdown";
import { PrimaryButton } from "@/components";

export default function MessageBubble({ message, isStreaming = false }) {
  const isUser = message.role === "user";
  const isAssistant = message.role === "assistant";

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(message.content);
  };

  const regenerateResponse = () => {};

  const userBubbleActions = [
    {
      id: "copy",
      icon: Copy,
      onClick: handleCopyMessage,
    },
    {
      id: "redo",
      icon: RotateCcw,
      onClick: regenerateResponse,
    },
  ];

  const assistantBubbleActions = [
    {
      id: "copy",
      icon: Copy,
      onClick: handleCopyMessage,
    },
    {
      id: "redo",
      icon: RefreshCcw,
      onClick: regenerateResponse,
    },
  ];

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start mb-8"}`}>
      <div
        className={`flex flex-col ${isUser ? "items-end" : "items-start"} w-full`}
      >
        <div
          className={`group flex flex-col relative mb-10 w-full ${isUser ? "items-end" : "items-start"}`}
        >
          <div
            className={`rounded-2xl px-4 py-3 ${
              isUser
                ? "bg-neutral-200 text-neutral-950 max-w-[80%] border"
                : "text-neutral-100"
            }`}
          >
            {/* Message Content */}
            <div className={isAssistant ? "markdown prose-custom" : ""}>
              {isAssistant ? (
                <>
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                  {message.id === "streaming" && (
                    <span className="inline-block w-2 h-4 bg-neutral-400 ml-1 animate-pulse" />
                  )}
                </>
              ) : (
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              )}
            </div>
          </div>

          {/* Controls - don't show for streaming message */}
          {message.id !== "streaming" && (
            <div
              className={`flex text-xs mt-1.5 transition-all duration-150 px-2 absolute top-full ${
                isUser
                  ? "justify-end opacity-0 group-hover:opacity-100"
                  : "justify-start"
              }`}
            >
              {isUser
                ? userBubbleActions.map((action) => (
                    <PrimaryButton
                      key={action.id}
                      className="outline-none border-none shadow-none cursor-pointer p-2.5 text-gray-400 hover:bg-neutral-700/20 hover:text-gray-100 rounded"
                      onClick={action.onClick}
                      text={<action.icon size={16} />}
                    />
                  ))
                : assistantBubbleActions.map((action) => (
                    <PrimaryButton
                      key={action.id}
                      className="outline-none border-none shadow-none cursor-pointer p-2.5 text-gray-400 hover:bg-neutral-700/20 hover:text-gray-100 rounded"
                      onClick={action.onClick}
                      text={<action.icon size={16} />}
                    />
                  ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
