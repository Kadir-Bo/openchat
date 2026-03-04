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
  if (pathname === "/projects") return "Projects";
  if (pathname === "/chats") return "Chats";
  if (pathname === "/archive") return "Archive";
  if (pathname.startsWith("/settings/")) return "Settings";
  return "";
};

export function compressAndEncodeImage(file, maxSize = 256, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;
      if (width > height) {
        if (width > maxSize) {
          height = Math.round((height * maxSize) / width);
          width = maxSize;
        }
      } else {
        if (height > maxSize) {
          width = Math.round((width * maxSize) / height);
          height = maxSize;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d").drawImage(img, 0, 0, width, height);

      resolve(canvas.toDataURL("image/jpeg", quality));
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };

    img.src = url;
  });
}
