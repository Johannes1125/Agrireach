import React from "react";
import { Metadata } from "next";
import SkipToContent from "@/components/accessibility/skip-to-content";
import TextSizing from "@/components/accessibility/text-sizing";
import { LiveRegion } from "@/components/accessibility/live-region";
import { useAccessibility } from "@/components/accessibility/accessibility-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
  title: "Accessibility - AgriReach",
  description: "Accessibility features and settings for the AgriReach platform",
};

export default function AccessibilityPage() {
  const {
    announce,
    highContrast,
    toggleHighContrast,
    reducedMotion,
    setReducedMotion,
    increaseFontSize,
    decreaseFontSize,
    resetFontSize,
  } = useAccessibility();

  return (
    <>
      <SkipToContent />
      <main id="main-content" tabIndex={-1} className="container py-8">
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          Accessibility Features
        </h1>
        <p className="text-xl text-muted-foreground mb-8">
          AgriReach is committed to providing an inclusive experience for all
          users. This page demonstrates the accessibility features available on
          our platform.
        </p>

        <Tabs defaultValue="features" className="mb-8">
          <TabsList className="mb-4">
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="keyboard">Keyboard Navigation</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="features">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6">
                <h2 className="text-2xl font-semibold mb-4">
                  Screen Reader Support
                </h2>
                <p className="mb-4">
                  Our platform is compatible with popular screen readers like
                  NVDA, JAWS, and VoiceOver. We use proper semantic markup and
                  ARIA attributes to ensure a great experience.
                </p>
                <div className="flex flex-col gap-4">
                  <Button
                    onClick={() => {
                      announce("This is a polite announcement", "polite");
                    }}
                  >
                    Test Polite Announcement
                  </Button>
                  <Button
                    onClick={() => {
                      announce(
                        "This is an assertive announcement",
                        "assertive"
                      );
                    }}
                    variant="destructive"
                  >
                    Test Assertive Announcement
                  </Button>
                </div>
              </Card>

              <Card className="p-6">
                <h2 className="text-2xl font-semibold mb-4">
                  High Contrast Mode
                </h2>
                <p className="mb-4">
                  Our high contrast mode increases text and UI element
                  visibility for users with visual impairments or those who
                  prefer higher contrast.
                </p>
                <Button
                  onClick={() => toggleHighContrast()}
                  variant={highContrast ? "default" : "outline"}
                >
                  {highContrast ? "Disable" : "Enable"} High Contrast Mode
                </Button>
              </Card>

              <Card className="p-6">
                <h2 className="text-2xl font-semibold mb-4">Text Sizing</h2>
                <p className="mb-4">
                  Adjust the text size to your preference. These settings will
                  be remembered across your browsing session.
                </p>
                <div className="flex gap-3 items-center">
                  <Button
                    variant="outline"
                    onClick={decreaseFontSize}
                    aria-label="Decrease text size"
                  >
                    A-
                  </Button>
                  <Button
                    variant="outline"
                    onClick={resetFontSize}
                    aria-label="Reset text size"
                  >
                    Reset
                  </Button>
                  <Button
                    variant="outline"
                    onClick={increaseFontSize}
                    aria-label="Increase text size"
                  >
                    A+
                  </Button>
                </div>
              </Card>

              <Card className="p-6">
                <h2 className="text-2xl font-semibold mb-4">Reduced Motion</h2>
                <p className="mb-4">
                  We respect your system's motion preferences and offer
                  additional controls to reduce or eliminate animations
                  throughout the platform.
                </p>
                <Button
                  onClick={() => setReducedMotion(!reducedMotion)}
                  variant={reducedMotion ? "default" : "outline"}
                >
                  {reducedMotion ? "Disable" : "Enable"} Reduced Motion
                </Button>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="keyboard">
            <Card className="p-6">
              <h2 className="text-2xl font-semibold mb-4">
                Keyboard Shortcuts
              </h2>
              <p className="mb-4">
                AgriReach supports various keyboard shortcuts to improve
                navigation efficiency. Press the{" "}
                <kbd className="px-2 py-1 bg-muted rounded">?</kbd> key anywhere
                in the application to view the complete list of available
                shortcuts.
              </p>

              <div className="border rounded-md p-4 mb-6">
                <h3 className="font-medium mb-2">Common Shortcuts</h3>
                <ul className="space-y-2">
                  <li className="flex justify-between">
                    <span>Show keyboard shortcuts</span>
                    <kbd className="px-2 py-1 bg-muted rounded text-sm">?</kbd>
                  </li>
                  <li className="flex justify-between">
                    <span>Navigate to home</span>
                    <kbd className="px-2 py-1 bg-muted rounded text-sm">
                      Alt + H
                    </kbd>
                  </li>
                  <li className="flex justify-between">
                    <span>Navigate to marketplace</span>
                    <kbd className="px-2 py-1 bg-muted rounded text-sm">
                      Alt + M
                    </kbd>
                  </li>
                  <li className="flex justify-between">
                    <span>Navigate to community</span>
                    <kbd className="px-2 py-1 bg-muted rounded text-sm">
                      Alt + C
                    </kbd>
                  </li>
                  <li className="flex justify-between">
                    <span>Search</span>
                    <kbd className="px-2 py-1 bg-muted rounded text-sm">
                      Alt + S
                    </kbd>
                  </li>
                </ul>
              </div>

              <h3 className="text-xl font-semibold mb-3">Focus Management</h3>
              <p>
                All interactive elements are keyboard accessible and have
                clearly visible focus states. We use focus traps for modal
                dialogs and similar interfaces to ensure keyboard users can
                easily navigate within contained UI elements.
              </p>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card className="p-6">
              <h2 className="text-2xl font-semibold mb-4">
                Accessibility Settings
              </h2>
              <p className="mb-6">
                You can access the accessibility settings panel by clicking the
                accessibility icon in the bottom left corner of any page or by
                pressing{" "}
                <kbd className="px-2 py-1 bg-muted rounded">Alt + A</kbd>.
              </p>

              <h3 className="text-xl font-semibold mb-3">Available Settings</h3>
              <ul className="space-y-4">
                <li>
                  <strong>High Contrast Mode</strong>: Increases contrast for
                  better visibility
                </li>
                <li>
                  <strong>Text Size</strong>: Adjust text size throughout the
                  application
                </li>
                <li>
                  <strong>Reduced Motion</strong>: Minimize or eliminate
                  animations
                </li>
                <li>
                  <strong>Focus Indicators</strong>: Toggle visibility of
                  keyboard focus indicators
                </li>
              </ul>

              <Separator className="my-6" />

              <div>
                <h3 className="text-xl font-semibold mb-3">
                  Browser Compatibility
                </h3>
                <p>
                  Our accessibility features work best with modern browsers.
                  Some features may have limited functionality in older
                  browsers.
                </p>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-4">Feedback</h2>
          <p className="mb-4">
            We're constantly working to improve our accessibility features. If
            you encounter any issues or have suggestions, please
            <a href="/contact" className="text-primary hover:underline ml-1">
              contact us
            </a>
            .
          </p>
        </div>
      </main>
    </>
  );
}
