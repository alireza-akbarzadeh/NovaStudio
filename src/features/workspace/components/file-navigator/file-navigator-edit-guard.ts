/** Lets workspace shortcuts defer closing the navigator while renaming/creating. */

let editing = false;

export function setFileNavigatorEditing(next: boolean) {
  editing = next;
}

export function isFileNavigatorEditing() {
  return editing;
}
