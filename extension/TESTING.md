# Browser Extension Testing Guide

## Prerequisites

Before testing the extension, ensure you have:

1. **Internet ID API Server Running**

   ```bash
   cd /path/to/internet-id
   npm run start:api
   # API should be running on http://localhost:3001
   ```

2. **Chrome, Edge, or Brave Browser**
   - Version 88 or higher
   - Developer mode enabled

3. **Test Data** (Optional)
   - Some content already registered in the system
   - YouTube videos or Twitter posts with known verification status

## Installation for Testing

### Step 1: Enable Developer Mode

1. Open Chrome/Edge/Brave
2. Navigate to extensions:
   - Chrome: `chrome://extensions`
   - Edge: `edge://extensions`
   - Brave: `brave://extensions`
3. Toggle "Developer mode" (top right corner)

### Step 2: Load Extension

1. Click "Load unpacked"
2. Navigate to `/path/to/internet-id/extension`
3. Click "Select Folder"
4. Extension should now appear in your extensions list

### Step 3: Pin Extension (Recommended)

1. Click the extensions icon (puzzle piece) in browser toolbar
2. Find "Internet ID Verifier"
3. Click the pin icon to keep it visible

## Configuration

### Initial Setup

1. Click the Internet ID extension icon
2. Click "Settings" at the bottom
3. Configure API settings:
   - **API Base URL**: `http://localhost:3001`
   - **API Key**: Leave empty (unless configured on server)
4. Click "Test Connection" to verify API is accessible
5. Enable settings as desired:
   - ✅ Auto-verify content on supported platforms
   - ✅ Show verification badges on pages
   - ✅ Enable notifications
6. Click "Save Settings"

## Test Cases

### TC-1: Extension Installation

**Steps:**

1. Follow installation steps above
2. Extension icon should appear in toolbar
3. Click icon to open popup

**Expected:**

- Popup opens with Internet ID branding
- Shows current page status
- Settings and dashboard buttons visible

**Status:** ⬜ Pass ⬜ Fail

---

### TC-2: API Connection Test

**Steps:**

1. Open extension settings (click icon → Settings)
2. Enter API Base URL: `http://localhost:3001`
3. Click "Test Connection"

**Expected:**

- Green "✓ Connection successful!" message appears
- API status shows "Connected" with green dot

**Status:** ⬜ Pass ⬜ Fail

---

### TC-3: YouTube Badge Display

**Prerequisites:** Have a YouTube video URL registered in the system

**Steps:**

1. Ensure settings enabled: Auto-verify ✅, Show badges ✅
2. Navigate to a verified YouTube video
3. Wait for page to fully load
4. Look below the video title

**Expected:**

- Purple gradient badge appears with "✓ Verified by Internet ID"
- Hovering shows tooltip with creator address
- Extension icon shows checkmark badge

**Status:** ⬜ Pass ⬜ Fail

---

### TC-4: Twitter/X Badge Display

**Prerequisites:** Have a Twitter/X post registered in the system

**Steps:**

1. Navigate to a verified Twitter/X post
2. Wait for page to load
3. Look below the tweet text

**Expected:**

- Verification badge appears on the post
- Tooltip shows on hover
- Badge stays visible on scroll

**Status:** ⬜ Pass ⬜ Fail

---

### TC-5: Popup Verification Check

**Steps:**

1. Navigate to any YouTube video or Twitter post
2. Click extension icon
3. Wait for verification check

**Expected States:**

**For Verified Content:**

- Shows "Verified Content" with ✓ icon
- Displays platform name
- Shows creator address (truncated)
- Shows verification date

**For Unverified Content:**

- Shows "Not Verified" with ⚠ icon
- Displays "Verify Now" button
- Button opens dashboard on click

**For Unsupported Platform:**

- Shows "Unsupported Platform" with ℹ icon
- Lists supported platforms

**Status:** ⬜ Pass ⬜ Fail

---

### TC-6: Settings Persistence

**Steps:**

1. Open settings
2. Change theme to "Dark"
3. Disable "Show verification badges"
4. Click "Save Settings"
5. Close and reopen settings

**Expected:**

- Dark theme is selected
- "Show badges" is unchecked
- All settings persist after browser restart

**Status:** ⬜ Pass ⬜ Fail

---

### TC-7: Cache Functionality

**Steps:**

1. Navigate to a verified video
2. Note the verification check time
3. Refresh the page immediately
4. Check verification status again

**Expected:**

- Second check is instant (from cache)
- Badge appears immediately
- No duplicate API calls (check Network tab)

**Status:** ⬜ Pass ⬜ Fail

---

### TC-8: Clear Cache

**Steps:**

1. Navigate to verified content (badge shows)
2. Open settings
3. Click "Clear Cache"
4. Return to the content page
5. Refresh

**Expected:**

- Success message: "Cache cleared (X items removed)"
- Badge takes longer to appear (API call)
- Verification re-fetched from server

**Status:** ⬜ Pass ⬜ Fail

---

### TC-9: Dashboard Link

**Steps:**

1. Click extension icon
2. Click "Open Dashboard" button

**Expected:**

- New tab opens to `http://localhost:3000/dashboard`
- Dashboard loads correctly

**Status:** ⬜ Pass ⬜ Fail

---

### TC-10: Error Handling (API Down)

**Steps:**

