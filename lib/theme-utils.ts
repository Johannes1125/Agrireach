/**
 * Utility functions for theme management
 */

/**
 * Toggle the theme and synchronize UI components
 * @param announce Optional function to announce theme change for accessibility
 */
export function toggleTheme(announce?: (message: string) => void): void {
  const html = document.documentElement;
  const currentTheme = html.classList.contains("dark") ? "dark" : "light";
  const newTheme = currentTheme === "dark" ? "light" : "dark";

  // Remove current theme class and add new one
  html.classList.remove(currentTheme);
  html.classList.add(newTheme);

  // Store theme in localStorage for persistence
  localStorage.setItem("theme", newTheme);

  // Dispatch a custom event that the settings component can listen for
  const themeChangeEvent = new CustomEvent("themeChange", {
    detail: { theme: newTheme },
    bubbles: true,
  });
  document.dispatchEvent(themeChangeEvent);

  // Announce theme change if announce function is provided
  if (announce) {
    announce(`Theme changed to ${newTheme} mode`);
  }
}
