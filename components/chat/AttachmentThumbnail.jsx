"use client";

import { X, File, Image as ImageIcon, FileText, Code } from "react-feather";
import { motion } from "framer-motion";
import Image from "next/image";

export default function AttachmentThumbnail({
  attachment,
  onRemove = null,
  className = "",
  readOnly = false,
}) {
  const { type, content, name, preview } = attachment;

  const renderThumbnail = () => {
    switch (type) {
      case "code":
        return <CodePreview content={content} />;

      case "image":
        return <ImagePreview preview={preview} name={name} />;

      case "document":
        return <DocumentPreview name={name} />;

      case "text":
        return <TextPreview content={content} name={name} />;

      default:
        return <GenericFilePreview name={name} />;
    }
  };

  const getIcon = () => {
    switch (type) {
      case "code":
        return <Code size={10} className="text-blue-400" />;
      case "image":
        return <ImageIcon size={10} className="text-green-400" />;
      case "document":
        return <File size={10} className="text-purple-400" />;
      case "text":
        return <FileText size={10} className="text-yellow-400" />;
      default:
        return <File size={10} className="text-neutral-400" />;
    }
  };

  // Render the content directly instead of as a nested component
  const thumbnailContent = (
    <div
      className={`relative bg-neutral-900 border border-neutral-800 rounded-xl w-30 overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-2 py-1 border-b border-neutral-800">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {getIcon()}
          <span className="text-xs text-neutral-300 truncate font-medium">
            {name || "Attachment"}
          </span>
        </div>
        {!readOnly && onRemove && (
          <button
            onClick={onRemove}
            className="p-1 rounded hover:bg-neutral-800 transition-colors shrink-0 cursor-pointer"
            aria-label="Remove attachment"
          >
            <X size={14} className="text-neutral-400" />
          </button>
        )}
      </div>

      {/* Preview */}
      <div>{renderThumbnail()}</div>
    </div>
  );

  // Only animate when not read-only (during input)
  if (readOnly) {
    return thumbnailContent;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      {thumbnailContent}
    </motion.div>
  );
}

// Code Preview Component
function CodePreview({ content }) {
  const lines = content.split("\n");
  const preview = lines.slice(0, 4).join("\n");
  const hasMore = lines.length > 4;

  return (
    <div className="relative bg-neutral-950 rounded p-2 h-20 overflow-hidden">
      <pre className="text-[10px] font-mono text-neutral-400 overflow-hidden">
        <code className="whitespace-pre-wrap break-all">
          {preview}
          {hasMore && (
            <span className="text-neutral-600">
              {"\n"}+{lines.length - 4} more lines
            </span>
          )}
        </code>
      </pre>
    </div>
  );
}

// Image Preview Component
function ImagePreview({ preview, name }) {
  return (
    <div className="relative w-full h-20 bg-neutral-950 rounded overflow-hidden">
      <Image
        src={preview}
        alt={name || "Uploaded image"}
        fill
        className="object-cover"
      />
    </div>
  );
}

// Document Preview Component
function DocumentPreview({ name }) {
  const extension = name?.split(".").pop()?.toUpperCase() || "DOC";

  return (
    <div className="flex items-center gap-3 p-3 bg-neutral-950 rounded">
      <div className="w-12 h-12 bg-purple-500/10 rounded flex items-center justify-center">
        <span className="text-xs font-bold text-purple-400">{extension}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-neutral-300 truncate">{name}</p>
        <p className="text-[10px] text-neutral-500">Document</p>
      </div>
    </div>
  );
}

// Text Preview Component
function TextPreview({ content, name }) {
  const preview = content.slice(0, 150);
  const hasMore = content.length > 150;

  return (
    <div className="relative bg-neutral-950 rounded p-2 max-h-20 overflow-hidden">
      <p className="text-[10px] text-neutral-400 whitespace-pre-wrap wrap-break-words">
        {preview}
        {hasMore && <span className="text-neutral-600">...</span>}
      </p>
    </div>
  );
}

// Generic File Preview Component
function GenericFilePreview({ name }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-neutral-950 rounded">
      <div className="w-12 h-12 bg-neutral-700/50 rounded flex items-center justify-center">
        <File size={20} className="text-neutral-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-neutral-300 truncate">{name}</p>
        <p className="text-[10px] text-neutral-500">File</p>
      </div>
    </div>
  );
}
