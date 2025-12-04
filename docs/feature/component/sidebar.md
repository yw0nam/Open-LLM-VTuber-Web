# Sidebar Components

Updated: 2025-12-03

## 1. Synopsis

- **Purpose**: Left panel with chat history, settings, camera/screen controls, and navigation
- **I/O**: User interactions → State updates, API calls, settings changes
- **Location**: `src/renderer/src/components/sidebar/`

## 2. Core Logic

### Components

| Component | File | Purpose |
|-----------|------|---------|
| `Sidebar` | `sidebar.tsx` | Main container with header and tabs |
| `ChatHistoryPanel` | `chat-history-panel.tsx` | Message list display |
| `HistoryDrawer` | `history-drawer.tsx` | Session history list |
| `CameraPanel` | `camera-panel.tsx` | Camera stream controls |
| `ScreenCapturePanel` | `screen-capture-panel.tsx` | Screen capture controls |
| `BottomTab` | `bottom-tab.tsx` | Tab navigation |
| `SettingUI` | `setting/setting-ui.tsx` | Settings panel container |

### Sidebar Component

Main container with collapsible behavior.

**Props:**

```typescript
interface SidebarProps {
  isCollapsed?: boolean;
  onToggle: () => void;
}
```

**Features:**

- Collapsible with toggle button
- Mode switching menu (Window/Pet)
- New session creation button
- Settings and history drawer access

### ChatHistoryPanel

Message list using @chatscope/chat-ui-kit.

**Features:**

- User/Assistant/Tool message rendering
- Auto-scroll to latest message
- Tool call display with collapsible arguments

### HistoryDrawer

Session history list in a drawer.

**Features:**

- Session list with timestamps
- New chat creation button
- Session selection
- Delete session option

### Settings Panels

| Panel | File | Purpose |
|-------|------|---------|
| `GeneralPanel` | `general-panel.tsx` | Language, theme, URL settings |
| `AgentPanel` | `agent-panel.tsx` | Agent ID, user ID configuration |
| `AsrPanel` | `asr-panel.tsx` | Speech recognition settings |
| `TtsPanel` | `tts-panel.tsx` | Text-to-speech settings |
| `Live2dPanel` | `live2d-panel.tsx` | Model selection, expression settings |
| `AboutPanel` | `about-panel.tsx` | Version info, links |

### General Settings Fields

| Field | Storage | Description |
|-------|---------|-------------|
| User ID | localStorage (`user_id`) | User identifier |
| Agent ID | localStorage (`agent_id`) | Agent identifier |
| Auth Token | localStorage (`authToken`) | WebSocket auth token |
| WebSocket URL | localStorage (`wsUrl`) | Real-time streaming endpoint |
| Base URL | localStorage (`baseUrl`) | REST API base URL |
| Language | i18n | UI language |
| Background | Context | Background image/camera |
| Character Preset | Context | Active character config |

### Constraints

- Sidebar hidden in pet mode
- Chat panel uses @chatscope library
- Settings persist to localStorage

## 3. Usage

```tsx
import Sidebar from '@/components/sidebar/sidebar';

// In layout
const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

<Sidebar 
  isCollapsed={isSidebarCollapsed} 
  onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
/>
```

---

## Appendix

### A. File Structure

```text
src/renderer/src/components/sidebar/
├── sidebar.tsx
├── sidebar-styles.tsx
├── chat-history-panel.tsx
├── history-drawer.tsx
├── camera-panel.tsx
├── screen-capture-panel.tsx
├── bottom-tab.tsx
└── setting/
    ├── setting-ui.tsx
    ├── general-panel.tsx
    ├── agent-panel.tsx
    ├── asr-panel.tsx
    ├── tts-panel.tsx
    ├── live2d-panel.tsx
    └── about-panel.tsx
```

### B. Context Dependencies

| Component | Required Contexts |
|-----------|-------------------|
| `Sidebar` | `ModeContext` |
| `ChatHistoryPanel` | `ChatHistoryContext` |
| `HistoryDrawer` | `ChatHistoryContext` |
| `CameraPanel` | `CameraContext` |
| `ScreenCapturePanel` | `ScreenCaptureContext` |
| `SettingUI` | Various setting contexts |

### C. Related Documents

- Sidebar Hooks: [../../hook/sidebar.md](../../hook/sidebar.md)
- Chat History Context: [../../context/chat-history.md](../../context/chat-history.md)

