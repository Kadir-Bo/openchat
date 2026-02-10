import { Copy, RefreshCcw, RotateCcw, Loader } from "react-feather";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import { PrimaryButton, AttachmentThumbnail } from "@/components";
import "highlight.js/styles/github-dark.css";

export default function MessageBubble({ message, isStreaming = false }) {
  const isUser = message.role === "user";
  const isAssistant = message.role === "assistant";

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(message.content);
  };

  const regenerateResponse = () => {};

  // Helper function to extract text from React children
  const getCodeText = (children) => {
    if (typeof children === "string") {
      return children;
    }

    if (Array.isArray(children)) {
      return children.map(getCodeText).join("");
    }

    if (children?.props?.children) {
      return getCodeText(children.props.children);
    }

    return String(children || "");
  };

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
          {/* Attachments - Show above user message */}
          {isUser && message.attachments && message.attachments.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2 max-w-[80%]">
              {message.attachments.map((attachment) => (
                <AttachmentThumbnail
                  key={attachment.id}
                  attachment={attachment}
                  className="max-w-xs"
                  readOnly
                />
              ))}
            </div>
          )}

          <div
            className={`rounded-2xl px-4 py-3 ${
              isUser
                ? "bg-neutral-200 text-neutral-950 max-w-[80%] border"
                : "text-neutral-100"
            }`}
          >
            {/* Message Content */}
            <div
              className={
                isAssistant ? "markdown prose prose-invert max-w-none" : ""
              }
            >
              {isAssistant ? (
                <>
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeHighlight, rehypeRaw]}
                    components={{
                      // Override paragraph to use div instead
                      p: ({ children }) => (
                        <div className="mb-4 last:mb-0">{children}</div>
                      ),

                      // Override pre to add copy button wrapper
                      pre: ({ children }) => (
                        <div className="relative group/code my-4">
                          <button
                            onClick={() => {
                              const codeText = getCodeText(children);
                              navigator.clipboard.writeText(codeText);
                            }}
                            className="absolute right-2 top-2 opacity-0 group-hover/code:opacity-100 transition-opacity p-1.5 rounded bg-neutral-700 hover:bg-neutral-600 z-10 cursor-pointer"
                          >
                            <Copy size={14} />
                          </button>
                          <pre className="overflow-x-auto">{children}</pre>
                        </div>
                      ),
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                  {message.id === "streaming" && (
                    <span className="inline-block w-2 h-4 bg-neutral-400 ml-1 animate-pulse" />
                  )}
                </>
              ) : (
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              )}
            </div>
          </div>

          {/* Controls  */}
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
