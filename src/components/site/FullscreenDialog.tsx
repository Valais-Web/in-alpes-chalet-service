import { useEffect, useRef, type ReactNode } from "react";

/** Native modal semantics provide focus containment, Escape and an inert page. */
export function FullscreenDialog({
  label,
  onClose,
  className,
  children,
}: {
  label: string;
  onClose: () => void;
  className: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) {
        previousFocus.focus({ preventScroll: true });
      }
    };
  }, []);

  return (
    <dialog
      ref={ref}
      aria-label={label}
      className={"fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none border-0 " + className}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      {children}
    </dialog>
  );
}
