# Other Contexts

Updated: 2025-11-28

## 1. Synopsis

- **Purpose**: Additional context providers for subtitle, background, camera, screen capture, character config, and proactive speak
- **I/O**: Configuration → State accessible throughout the app

## 2. Core Logic

### SubtitleContext

Manages subtitle display state.

```typescript
interface SubtitleContextType {
  subtitleText: string;
  setSubtitleText: (text: string) => void;
  isSubtitleVisible: boolean;
  setIsSubtitleVisible: (visible: boolean) => void;
}
```

### BgUrlContext

Background image URL management.

```typescript
interface BgUrlContextType {
  bgUrl: string;
  setBgUrl: (url: string) => void;
}
```

### CameraContext

Camera stream management.

```typescript
interface CameraContextType {
  cameraStream: MediaStream | null;
  setCameraStream: (stream: MediaStream | null) => void;
  isCameraActive: boolean;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
}
```

### ScreenCaptureContext

Screen capture management.

```typescript
interface ScreenCaptureContextType {
  captureStream: MediaStream | null;
  isCapturing: boolean;
  startCapture: () => Promise<void>;
  stopCapture: () => void;
}
```

### CharacterConfigContext

Agent and user configuration.

```typescript
interface CharacterConfigContextType {
  agentId: string;
  setAgentId: (id: string) => void;
  userId: string;
  setUserId: (id: string) => void;
  configFiles: ConfigFile[];
  setConfigFiles: (files: ConfigFile[]) => void;
}
```

### ProactiveSpeakContext

Proactive speaking settings.

```typescript
interface ProactiveSpeakContextType {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
  interval: number;  // ms
  setInterval: (interval: number) => void;
}
```

## 3. Usage

```tsx
// Subtitle
const { subtitleText, setSubtitleText } = useSubtitle();

// Background
const { bgUrl, setBgUrl } = useBgUrl();

// Camera
const { startCamera, stopCamera, isCameraActive } = useCamera();

// Screen capture
const { startCapture, stopCapture, isCapturing } = useScreenCapture();

// Character config
const { agentId, userId, setAgentId } = useCharacterConfig();

// Proactive speak
const { enabled, interval, setEnabled } = useProactiveSpeak();
```

---

## Appendix

### A. File Locations

```text
src/renderer/src/context/
├── subtitle-context.tsx
├── bgurl-context.tsx
├── camera-context.tsx
├── screen-capture-context.tsx
├── character-config-context.tsx
└── proactive-speak-context.tsx
```

### B. Related Documents

- Canvas Components: [../component/canvas.md](../component/canvas.md)
- Sidebar Components: [../component/sidebar.md](../component/sidebar.md)

