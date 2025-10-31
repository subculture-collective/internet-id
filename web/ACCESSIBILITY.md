# Accessibility Documentation

Internet-ID is committed to providing an accessible experience for all users, including those with disabilities. This document outlines our accessibility features and WCAG 2.1 Level AA conformance.

## WCAG 2.1 Level AA Conformance

Internet-ID has been designed and tested to meet the Web Content Accessibility Guidelines (WCAG) 2.1 at Level AA. This ensures that our platform is accessible to users with a wide range of disabilities.

## Accessibility Features

### 1. Keyboard Navigation

All interactive elements on Internet-ID can be accessed using only a keyboard:

- **Tab**: Navigate forward through interactive elements
- **Shift + Tab**: Navigate backward through interactive elements
- **Enter/Space**: Activate buttons and links
- **Escape**: Close toast notifications and modal dialogs
- **Skip to Content**: Press Tab on page load to reveal "Skip to main content" link

#### Keyboard Shortcuts

- **Skip to Main Content**: First Tab press reveals skip link (visible on focus)
- **Close Notifications**: Press Escape to dismiss toast notifications

### 2. Screen Reader Support

Internet-ID has been optimized for screen readers including:

- NVDA (Windows)
- JAWS (Windows)
- VoiceOver (macOS, iOS)
- TalkBack (Android)

#### ARIA Attributes

All interactive components include appropriate ARIA attributes:

- **Forms**: All form inputs have associated labels or `aria-label` attributes
- **Buttons**: All buttons have descriptive labels
- **Loading States**: Loading spinners use `role="status"` and `aria-live="polite"`
- **Notifications**: Toast messages use `role="alert"` with appropriate `aria-live` regions
- **Errors**: Error messages use `role="alert"` and `aria-live="assertive"`
- **Navigation**: Tab navigation uses `aria-pressed` to indicate active state

### 3. Visual Design

#### Color Contrast

All text and interactive elements meet WCAG 2.1 AA contrast requirements:

- **Normal text**: Minimum contrast ratio of 4.5:1
- **Large text** (18pt+): Minimum contrast ratio of 3:1
- **Interactive elements**: Minimum contrast ratio of 3:1 for borders and icons

#### Focus Indicators

All interactive elements have clear, visible focus indicators:

- **Focus outline**: 3px solid blue outline with 2px offset
- **Focus shadow**: Additional subtle shadow for enhanced visibility
- **High contrast**: Focus indicators maintain minimum 3:1 contrast ratio with background

### 4. Semantic HTML

Internet-ID uses proper semantic HTML throughout:

- **Landmarks**: `<main>`, `<nav>`, `<section>` with appropriate ARIA labels
- **Headings**: Proper heading hierarchy (single `<h1>`, nested `<h2>`-`<h6>`)
- **Lists**: Semantic `<ul>`, `<ol>`, and `<li>` elements
- **Forms**: Properly associated `<label>` and form control elements

### 5. Responsive Design

The interface is fully responsive and accessible on:

- Desktop computers (1920px and above)
- Laptops (1024px - 1919px)
- Tablets (640px - 1023px)
- Mobile devices (320px - 639px)

All touch targets meet the minimum 44x44px size requirement for mobile accessibility.

### 6. Alternative Text

- All images include descriptive `alt` text
- Decorative images use `alt=""` or `aria-hidden="true"`
- QR codes include descriptive alternative text

### 7. Form Accessibility

All forms include:

- Visible labels for all inputs
- Required field indicators
- Clear error messages with suggestions
- Input validation with helpful feedback
- Logical tab order

## Testing

Internet-ID undergoes regular accessibility testing:

### Automated Testing

- **Lighthouse**: Accessibility score of 90+ required
- **axe DevTools**: Zero critical violations
- **Playwright**: End-to-end accessibility tests

### Manual Testing

- Keyboard navigation testing on all pages
- Screen reader testing (NVDA, JAWS, VoiceOver)
- Color contrast verification
- Focus indicator visibility testing

## Known Issues

We continuously work to improve accessibility. Currently known issues:

- None at this time

## Reporting Accessibility Issues

If you encounter any accessibility barriers while using Internet-ID, please:

1. Open an issue on our [GitHub repository](https://github.com/subculture-collective/internet-id/issues)
2. Include:
   - Description of the issue
   - Steps to reproduce
   - Assistive technology used (if applicable)
   - Browser and operating system
   - Screenshots or recordings (if helpful)

We aim to respond to accessibility issues within 2 business days and resolve them as quickly as possible.

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [WebAIM: Web Accessibility In Mind](https://webaim.org/)
- [The A11Y Project](https://www.a11yproject.com/)

## Contact

For accessibility-related questions or concerns, please contact:

- Email: support@subculture.io
- GitHub Issues: https://github.com/subculture-collective/internet-id/issues

---

_Last updated: October 30, 2025_
_WCAG 2.1 Level AA Conformance_
