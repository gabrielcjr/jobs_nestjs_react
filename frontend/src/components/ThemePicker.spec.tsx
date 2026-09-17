import { describe, it, expect, beforeEach } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemePicker } from "./ThemePicker";
import { ThemeProvider } from "../context/ThemeContext";
import { THEME_STORAGE_KEY } from "../config/theme.config";

describe("ThemePicker component", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
  });

  it("renders picker trigger button with current palette name", () => {
    render(
      <ThemeProvider>
        <ThemePicker />
      </ThemeProvider>
    );

    const btn = screen.getByTestId("theme-picker-btn");
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveTextContent("Cyber Indigo");
  });

  it("opens dropdown menu on click and lists all 5 palettes", async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <ThemePicker />
      </ThemeProvider>
    );

    const btn = screen.getByTestId("theme-picker-btn");
    await user.click(btn);

    const dropdown = screen.getByTestId("theme-picker-dropdown");
    expect(dropdown).toBeInTheDocument();

    expect(screen.getByTestId("palette-option-cyber-indigo")).toBeInTheDocument();
    expect(screen.getByTestId("palette-option-emerald-jade")).toBeInTheDocument();
    expect(screen.getByTestId("palette-option-electric-cyan")).toBeInTheDocument();
    expect(screen.getByTestId("palette-option-solar-amber")).toBeInTheDocument();
    expect(screen.getByTestId("palette-option-neon-rose")).toBeInTheDocument();
  });

  it("selects a new palette from dropdown, updates theme and closes dropdown", async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <ThemePicker />
      </ThemeProvider>
    );

    await user.click(screen.getByTestId("theme-picker-btn"));
    await user.click(screen.getByTestId("palette-option-neon-rose"));

    expect(screen.queryByTestId("theme-picker-dropdown")).not.toBeInTheDocument();
    expect(screen.getByTestId("theme-picker-btn")).toHaveTextContent("Neon Rose");
    expect(document.documentElement.getAttribute("data-theme")).toBe("neon-rose");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("neon-rose");
  });
});
