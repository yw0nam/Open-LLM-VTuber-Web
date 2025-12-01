# Fix Sidebar setting is not using 

Side bar setting is not applid to the service

## Background & Context

I face below issues when using Open-LLM-VTuber-Web:

1. **When i change the setting in sidebar, it is not applied to the frontend service.**
2. **The setting value only use default value.**

## Proposed Solution

The setting value should be modified when user push the save button.

## Constraints

1. **UI/UX:** The implementation must be integrated into the current sidebar design. It should be intuitive and not overwhelm the user.
2. **Tech Stack:** React, TypeScript (Frontend), Python (Backend).

## Relate Documents

- [API Service](../../feature/service/api-service.md)
- [Sidebar](../../feature/component/sidebar.md)
- [Main](../../../main/README.md)
- [Context](../../../feature/context/README.md)