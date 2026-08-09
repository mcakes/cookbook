import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "../hooks/useAuth";
import EditorPage from "./EditorPage";

function renderNewRecipe() {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={["/new"]}>
        <Routes>
          <Route path="/new" element={<EditorPage />} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  );
}

describe("EditorPage image upload", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.setItem("cookbook_github_pat", "ghp_test");
  });

  it("shows an error and re-enables the input when the upload fails", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network down"));

    const { container } = renderNewRecipe();
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["fake-bytes"], "photo.png", { type: "image/png" });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => expect(screen.getByText(/network down/)).toBeInTheDocument());
    expect(input).not.toBeDisabled();
    expect(screen.queryByText("Uploading...")).not.toBeInTheDocument();
  });
});
