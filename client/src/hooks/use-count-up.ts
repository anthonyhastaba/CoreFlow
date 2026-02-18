import { useEffect, useRef, useState } from "react";

/**
 * Smoothly animates a displayed number from its previous value to a new target.
 * Triggers whenever `target` changes.
 */
export function useCountUp(target: number, duration = 500) {
  const [displayed, setDisplayed] = useState(target);
  const frameRef = useRef<number | null>(null);
  const startRef = useRef(target);

  useEffect(() => {
    const from = startRef.current;
    const to = target;
    if (from === to) return;

    const startTime = performance.now();
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(from + (to - from) * eased);
      setDisplayed(current);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        startRef.current = to;
        frameRef.current = null;
      }
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, [target, duration]);

  return displayed;
}
