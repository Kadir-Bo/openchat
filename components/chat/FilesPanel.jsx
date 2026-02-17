"use client";

import { useRef, useState } from "react";
import { PrimaryButton } from "@/components";
import { FileText, Plus, Trash2, Upload } from "react-feather";
import { fileTypeLabel, formatBytes } from "@/lib";

const ACCEPTED =
  ".txt,.md,.json,.js,.jsx,.ts,.tsx,.py,.java,.cpp,.c,.cs,.rb,.go,.rs,.php,.html,.css,.scss,.xml,.yaml,.yml,.csv,.pdf";
const MAX_SIZE = 2 * 1024 * 1024;

export default function FilesPanel({
  project,
  onAddDocument,
  onRemoveDocument,
}) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");

  const documents = project.documents ?? [];
  const isEmpty = documents.length === 0;

  const readFileAsText = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = () => reject(new Error("Could not read file"));
      reader.readAsText(file);
    });

  const handleFiles = async (files) => {
    setError("");
    const file = files[0];
    if (!file) return;

    if (file.size > MAX_SIZE) {
      setError(`File too large — max 2 MB (got ${formatBytes(file.size)})`);
      return;
    }

    setUploading(true);
    try {
      const content = await readFileAsText(file);
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "txt";
      await onAddDocument({ title: file.name, type: ext, content });
    } catch {
      setError("Failed to read file. Only text-based files are supported.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div>
      {/* header */}
      <div className="flex justify-between items-center px-6 pt-6 pb-4">
        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-medium text-neutral-100">Files</h3>
          <p className="text-neutral-500 text-xs">
            {isEmpty
              ? "Shared across all chats in this project"
              : `${documents.length} file${documents.length > 1 ? "s" : ""} · shared across all chats`}
          </p>
        </div>
        {!isEmpty && (
          <PrimaryButton
            text={<Plus size={15} />}
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            tooltip="Upload file"
            className="outline-none border-none shadow-none cursor-pointer p-1.5 text-gray-400 hover:bg-neutral-700/20 hover:text-gray-100 rounded w-max min-w-max"
          />
        )}
      </div>

      <div className="px-4 pb-5 flex flex-col gap-1">
        {/* file list — only when files exist */}
        {!isEmpty && (
          <ul className="flex flex-col gap-0.5 mb-2">
            {documents.map((doc) => (
              <li
                key={doc.id}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 hover:bg-neutral-800/60 group transition-colors"
              >
                <FileText size={13} className="text-neutral-600 shrink-0" />
                <span className="text-sm text-neutral-300 truncate flex-1 leading-none">
                  {doc.title}
                </span>
                <span className="text-xs text-neutral-700 shrink-0 group-hover:hidden font-mono">
                  {fileTypeLabel(doc.type)}
                </span>
                <button
                  onClick={() => onRemoveDocument(doc.id)}
                  className="hidden group-hover:flex items-center justify-center text-neutral-600 hover:text-red-400 transition-colors shrink-0"
                  title="Remove file"
                >
                  <Trash2 size={12} />
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* drop zone — replaces empty state, compact add-more when files exist */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => fileInputRef.current?.click()}
          className={`
            border border-dashed rounded-xl cursor-pointer transition-all duration-200
            flex items-center justify-center gap-3
            ${isEmpty ? "p-8 flex-col" : "px-4 py-3"}
            ${
              dragOver
                ? "border-neutral-500 bg-neutral-800/40"
                : "border-neutral-800 hover:border-neutral-700 hover:bg-neutral-800/20"
            }
          `}
        >
          <Upload
            size={isEmpty ? 18 : 13}
            className={`shrink-0 transition-colors ${dragOver ? "text-neutral-300" : "text-neutral-700"}`}
          />
          {isEmpty ? (
            <div className="flex flex-col items-center gap-1 text-center">
              <p
                className={`text-xs transition-colors ${dragOver ? "text-neutral-300" : "text-neutral-600"}`}
              >
                {uploading ? "Uploading…" : "Drop a file or click to browse"}
              </p>
              <p className="text-xs text-neutral-800">
                .txt .md .json .js .ts .py .html + more · max 2 MB
              </p>
            </div>
          ) : (
            <p
              className={`text-xs transition-colors ${dragOver ? "text-neutral-300" : "text-neutral-700"}`}
            >
              {uploading ? "Uploading…" : "Add another file"}
            </p>
          )}
        </div>

        {error && <p className="text-xs text-red-400 mt-1 px-1">{error}</p>}

        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED}
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />
      </div>
    </div>
  );
}
