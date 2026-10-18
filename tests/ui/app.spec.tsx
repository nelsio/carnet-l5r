import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "../../src/ui/App";

describe("App", () => {
  it("affiche le titre et la version", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: "Carnet de Rokugan" })).toBeInTheDocument();
    expect(screen.getByText(`v${__APP_VERSION__}`)).toBeInTheDocument();
  });
});
