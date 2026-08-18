import { describe, expect, it } from "vitest";
import { validateFolderName } from "@/lib/fs/folderName";

describe("folder name validation", () => {
  it("accepts an ordinary name", () => {
    expect(validateFolderName("LeetTrackData")).toBeNull();
    expect(validateFolderName("  My Data  ")).toBeNull();
  });

  it("rejects an empty name", () => {
    expect(validateFolderName("   ")).not.toBeNull();
  });

  it("rejects relative path names", () => {
    expect(validateFolderName(".")).not.toBeNull();
    expect(validateFolderName("..")).not.toBeNull();
  });

  it("rejects names containing path separators", () => {
    expect(validateFolderName("a/b")).not.toBeNull();
    expect(validateFolderName(String.raw`a\b`)).not.toBeNull();
    expect(validateFolderName(String.raw`..\..\Windows`)).not.toBeNull();
  });

  it("rejects names containing reserved characters", () => {
    for (const name of ["a:b", "a*b", "a?b", 'a"b', "a<b", "a>b", "a|b"]) {
      expect(validateFolderName(name), name).not.toBeNull();
    }
  });
});
