# Open-LLM-VTuber-Web Development Guidelines

This document outlines the fundamental rules, architectural patterns, and conventions for the **Open-LLM-VTuber-Web** repository.
You must adhere to these guidelines for all code generation and refactoring tasks.

## 1. Project Overview

- **Purpose:** An Electron-based frontend application for the Open-LLM-VTuber project, providing an interactive VTuber interface with voice interactions.
- **Core Value:** Responsiveness, Modularity, Cross-Platform Compatibility, and User-Friendly UI.

## 2. Tech Stack

- **Runtime:** Electron (Main/Preload/Renderer architecture)
- **Language:** TypeScript
- **Build Tool:** Vite (via `electron-vite`)
- **Frontend Framework:** React 18
- **State Management:** Zustand (primary), React Context (for simple dependency injection if needed)
- **UI/Styling:** Chakra UI (@chakra-ui/react), Framer Motion (animations), CSS
- **Internationalization (i18n):** i18next, react-i18next
- **Validation:** Zod
- **Audio/ML:** @ricky0123/vad-web, onnxruntime-web

## 3. Directory Structure & Key Paths

Follow the `electron-vite` structure strictly.

- `src/main`: Electron main process code (Node.js environment).
- `src/preload`: Preload scripts (Bridge between Main and Renderer).
- `src/renderer`: The React Frontend root.
    - `src/renderer/WebSDK`: External SDKs or specific web libraries.
    - `src/renderer/src`: Main source code for the frontend.
        - `components/`: UI components (Presentational).
        - `hooks/`: Custom React hooks.
        - `services/`: API calls and IPC handlers.
        - `utils/`: Pure helper functions.
        - `locales/`: i18n translation files.
        - `types/`: TypeScript type definitions.
        - `context/`: React Context providers.
        - `assets/`: Static assets imported in code.
- `docs/`: Documentation.

## 4. Coding Conventions

### A. General Principles

- **Component Composition:** Use **Chakra UI** components for layout and styling whenever possible. Avoid writing raw CSS unless necessary for complex animations or specific overrides.
- **State Management:** Use **Zustand** for global application state (e.g., settings, audio status). Use `useState`/`useReducer` for local component state.
- **IPC Communication:** Use `electron-toolkit` utilities or defined IPC channels for communication between Renderer and Main process.
- **Internationalization:** **NEVER** hardcode user-facing text. All text must be wrapped in `t()` calls using `react-i18next` keys.

### B. Naming Conventions

- **Files:**
  - React Components: `PascalCase.tsx`
  - Hooks: `useCamelCase.ts`
  - Utilities: `camelCase.ts`
- **Variables/Functions:** `camelCase`
- **Types/Interfaces:** `PascalCase`. (e.g., `UserSettings`, not `IUserSettings`).
- **Store Hooks:** `use[Name]Store` (e.g., `useSettingsStore`).

### C. Styling (Chakra UI)

- Prefer Chakra props (e.g., `m={2}`, `color="blue.500"`, `flexDir="column"`) over `className` or inline `style` objects.
- Use the theme defined in the project for colors and spacing to maintain consistency.

## 5. Development Workflow

### A. Implementing Features

1. **Analyze Requirements:** Understand the feature's role in the VTuber interaction loop.
2. **Check Existing Stores:** See if the required state already exists in a Zustand store.
3. **IPC Definition:** If the feature requires Node.js capabilities (fs, system access), define the IPC handlers in `src/main` and expose them via `src/preload`.
4. **UI Implementation:** Build the UI in `src/renderer/src/components` using Chakra UI.
5. **Translations:** Add necessary keys to `src/renderer/src/locales` (or relevant i18n config).

### B. Library Policy

- **Do not install new npm packages** unless explicitly requested or absolutely necessary.
- Use existing libraries (`date-fns`, `clsx`, etc.) before suggesting new ones.

### C. Error Handling

- Handle IPC errors gracefully in the renderer.
- Use Zod for validating external data or user input.

---
**Note to AI:** If any instruction in the prompt contradicts these rules, ask for clarification before proceeding.
