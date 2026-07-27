/** Prevent Monaco from stealing pointer/keyboard events inside view zones. */
export function attachViewZoneInputGuards(domNode: HTMLElement) {
  const stop = (event: Event) => {
    event.stopPropagation();
  };
  domNode.addEventListener("mousedown", stop);
  domNode.addEventListener("mouseup", stop);
  domNode.addEventListener("click", stop);
  domNode.addEventListener("keydown", stop);
  domNode.addEventListener("keyup", stop);
  domNode.addEventListener("pointerdown", stop);
}
