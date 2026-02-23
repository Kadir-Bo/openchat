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
