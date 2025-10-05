# AgriReach Accessibility Features

This document describes the accessibility features implemented in the AgriReach platform to ensure it is usable by people with a wide range of abilities.

## Features

### Assistive Floating Button

- A draggable accessibility button that floats on the screen
- Can be positioned anywhere on the screen via drag and drop
- Position is remembered between sessions
- Opens a panel with accessibility settings

### Keyboard Navigation

- All interactive elements are keyboard accessible
- Skip-to-content link for keyboard users
- Focus indicators for keyboard navigation
- Global keyboard shortcuts:
  - Alt+H: Go to home page
  - Alt+M: Go to marketplace
  - Alt+C: Go to community
  - Alt+O: Go to opportunities
  - Alt+P: Go to profile
  - Alt+S: Go to settings
  - Alt+A: Go to accessibility settings
  - Alt+T: Toggle theme
  - Ctrl+/: Focus search
  - Esc: Close popups or modals

### Screen Reader Support

- ARIA attributes throughout the application
- Live regions for dynamic content updates
- Page announcements on navigation
- Proper labeling of interactive elements
- Screen reader only text where needed

### Visual Adjustments

- High contrast mode
- Text resizing options
- Reduced motion setting for users with vestibular disorders
- Focus visible option

## Implementation Details

The accessibility features are implemented using React components and hooks:

- `AccessibilityProvider`: Context provider for accessibility settings
- `AccessibilitySettings`: Floating button and settings panel
- `SkipToContent`: Skip link for keyboard users
- `GlobalAnnouncer`: ARIA live regions for screen readers
- `PageAnnouncer`: Announces page changes
- `useAccessibility`: Hook for accessing accessibility settings
- `useGlobalShortcuts`: Hook for keyboard shortcuts
- `useReducedMotion`: Hook for detecting system motion preferences

## Testing Accessibility

To test the accessibility features:

1. Navigate the site using only a keyboard (Tab, Enter, Esc, etc.)
2. Enable a screen reader (VoiceOver, NVDA, JAWS, etc.) and browse the site
3. Try the floating accessibility button to adjust settings
4. Test with different text sizes and contrast settings
5. Use keyboard shortcuts (Alt+H, etc.) to navigate

## Future Improvements

Planned accessibility enhancements:

- Text-to-speech functionality for content
- Color blindness filters
- Dyslexia-friendly font options
- Expanded keyboard shortcuts
- Automated accessibility testing
