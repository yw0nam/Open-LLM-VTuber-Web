# Add Image in chat_message websocket event type PRD

## Core Guide (Within 200 lines, for immediate action)

### 1.1. Overview
- **Goal:** Enable multimodal communication by including captured image data (Base64) in the `chat_message` WebSocket event when a user sends a message while the Camera or Screen Capture is active.
- **Non-Goal:**
    - Real-time video streaming.
    - Client-side image editing (cropping/filters).
    - "Preview" UI for the captured image before sending (automatic capture on send).

### Detailed Requirements
1.  **Capture Trigger:**
    - [Must-have] Automatically capture a frame from all active video streams (Camera, Screen) when the "Send" action is triggered.
2.  **Data Processing:**
    - [Must-have] Transform captured frames into Base64 Data URL strings.
    - [Must-have] **Payload Structure:** The `images` field in the WebSocket payload must be strictly `string[]`.
    - [Must-have] **Type Correction:** Convert the `ImageData[]` (objects with metadata) returned by the capture utility into `string[]` (raw Base64) before sending.
3.  **Resilience:**
    - [Should-have] Gracefully handle cases where `ImageCapture` API is unavailable (log warning, skip capture, do not crash app).

### Implementation Plan

**Step 1: Fix Payload Type Mismatch in `useTextInput.tsx`**
-   **Context:** The `captureAllMedia()` hook returns an array of objects (`{ source, data, mime_type }`), but the WebSocket `chat_message` schema expects an array of strings.
-   **Action:**
    -   In `handleSend`, capture the result of `captureAllMedia()`.
    -   Transform the result: `const imagePayload = images.map(img => img.data)`.
    -   Pass `imagePayload` to `wsContext.sendMessage`.

**Step 2: Safety Check in `useMediaCapture.tsx`**
-   **Context:** The `ImageCapture` API is experimental and may not exist in all environments.
-   **Action:**
    -   Wrap the `new ImageCapture(videoTrack)` instantiation in a check: `if ('ImageCapture' in window) { ... }`.
    -   If missing, return `null` (or implement a fallback using a hidden `<video>` element if accessible, but returning `null` is safer for now to prevent crashes).

**Step 3: Verification**
-   **Action:**
    1.  Open the application with Camera enabled.
    2.  Type a message and send.
    3.  Verify in Network tab (WS frames) that the payload `images` field is an array of strings starting with `data:image/jpeg;base64`.

## Appendix (Detailed Reference)

- **A. Detailed API Specifications:**
    - **Event:** `chat_message`
    - **Field:** `images`: `string[]`
    - **Example Payload:**
      ```json
      {
        "type": "chat_message",
        "content": "Look at this!",
        "images": ["data:image/jpeg;base64,/9j/4AAQSkZJRg...", "data:image/jpeg;base64/..." ]
      }
      ```

- **B. DB Schema Changes:** None.

- **C. Technical Dependencies Details:**
    - **ImageCapture API:** Experimental. Used in `use-media-capture.tsx`.
    - **Canvas:** Used for resizing images (`IMAGE_MAX_WIDTH`).

- **D. Related Documents:**
    - [`use-text-input.tsx`](../../../../src/renderer/src/hooks/footer/use-text-input.tsx) - **Main Fix Location**
    - [`use-media-capture.tsx`](../../../../src/renderer/src/hooks/utils/use-media-capture.tsx) - **Capture Logic**
    - [`websocket.ts`](../../../../src/renderer/src/services/schemas/websocket.ts) - **Schema definition.**

- **E. Test Scenarios Details:**
    1.  **Single Source:** Camera on -> Send "Hi" -> Payload has 1 image.
    2.  **Dual Source:** Camera + Screen on -> Send "Look" -> Payload has 2 images.
    3.  **No Source:** All off -> Send "Hi" -> Payload `images` is empty or undefined.

## Virtual FGI Reflection & Intent Notes

**1. Why automatic capture instead of a preview UI?**
-   *Intent:* To minimize friction. The primary use case is "chatting naturally." Adding a "Preview -> Confirm" step slows down the conversation flow. The "Non-Goal" section explicitly excludes editing/preview to keep the MVP lightweight and conversational.

**2. Why transform data in `useTextInput` instead of changing `useMediaCapture`?**
-   *Intent:* Separation of concerns. `useMediaCapture` provides rich data (source type, mime type) which might be useful for future features (e.g., displaying "Screen Capture Sent" vs "Camera Photo Sent" in the UI). `useTextInput` is the specific consumer that only needs the raw string for the current WebSocket API contract.

**3. Handling Experimental API (`ImageCapture`)**
-   *Reflection:* Developers noted `ImageCapture` might crash on some browsers. We added "Step 2: Safety Check" to ensure the app remains stable even if the feature isn't supported, adhering to the principle of "Graceful Degradation."
