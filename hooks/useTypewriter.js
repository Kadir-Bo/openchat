const { useState, useRef, useEffect } = require("react");

const TYPE_SPEED = 47; // ms per character while typing
const DELETE_SPEED = 22; // ms per character while deleting
const PAUSE_AFTER = 1800; // ms to hold the completed phrase
const PAUSE_BEFORE = 400; // ms to pause on empty string before next phrase

export function useTypewriter(phrases) {
  const [displayed, setDisplayed] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [index, setIndex] = useState(0);
  const timeoutRef = useRef(null);

  useEffect(() => {
    const phrase = phrases[index % phrases.length];

    const tick = () => {
      if (!isDeleting) {
        if (displayed.length < phrase.length) {
          setDisplayed(phrase.slice(0, displayed.length + 1));
          timeoutRef.current = setTimeout(tick, TYPE_SPEED);
        } else {
          // Phrase complete — pause, then delete
          timeoutRef.current = setTimeout(
            () => setIsDeleting(true),
            PAUSE_AFTER,
          );
        }
      } else {
        if (displayed.length > 0) {
          setDisplayed(phrase.slice(0, displayed.length - 1));
          timeoutRef.current = setTimeout(tick, DELETE_SPEED);
        } else {
          // Fully deleted — pause, then move to next phrase
          setIsDeleting(false);
          setIndex((i) => (i + 1) % phrases.length);
          timeoutRef.current = setTimeout(tick, PAUSE_BEFORE);
        }
      }
    };

    timeoutRef.current = setTimeout(
      tick,
      isDeleting ? DELETE_SPEED : TYPE_SPEED,
    );
    return () => clearTimeout(timeoutRef.current);
    // displayed / isDeleting / index are the true reactive triggers here;
    // phrases is stable (module-level constant) so we omit it intentionally.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayed, isDeleting, index]);

  return displayed;
}
