import { useEffect, useRef } from "react";

export default function useIdleLogout({ timeoutMs, onTimeout }) {
  const timerRef = useRef(null);

  const reset = () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      onTimeout?.();
    }, timeoutMs);
  };

  useEffect(() => {
    const events = ["mousemove", "mousedown", "keydown", "touchstart", "scroll", "pointerdown"];

    const handler = () => reset();

    events.forEach((evt) => window.addEventListener(evt, handler, { passive: true }));
    reset();

    return () => {
      events.forEach((evt) => window.removeEventListener(evt, handler));
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeoutMs]);
}