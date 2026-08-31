import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { StatusIndicator } from "../components/common/StatusIndicator";

describe("StatusIndicator", () => {
  it("renders single check for sent status", () => {
    const { container } = render(<StatusIndicator status="sent" />);
    const svg = container.querySelector("svg");
    expect(svg).toBeTruthy();
    expect(svg?.classList.contains("text-slate-500")).toBe(true);
  });

  it("renders double check for delivered status", () => {
    const { container } = render(<StatusIndicator status="delivered" />);
    const svg = container.querySelector("svg");
    expect(svg).toBeTruthy();
    expect(svg?.classList.contains("text-slate-400")).toBe(true);
  });

  it("renders blue double check for read status", () => {
    const { container } = render(<StatusIndicator status="read" />);
    const svg = container.querySelector("svg");
    expect(svg).toBeTruthy();
    expect(svg?.classList.contains("text-sky-400")).toBe(true);
  });
});
