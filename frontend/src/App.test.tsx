import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { App } from "./App";

describe("App", () => {
  it("renders the recognizer shell", () => {
    render(<App />);

    expect(screen.getByText("Live Sign Translator")).toBeInTheDocument();
    expect(screen.getByText("Live sign translation")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /start camera/i })).toBeInTheDocument();
  });

  it("keeps translation navigation focused", () => {
    render(<App />);

    expect(screen.getByRole("button", { name: /translate/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /words/i })).toBeInTheDocument();
  });

  it("shows the translation vocabulary in the words tab", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: /words/i }));

    expect(screen.getByText("Translation vocabulary")).toBeInTheDocument();
    expect(screen.getByText("Hello")).toBeInTheDocument();
    expect(screen.getByText("Thank you")).toBeInTheDocument();
  });
});
