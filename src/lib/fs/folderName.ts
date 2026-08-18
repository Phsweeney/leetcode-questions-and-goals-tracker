import path from "node:path";

export function validateFolderName(name: string): string | null {
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    return "Enter a folder name.";
  }
  if (trimmed === "." || trimmed === "..") {
    return "Choose a different folder name.";
  }
  // basename strips whatever counts as a separator on this platform
  if (trimmed !== path.basename(trimmed)) {
    return "Folder names cannot contain path separators.";
  }
  if (/[:*?"<>|]/.test(trimmed)) {
    return 'Folder names cannot contain any of these characters: : * ? " < > |';
  }
  return null;
}
