# Error Handling & Loading States Testing Guide

This document outlines the improvements made to error handling and loading states in the Internet-ID web application.

## Components Added

### 1. LoadingSpinner (`web/app/components/LoadingSpinner.tsx`)
- Provides consistent loading indicators across the app
- Supports 3 sizes: `sm`, `md`, `lg`
- Can be used inline or as a centered display
- Includes animated spinner with customizable message

### 2. ErrorBoundary (`web/app/components/ErrorBoundary.tsx`)
- React error boundary to catch and display graceful errors
- Prevents white screen of death
- Provides "Try again" button to recover from errors
- Added to root layout to protect entire application

### 3. Toast Notifications (`web/app/components/Toast.tsx`)
- Auto-dismissing notifications for success/error/warning/info states
- Positioned in top-right corner
- Animated slide-in effect
- User can manually close or let auto-dismiss (default 3 seconds)
- Managed via `useToast` hook

### 4. ErrorMessage (`web/app/components/ErrorMessage.tsx`)
- Smart error parsing with contextual messages
- Detects common error types:
  - Network errors
  - Transaction rejections (user denied, insufficient gas)
  - IPFS upload failures
  - Validation errors
  - Unauthorized access
- Provides helpful suggestions for each error type
- Optional retry button

### 5. SkeletonLoader (`web/app/components/SkeletonLoader.tsx`)
- Placeholder loading state for content-heavy sections
- Animated pulse effect
- Configurable width, height, and count
- Used in Browse section during initial load

### 6. useToast Hook (`web/app/hooks/useToast.ts`)
- React hook for managing toast notifications
- Methods: `success()`, `error()`, `warning()`, `info()`
- Handles toast state and auto-removal

## Forms Updated with Loading States

All async operations now include:
- Loading spinner during operation
- Error messages with retry capability
- Success toast notifications
- Disabled buttons during loading

### Updated Forms:
1. **Upload Form** - File upload to IPFS
2. **One-shot Form** - Complete upload → manifest → register flow
3. **Manifest Form** - Create and upload manifest
4. **Register Form** - On-chain registration
5. **Verify Form** - Content verification
6. **Proof Form** - Proof generation
7. **Bind Form** - Platform binding
8. **Browse Contents** - Fetch and display contents
9. **Verifications View** - Fetch verification history

## Error Messages Implemented

### Network Errors
- **Detected**: "fetch", "network", "failed to fetch"
- **Title**: "Network Error"
- **Suggestion**: "Please check your internet connection and try again."

### Transaction Errors
- **User Rejection**: "user rejected", "user denied"
  - **Title**: "Transaction Rejected"
  - **Suggestion**: "Please approve the transaction in your wallet to continue."
  
- **Insufficient Funds**: "insufficient funds", "gas"
  - **Title**: "Insufficient Funds"
  - **Suggestion**: "Please add funds to your wallet or reduce the transaction amount."

### IPFS Errors
- **Detected**: "ipfs", "upload"
- **Title**: "Upload Failed"
- **Suggestion**: "Please check your file and try again."

### Validation Errors
- **Detected**: "invalid", "validation"
- **Title**: "Invalid Input"
- **Suggestion**: "Please check your input and try again."

### Authorization Errors
- **Detected**: "unauthorized", "403", "401"
- **Title**: "Unauthorized"
- **Suggestion**: "Please sign in or check your account permissions."

## Testing Checklist

### Manual Testing Scenarios

#### 1. Network Error Testing
- [ ] Disconnect network and try uploading a file
- [ ] Expected: "Network Error" message with connection suggestion
- [ ] Reconnect and click "Try Again" button

#### 2. Loading State Testing
- [ ] Upload a large file and observe loading spinner
- [ ] Submit one-shot form and observe "Processing..." message
- [ ] Browse contents and observe skeleton loaders on initial load
- [ ] Verify buttons are disabled during loading

#### 3. Toast Notification Testing
- [ ] Successfully upload a file → green success toast appears
- [ ] Trigger an error → red error toast appears
- [ ] Multiple toasts stack vertically
- [ ] Toasts auto-dismiss after 3 seconds
- [ ] Can manually close toast with X button

#### 4. Error Recovery Testing
- [ ] Trigger upload error
- [ ] Click "Try Again" button
- [ ] Verify form retries the operation

#### 5. Error Boundary Testing
- [ ] Application wrapped in ErrorBoundary
- [ ] React errors caught and displayed gracefully
- [ ] "Try again" button resets error state

#### 6. Form-Specific Testing

**Upload Form:**
- [ ] Loading spinner appears during upload
- [ ] Success toast on completion
- [ ] Error message on failure with retry option

**One-Shot Form:**
- [ ] Loading spinner with "Processing..." message
- [ ] Success toast on completion
- [ ] Error handling for all sub-operations

**Verify Form:**
- [ ] Loading spinner during verification
- [ ] Success toast if verification passes
- [ ] Warning toast if verification status is not OK

**Browse Contents:**
- [ ] Skeleton loaders appear on initial load
- [ ] Loading spinner on refresh button
- [ ] Empty state when no items

## User Experience Improvements

### Before:
- ❌ Generic error messages
- ❌ No loading indicators
- ❌ Unclear async operation status
- ❌ No retry mechanism
- ❌ Poor error feedback
- ❌ Application crashes show white screen

### After:
- ✅ Contextual, actionable error messages
- ✅ Clear loading indicators everywhere
- ✅ Real-time status updates via toasts
- ✅ Retry buttons for failed operations
- ✅ Smart error detection and suggestions
- ✅ Error boundary prevents application crashes
- ✅ Skeleton loaders for better perceived performance

## Technical Implementation

### Architecture:
- **Components**: Reusable, composable UI components
- **Hooks**: Custom React hooks for state management
- **Error Handling**: Try-catch blocks with typed error responses
- **Loading States**: Boolean flags with conditional rendering
- **Toast System**: Event-based with auto-cleanup

### Code Quality:
- TypeScript for type safety
- Consistent error handling patterns
- Accessible UI (ARIA labels on loaders)
- Responsive design
- Minimal bundle size impact

## Future Enhancements

Potential improvements for future iterations:
- [ ] Add optimistic UI updates for mutations
- [ ] Implement retry with exponential backoff
- [ ] Add progress bars for long-running operations
- [ ] Network request caching and offline support
- [ ] More granular error categorization
- [ ] Custom error reporting/logging integration
- [ ] A11y improvements for screen readers
- [ ] Animated page transitions
- [ ] Dark mode support for error states