1. Stop the API server (`Ctrl+C` in terminal)
2. Navigate to a YouTube video
3. Click extension icon

**Expected:**

- Shows "Error" state with ✕ icon
- Error message: "API request failed" or similar
- "Retry" button available
- API status shows "Disconnected" with red dot

**Status:** ⬜ Pass ⬜ Fail

---

### TC-11: SPA Navigation (YouTube)

**Steps:**

1. Open any YouTube video
2. Wait for badge to appear (if verified)
3. Click on a recommended video (sidebar)
4. Wait for new video to load

**Expected:**

- Extension detects URL change
- Badge updates for new video
- No page refresh needed
- Correct badge for new content

**Status:** ⬜ Pass ⬜ Fail

---

### TC-12: Multiple Tabs

**Steps:**

1. Open verified YouTube video in Tab 1
2. Open verified Twitter post in Tab 2
3. Switch between tabs
4. Click extension icon in each tab

**Expected:**

- Each tab shows correct platform
- Verification status specific to that tab
- Badges display independently
- No cross-tab interference

**Status:** ⬜ Pass ⬜ Fail

---

### TC-13: Wallet Connection (Optional)

**Prerequisites:** MetaMask or similar wallet installed

**Steps:**

1. Open extension settings
2. Scroll to "Wallet Connection"
3. Click "Connect Wallet"
4. Approve in wallet popup

**Expected:**

- Wallet connection prompt appears
- After approval, shows "Wallet connected"
- Displays connected address
- "Disconnect" button available

**Status:** ⬜ Pass ⬜ Fail

---

### TC-14: Reset Settings

**Steps:**

1. Modify several settings
2. Connect wallet (if available)
3. Click "Reset All Settings"
4. Confirm in dialog

**Expected:**

- Confirmation dialog appears
- All settings reset to defaults
- Wallet disconnected
- Cache cleared
- Success message shown

**Status:** ⬜ Pass ⬜ Fail

---

## Browser Compatibility Testing

Test the extension in multiple Chromium-based browsers:

### Chrome

- Version: **\_\_\_**
- OS: **\_\_\_**
- Status: ⬜ Pass ⬜ Fail
- Notes: ******\_\_\_******

### Edge

- Version: **\_\_\_**
- OS: **\_\_\_**
- Status: ⬜ Pass ⬜ Fail
- Notes: ******\_\_\_******

### Brave

- Version: **\_\_\_**
- OS: **\_\_\_**
- Status: ⬜ Pass ⬜ Fail
- Notes: ******\_\_\_******

## Performance Testing

### Load Time

- Extension loads in: **\_\_** ms
- Popup opens in: **\_\_** ms
- Badge injection time: **\_\_** ms

### Memory Usage

- Extension memory: **\_\_** MB
- Acceptable: < 50 MB

### Network Requests

- API calls per page: **\_\_**
- Acceptable: ≤ 1 per page load (with cache)

## Known Issues

Document any issues found during testing:

1. **Issue**: ******\_\_\_******
   - **Severity**: Critical / High / Medium / Low
   - **Steps to Reproduce**: ******\_\_\_******
   - **Expected**: ******\_\_\_******
   - **Actual**: ******\_\_\_******

2. **Issue**: ******\_\_\_******
   - **Severity**: Critical / High / Medium / Low
   - **Steps to Reproduce**: ******\_\_\_******
   - **Expected**: ******\_\_\_******
   - **Actual**: ******\_\_\_******

## Troubleshooting

### Extension Not Loading

**Problem:** Extension doesn't appear after loading unpacked

**Solutions:**

1. Check browser console for errors (`F12`)
2. Verify manifest.json is valid
3. Try removing and re-adding extension
4. Restart browser

### Badge Not Appearing

**Problem:** Verification badge doesn't show on verified content

**Solutions:**

1. Check "Show badges" is enabled in settings
2. Verify API is running and accessible
3. Check browser console for errors
4. Clear cache and refresh page
5. Check content is actually verified in API

### Popup Shows Error

**Problem:** Extension popup shows error state

**Solutions:**

1. Test API connection in settings
2. Check API server is running
3. Verify API URL is correct
4. Check browser console for details
5. Clear extension cache

### Badge Positioning Issues

**Problem:** Badge appears in wrong location or overlaps content

**Solutions:**

1. Platform UI may have changed
2. Check browser console for injection errors
3. Report issue with platform and browser version
4. Disable badge display temporarily

## Reporting Issues

When reporting issues, include:

1. **Browser**: Chrome/Edge/Brave + version
2. **OS**: Windows/Mac/Linux + version
3. **Extension Version**: 1.0.0
4. **API Version**: Check `/api/health`
5. **Steps to Reproduce**: Detailed steps
6. **Expected Behavior**: What should happen
7. **Actual Behavior**: What actually happens
8. **Console Logs**: Any error messages
9. **Screenshots**: If applicable

Report to: https://github.com/subculture-collective/internet-id/issues

## Test Summary

**Tester**: ******\_\_\_******
**Date**: ******\_\_\_******
**Browser**: ******\_\_\_******
**OS**: ******\_\_\_******

**Results:**

- Total Tests: 14
- Passed: **\_\_**
- Failed: **\_\_**
- Blocked: **\_\_**

**Overall Status:** ⬜ Pass ⬜ Fail ⬜ Needs Improvement

**Notes:**

---

---

---
