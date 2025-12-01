# Live2D Config Context

Updated: 2025-11-28

## 1. Synopsis

- **Purpose**: Live2D model configuration and model info management
- **I/O**: Model path/config → Model info for rendering

## 2. Core Logic

### Context Interface

```typescript
interface Live2DConfigContextType {
  modelPath: string;
  setModelPath: (path: string) => void;
  modelInfo: ModelInfo | null;
  setModelInfo: (info: ModelInfo | null) => void;
}
```

### ModelInfo Structure

```typescript
interface ModelInfo {
  name: string;
  path: string;               // Path to model3.json
  emotionMap?: EmotionMap;    // Expression name → index mapping
  defaultExpression?: string; // Default expression name
  kScale?: number;            // Model scale factor
  initialXshift?: number;     // Initial X position offset
  initialYshift?: number;     // Initial Y position offset
}
```

### EmotionMap

Maps emotion names to expression indices:

```typescript
interface EmotionMap {
  [emotionName: string]: number;  // e.g., { "happy": 0, "sad": 1 }
}
```

### Constraints

- Model path must point to valid `.model3.json` file
- Model files expected in `public/` or accessible path
- `emotionMap` derived from model's expression list

## 3. Usage

```tsx
import { useLive2DConfig } from '@/context/live2d-config-context';

function Live2DComponent() {
  const { modelPath, setModelPath, modelInfo } = useLive2DConfig();

  // Load different model
  const switchModel = (newPath: string) => {
    setModelPath(newPath);
  };

  // Access model info
  if (modelInfo) {
    console.log('Model name:', modelInfo.name);
    console.log('Available expressions:', Object.keys(modelInfo.emotionMap || {}));
  }
}
```

---

## Appendix

### A. File Location

```text
src/renderer/src/context/live2d-config-context.tsx
```

### B. Related Documents

- Canvas Hooks: [../hook/canvas.md](../hook/canvas.md)
- Canvas Components: [../component/canvas.md](../component/canvas.md)

