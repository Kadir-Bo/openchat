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

export const getTitle = (pathname) => {
  if (pathname === "/chat" || pathname === "/") return "New Chat";
  if (pathname.startsWith("/chat/")) return "Chat";
  if (pathname.startsWith("/project/")) return "Project";
  if (pathname === "/projects") return "Projects"; // ← add
  if (pathname === "/chats") return "Chats";
  if (pathname === "/archive") return "Archive";
  if (pathname.startsWith("/settings/")) return "Settings";
  return "";
};
