import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { App } from "./App";

describe("App", () => {
  it("renders the 3D entry experience first", () => {
    render(<App />);

    expect(screen.getByText("Sign language, heard clearly.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /enter handspeak translator/i })).toBeInTheDocument();
  });

  it("renders the recognizer shell after entry", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: /enter handspeak translator/i }));

    expect(await screen.findByText("Live Sign Translator")).toBeInTheDocument();
    expect(screen.getByText("Translation desk")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /start camera/i })).toBeInTheDocument();
  });

  it("keeps translation navigation focused", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: /enter handspeak translator/i }));

    expect(screen.getByRole("button", { name: /translate/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /words/i })).toBeInTheDocument();
  });

  it("shows the translation vocabulary in the words tab", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: /enter handspeak translator/i }));
    await user.click(screen.getByRole("button", { name: /words/i }));

    expect(screen.getByText("Translation vocabulary")).toBeInTheDocument();
    expect(screen.getByText("Hello")).toBeInTheDocument();
    expect(screen.getByText("Thank you")).toBeInTheDocument();
  });
});
