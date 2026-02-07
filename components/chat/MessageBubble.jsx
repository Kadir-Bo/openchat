import { Copy, Repeat, RotateCcw } from "react-feather";
import ReactMarkdown from "react-markdown";
import { MessageBubbleControlls } from "..";

export default function MessageBubble({ message }) {
  const isUser = message.role === "user";
  const isAssistant = message.role === "assistant";
  const handleCopyMessage = () => {};
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
      icon: Repeat,
      onClick: regenerateResponse,
    },
  ];

  return (
    <div
      className={`flex ${isUser ? "justify-end" : "justify-start mb-8"} w-full max-w-4xl mx-auto`}
    >
      <div
        className={`flex flex-col ${isUser ? "items-end" : "items-start"} w-full`}
      >
        <div
          className={`rounded-2xl px-4 py-3 ${
            isUser
              ? "bg-neutral-200 text-neutral-950 max-w-[80%]"
              : "text-neutral-100"
          }`}
        >
          {/* Message Content */}
          <div className={isAssistant ? "markdown prose-custom" : ""}>
            {isAssistant ? (
              <ReactMarkdown>{message.content}</ReactMarkdown>
            ) : (
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            )}
          </div>
        </div>
        {/* Controlls */}
        <div
          className={`flex gap-2 text-xs mt-2 opacity-100 group-hover:opacity-100 transition-all duration-150 px-2 ${
            isUser ? "justify-end" : "justify-start"
          }`}
        >
          {isUser
            ? userBubbleActions.map((action) => (
                <button
                  key={action.id}
                  className="outline-none cursor-pointer text-gray-400 p-1 hover:text-gray-300 transition-all duration-75"
                  onClick={action.onClick}
                >
                  <action.icon size={14} />
                </button>
              ))
            : assistantBubbleActions.map((action) => (
                <button
                  key={action.id}
                  className="outline-none cursor-pointer text-gray-400 p-1 hover:text-gray-300 transition-all duration-75"
                  onClick={action.onClick}
                >
                  <action.icon size={14} />
                </button>
              ))}
        </div>
      </div>
    </div>
  );
}
