# Add Image in chat_message websocket event type

Issued: 2025-12-03

## Background & Context

In the current implementation, image not added into chat_message websocket event type. This feature proposal aims to enhance the websocket event type to include image data, allowing for richer communication capabilities

## Goal

When user toggle the camera or screen option in the sidebar.
The Image should be included in the chat_message websocket event type as a base64 or URL.

## Proposed Solution

1. **WebSocket Event Update**: chat_message has already option for image. Add logic to convey the image data when camera or screen capture is toggled.
2. **Frontend Integration**: Check camera/screen toggle state in sidebar component. When toggled, capture the image data and include it in the chat_message payload.

## Constraints

1. **UI/UX:** The implementation must be integrated into the current sidebar design. It should be intuitive and not overwhelm the user.
2. **Tech Stack:** React, TypeScript (Frontend), Python (Backend).

## Relate Documents

- [Web Socket Service](../../../feature/service/websocket-service.md)
- [Schema](../../../feature/service/schemas.md)
- [Sidebar](../../../feature/component/sidebar.md)
- [Main](../../../main/README.md)
- [Context](../../../feature/context/README.md)