export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function fileTypeLabel(type) {
  const map = {
    js: "JS",
    jsx: "JSX",
    ts: "TS",
    tsx: "TSX",
    py: "PY",
    java: "Java",
    cpp: "C++",
    c: "C",
    cs: "C#",
    rb: "Ruby",
    go: "Go",
    rs: "Rust",
    php: "PHP",
    html: "HTML",
    css: "CSS",
    scss: "SCSS",
    json: "JSON",
    xml: "XML",
    yaml: "YAML",
    yml: "YAML",
    csv: "CSV",
    md: "MD",
    txt: "TXT",
    pdf: "PDF",
  };
  return map[type?.toLowerCase()] ?? type?.toUpperCase() ?? "File";
}

export const detectAttachmentType = (text, fileName = "") => {
  const extension = fileName.split(".").pop()?.toLowerCase();

  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(extension)) {
    return "image";
  }

  if (
    ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx"].includes(extension)
  ) {
    return "document";
  }

  const hasMultipleLines = text.includes("\n");
  const looksLikeCode =
    /[{}\[\]();]/.test(text) ||
    /^\s*(function|const|let|var|class|import|export|def|public|private|package|interface)/m.test(
      text,
    );

  if (
    (hasMultipleLines && text.split("\n").length > 3 && looksLikeCode) ||
    [
      "js",
      "jsx",
      "ts",
      "tsx",
      "py",
      "java",
      "cpp",
      "c",
      "css",
      "html",
    ].includes(extension)
  ) {
    return "code";
  }

  if (["txt", "md", "json", "xml", "csv"].includes(extension)) {
    return "text";
  }

  return "file";
};

/**
 * Creates an attachment object from a file
 */
export const createAttachment = (
  file,
  type,
  content = null,
  preview = null,
) => {
  return {
    id: Date.now() + Math.random(),
    type,
    name: file.name,
    content,
    preview,
    file,
  };
};

/**
 * Creates an attachment object from pasted content
 */
export const createPastedAttachment = (type, name, content, preview = null) => {
  return {
    id: Date.now(),
    type,
    name,
    content,
    preview,
    file: null,
  };
};

/**
 * Accepted file types for file input
 */
export const ACCEPTED_FILE_TYPES =
  "image/*,.pdf,.doc,.docx,.txt,.md,.json,.js,.jsx,.ts,.tsx,.py,.java,.cpp,.c,.css,.html";
