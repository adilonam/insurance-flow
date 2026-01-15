"use client";

import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { updateThemeMode } from "@/lib/theme-utils";
import { setValueToCookie } from "@/server/server-actions";
import { usePreferencesStore } from "@/stores/preferences/preferences-provider";

export function ThemeSwitcher() {
  const themeMode = usePreferencesStore((s) => s.themeMode);
  const setThemeMode = usePreferencesStore((s) => s.setThemeMode);

  const handleValueChange = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      const newTheme = themeMode === "dark" ? "light" : "dark";
      // Update UI immediately
      updateThemeMode(newTheme);
      setThemeMode(newTheme);
      // Save to cookie (async, but don't wait for it to update UI)
      setValueToCookie("theme_mode", newTheme).catch((error) => {
        console.error("Failed to save theme preference:", error);
      });
    } catch (error) {
      console.error("Failed to switch theme:", error);
    }
  };

  return (
    <Button type="button" size="icon" onClick={handleValueChange} aria-label="Toggle theme">
      {themeMode === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}
