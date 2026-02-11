/**
 * Detects the type of attachment based on file extension and content
 */
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
 * Inserts text at cursor position in textarea
 */
export const insertTextAtCursor = (
  currentValue,
  textToInsert,
  textarea,
  callback,
) => {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;

  const newValue =
    currentValue.substring(0, start) +
    textToInsert +
    currentValue.substring(end);

  callback(newValue);

  setTimeout(() => {
    textarea.selectionStart = textarea.selectionEnd =
      start + textToInsert.length;
    textarea.focus();
  }, 0);
};

/**
 * Animation variants for the container
 */
export const getContainerVariant = (textAreaGrowHeight) => ({
  initial: {
    borderRadius: 30,
    height: "auto",
  },
  animate: {
    borderRadius: 32,
    height: textAreaGrowHeight,
  },
});

/**
 * Animation variants for the textarea
 */
export const getTextAreaVariant = (buttonContainerHeight) => ({
  initial: {
    position: "relative",
  },
  animate: {
    position: "absolute",
    left: 8,
    top: 8,
    right: 8,
    bottom: buttonContainerHeight + 8,
  },
});

/**
 * Accepted file types for file input
 */
export const ACCEPTED_FILE_TYPES =
  "image/*,.pdf,.doc,.docx,.txt,.md,.json,.js,.jsx,.ts,.tsx,.py,.java,.cpp,.c,.css,.html";
