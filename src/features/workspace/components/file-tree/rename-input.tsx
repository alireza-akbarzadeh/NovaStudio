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
    if (selectOnFocus) {
      inputRef.current?.focus();
      inputRef.current?.select();
    } else {
      inputRef.current?.focus();
    }
  }, [selectOnFocus]);

  return (
    <Input
      ref={mergedRef}
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
