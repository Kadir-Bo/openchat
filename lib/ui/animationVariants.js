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
