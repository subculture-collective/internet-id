# Accessibility Testing Guide

This guide explains how to test the accessibility features of Internet-ID and ensure WCAG 2.1 Level AA compliance.

## Quick Start

Run all accessibility checks:

```bash
npm run audit:a11y     # Run automated code audit
npm run test:a11y      # Run Playwright accessibility tests
npm run perf:audit     # Run Lighthouse audit (includes accessibility)
```

## Automated Testing

### 1. Code-Level Audit

Run the custom accessibility audit script:

```bash
npm run audit:a11y
```

This checks for:

- ARIA labels on buttons
- Alt text on images
- Form input labels
- ARIA live regions
- Semantic role attributes

### 2. End-to-End Accessibility Tests

Run comprehensive Playwright tests:

```bash
# Run all accessibility tests
npm run test:a11y

# Run with UI mode for debugging
npm run test:e2e:ui -- 07-accessibility.spec.ts

# Run in headed mode to see the browser
npm run test:e2e:headed -- 07-accessibility.spec.ts
```

The test suite covers:

- Document structure and landmarks
- Heading hierarchy
- Skip-to-content link
- Keyboard navigation
- ARIA attributes
- Focus management
- Color contrast (visual)
- Mobile accessibility
- Screen reader support

### 3. Lighthouse Audit

Run a full Lighthouse audit including accessibility:

```bash
# Run full audit (requires app to be running)
npm run perf:audit

# Or collect data only
npm run perf:collect
```

Lighthouse checks:

- Accessibility score (must be 90+)
- ARIA attribute validity
- Color contrast ratios
- Image alt text
- Form labels
- Navigation structure

## Manual Testing

### Keyboard Navigation Testing

1. **Tab Navigation**
   - Press `Tab` to move forward through interactive elements
   - Press `Shift + Tab` to move backward
   - Verify all interactive elements can be reached
   - Verify focus indicators are clearly visible

2. **Skip to Content**
   - Press `Tab` on page load
   - Verify "Skip to main content" link appears
   - Press `Enter` to activate
   - Verify page scrolls to main content

3. **Keyboard Shortcuts**
   - `Escape`: Close toast notifications
   - `Enter/Space`: Activate buttons and links
   - Arrow keys: Navigate within components (where applicable)

### Screen Reader Testing

#### Testing with NVDA (Windows)

1. Download and install [NVDA](https://www.nvaccess.org/)
2. Start NVDA (Ctrl + Alt + N)
3. Navigate to the application
4. Use the following commands:
   - `H`: Navigate by heading
   - `Tab`: Move through interactive elements
   - `Insert + F7`: List of elements
   - `Insert + Down Arrow`: Read content

#### Testing with JAWS (Windows)

1. Download and install [JAWS](https://www.freedomscientific.com/products/software/jaws/)
2. Start JAWS
3. Navigate to the application
4. Use the following commands:
   - `H`: Navigate by heading
   - `Tab`: Move through interactive elements
   - `Insert + F6`: List of headings
   - `Insert + Down Arrow`: Read content

#### Testing with VoiceOver (macOS)

1. Enable VoiceOver (Cmd + F5)
2. Navigate to the application in Safari
3. Use the following commands:
   - `VO + Right Arrow`: Navigate forward
   - `VO + Left Arrow`: Navigate backward
   - `VO + H`: Navigate by heading
   - `VO + Space`: Activate element
   - `VO + U`: Open rotor menu

#### Testing with TalkBack (Android)

1. Enable TalkBack in Settings > Accessibility
2. Open the application in Chrome
3. Swipe right to navigate forward
4. Swipe left to navigate backward
5. Double-tap to activate elements

### Color Contrast Testing

#### Using Browser DevTools

1. Open Chrome DevTools (F12)
2. Select an element with text
3. In the Styles panel, click the color square
4. Check the "Contrast ratio" section
5. Verify:
   - Normal text: 4.5:1 minimum
   - Large text (18pt+): 3:1 minimum

#### Using Online Tools

- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Contrast Checker by Polypane](https://polypane.app/color-contrast/)

### Focus Indicator Testing

1. Use keyboard to navigate through all interactive elements
2. Verify each focused element has:
   - Clear, visible outline (3px solid blue)
   - Sufficient contrast with background (3:1 minimum)
   - Consistent styling across the application

## Accessibility Checklist

Use this checklist when implementing new features:

### Semantic HTML

- [ ] Use proper heading hierarchy (h1, h2, h3, etc.)
- [ ] Use semantic elements (main, nav, section, article, etc.)
- [ ] Use landmark roles or ARIA landmarks

### ARIA Attributes

- [ ] Add aria-label to icons and icon-only buttons
- [ ] Use aria-live for dynamic content updates
- [ ] Use aria-pressed for toggle buttons
- [ ] Use role="alert" for error messages
- [ ] Use role="status" for loading indicators

### Forms

- [ ] All inputs have associated labels
- [ ] Required fields are marked with aria-required
- [ ] Error messages are linked with aria-describedby
- [ ] Form validation provides clear feedback

### Keyboard Navigation

- [ ] All interactive elements are keyboard accessible
- [ ] Focus indicators are visible and clear
- [ ] Tab order is logical
- [ ] Escape key closes modals/dialogs

### Images and Media

- [ ] All images have descriptive alt text
- [ ] Decorative images use alt="" or aria-hidden="true"
- [ ] Complex images have detailed descriptions

### Color and Contrast

- [ ] Text meets 4.5:1 contrast ratio (normal text)
- [ ] Large text meets 3:1 contrast ratio (18pt+)
- [ ] Interactive elements meet 3:1 contrast ratio
- [ ] Color is not the only way to convey information

### Dynamic Content

- [ ] Loading states are announced to screen readers
- [ ] Success/error messages are announced
- [ ] Content updates don't cause unexpected focus changes

## Common Issues and Solutions

### Issue: Focus indicator not visible

**Solution:** Ensure CSS includes proper focus styles:

```css
*:focus-visible {
  outline: 3px solid #1d4ed8;
  outline-offset: 2px;
}
```

### Issue: Screen reader not announcing updates

**Solution:** Add aria-live region:

```tsx
<div aria-live="polite" aria-atomic="true">
  {message}
</div>
```

### Issue: Button without accessible name

**Solution:** Add aria-label:

```tsx
<button aria-label="Close dialog" onClick={onClose}>
  ×
</button>
```

### Issue: Form input without label

**Solution:** Associate label with input:

```tsx
<label htmlFor="email-input">Email</label>
<input id="email-input" type="email" />
```

## Resources

### Official Guidelines

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)

### Testing Tools

- [axe DevTools](https://www.deque.com/axe/devtools/)
- [WAVE Browser Extension](https://wave.webaim.org/extension/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)

### Learning Resources

- [WebAIM](https://webaim.org/)
- [The A11Y Project](https://www.a11yproject.com/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)

## Reporting Issues

If you find an accessibility issue:

1. Check if it's already reported in GitHub Issues
2. Create a new issue with:
   - Description of the problem
   - Steps to reproduce
   - Expected behavior
   - Actual behavior
   - Assistive technology used (if applicable)
   - Screenshots/recordings

## Continuous Improvement

Accessibility is an ongoing effort. We:

1. Run automated tests in CI/CD pipeline
2. Perform manual testing for major releases
3. Review accessibility in code reviews
4. Update this documentation as we learn

---

_For questions, contact: support@subculture.io_
