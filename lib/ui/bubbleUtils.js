// Chat Bubble Radius Calculation
export const getBubbleRadius = (content = "") => {
  const lines = content.trim().split("\n").length;
  const chars = content.trim().length;
  if (lines === 1 && chars <= 60) return 8;
  if (lines <= 2 && chars <= 120) return 18;
  return 22;
};
// Get code Text
export const getCodeText = (children) => {
  if (typeof children === "string") return children;
  if (Array.isArray(children)) return children.map(getCodeText).join("");
  if (children?.props?.children) return getCodeText(children.props.children);
  return String(children ?? "");
};

export function copyToClipboard(text) {
  const el = document.createElement("textarea");
  el.value = text;
  el.style.cssText = "position:fixed;top:-9999px;left:-9999px;opacity:0;";
  el.setAttribute("readonly", "");
  document.body.appendChild(el);
  const range = document.createRange();
  range.selectNodeContents(el);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
  el.setSelectionRange(0, text.length);
  document.execCommand("copy");
  document.body.removeChild(el);
}
