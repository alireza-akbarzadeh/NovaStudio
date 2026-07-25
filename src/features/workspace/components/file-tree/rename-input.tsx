"use client";

import { useEffect, useRef } from "react";

import { Input } from "@/components/ui/input";

type RenameInputProps = {
  value: string;
  onChange: (value: string) => void;
  onCommit: () => void;
  onCancel: () => void;
};

export const RenameInput = ({
  ref,
  value,
  onChange,
  onCommit,
  onCancel,
  selectOnFocus = true,
}: RenameInputProps & {
  ref?: React.Ref<HTMLInputElement>;
  selectOnFocus?: boolean;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const mergedRef = (node: HTMLInputElement | null) => {
    inputRef.current = node;
    if (typeof ref === "function") ref(node);
    else if (ref) ref.current = node;
  };

  useEffect(() => {
    let cancelled = false;

    const focusInput = () => {
      if (cancelled) return;
      const el = inputRef.current;
      if (!el) return;
      el.focus();
      if (selectOnFocus) el.select();
      el.scrollIntoView({ block: "nearest" });
    };

    // Defer past the creating click — the toolbar/menu button otherwise
    // keeps focus in the same frame and the input never receives it.
    const outer = window.requestAnimationFrame(() => {
      focusInput();
      window.requestAnimationFrame(focusInput);
    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(outer);
    };
  }, [selectOnFocus]);

  return (
    <Input
      ref={mergedRef}
      autoFocus
      data-tree-rename-input="true"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          onCommit();
        } else if (e.key === "Escape") {
          e.preventDefault();
          onCancel();
        }
      }}
      onBlur={onCommit}
      className="h-5 min-w-0 flex-1 border-ws-border bg-ws-bg px-1 py-0 text-[12px] text-ws-text focus-visible:ring-1 focus-visible:ring-ws-accent"
      onClick={(e) => e.stopPropagation()}
    />
  );
};
