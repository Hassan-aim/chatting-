import { describe, it, expect } from "vitest";
import { formatBytes, createClientId } from "../utils/cn";

describe("formatBytes", () => {
  it("formats bytes", () => {
    expect(formatBytes(500)).toBe("500 B");
  });

  it("formats kilobytes", () => {
    expect(formatBytes(2048)).toBe("2.0 KB");
  });

  it("formats megabytes", () => {
    expect(formatBytes(5 * 1024 * 1024)).toBe("5.0 MB");
  });
});

describe("createClientId", () => {
  it("returns a UUID string", () => {
    const id = createClientId();
    expect(id).toBeTruthy();
    expect(typeof id).toBe("string");
    // UUID format
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
  });

  it("generates unique IDs", () => {
    const ids = new Set(Array.from({ length: 100 }, () => createClientId()));
    expect(ids.size).toBe(100);
  });
});
