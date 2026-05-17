import { useEffect } from "react";

export function useBodyScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;

    const { body } = document;
    const previousOverflow = body.style.overflow;
    const previousTouchAction = body.style.touchAction;

    body.classList.add("admin-modal-open");
    body.style.overflow = "hidden";
    body.style.touchAction = "none";

    return () => {
      body.classList.remove("admin-modal-open");
      body.style.overflow = previousOverflow;
      body.style.touchAction = previousTouchAction;
    };
  }, [locked]);
}
