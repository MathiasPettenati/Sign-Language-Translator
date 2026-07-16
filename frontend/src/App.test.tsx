import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { App } from "./App";

describe("App", () => {
  it("renders the recognizer shell", () => {
    render(<App />);

    expect(screen.getByText("Sign to Speech MVP")).toBeInTheDocument();
    expect(screen.getByText("Isolated-sign recognition MVP")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /start camera/i })).toBeInTheDocument();
  });

  it("navigates to the dataset collector", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: /dataset/i }));

    expect(screen.getByText("Dataset Collector")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /export dataset/i })).toBeInTheDocument();
  });
});
