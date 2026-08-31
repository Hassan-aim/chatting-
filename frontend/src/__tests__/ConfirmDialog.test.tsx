import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { ConfirmDialog } from "../components/common/ConfirmDialog";

// Mock HTMLDialogElement methods
beforeEach(() => {
  HTMLDialogElement.prototype.showModal = vi.fn();
  HTMLDialogElement.prototype.close = vi.fn();
});

describe("ConfirmDialog", () => {
  it("renders title and description when open", () => {
    render(
      <ConfirmDialog
        open={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="Delete message"
        description="This cannot be undone."
      />,
    );
    expect(screen.getByText("Delete message")).toBeTruthy();
    expect(screen.getByText("This cannot be undone.")).toBeTruthy();
  });

  it("does not render when closed", () => {
    const { container } = render(
      <ConfirmDialog
        open={false}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="Delete message"
      />,
    );
    expect(container.querySelector("dialog")).toBeNull();
  });

  it("shows cancel and confirm buttons", () => {
    render(
      <ConfirmDialog
        open={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="Delete"
        confirmLabel="Yes, delete"
      />,
    );
    expect(screen.getByText("Cancel")).toBeTruthy();
    expect(screen.getByText("Yes, delete")).toBeTruthy();
  });
});
