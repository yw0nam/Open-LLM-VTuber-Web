# Utilities

Updated: 2025-11-28

## 1. Synopsis

- **Purpose**: Global singletons for audio playback management and sequential task execution
- **I/O**: Audio/task inputs → Managed playback with Live2D lip sync / ordered task execution

## 2. Core Logic

### AudioManager (`audio-manager.ts`)

Global singleton managing audio playback with Live2D lip sync integration.

| Method | Description |
|--------|-------------|
| `setCurrentAudio(audio, model)` | Register playing audio and associated Live2D model |
| `stopCurrentAudioAndLipSync()` | Stop playback and reset lip sync state |
| `clearCurrentAudio(audio)` | Clear reference when audio ends naturally |
| `hasCurrentAudio()` | Check if audio is currently playing |

**Lip Sync Stop Logic:**
1. Pause and clear audio element
2. Call `model._wavFileHandler.releasePcmData()`
3. Reset `_lastRms`, `_sampleOffset`, `_userTimeSeconds`
4. Clear internal references

### TaskQueue (`task-queue.ts`)

Sequential task executor with configurable interval between tasks.

| Method | Description |
|--------|-------------|
| `addTask(task)` | Add async task to queue |
| `clearQueue()` | Clear all pending tasks |
| `hasTask()` | Check if tasks are pending or running |
| `waitForCompletion()` | Promise that resolves when queue is empty |

**Constructor:**
```typescript
new TaskQueue(taskIntervalMs = 3000)
```

**Pre-exported Instance:**
```typescript
export const audioTaskQueue = new TaskQueue(20); // 20ms interval
```

### Constraints

- `AudioManager`: Only one audio plays at a time; new audio stops previous
- `TaskQueue`: Tasks run sequentially; parallel execution not supported
- `audioTaskQueue` uses 20ms interval for smooth audio chunk playback

## 3. Usage

```typescript
import { audioManager } from '@/utils/audio-manager';
import { audioTaskQueue, TaskQueue } from '@/utils/task-queue';

// Audio playback with lip sync
const audio = new Audio(audioUrl);
audioManager.setCurrentAudio(audio, live2dModel);
audio.play();

// Stop on interrupt
audioManager.stopCurrentAudioAndLipSync();

// Queue audio chunks for sequential playback
audioTaskQueue.addTask(async () => {
  await playAudioChunk(chunk1);
});
audioTaskQueue.addTask(async () => {
  await playAudioChunk(chunk2);
});

// Wait for all chunks to finish
await audioTaskQueue.waitForCompletion();

// Clear queue on interrupt
audioTaskQueue.clearQueue();
```

---

## Appendix

### A. File Structure

```text
src/renderer/src/utils/
├── audio-manager.ts  # Global audio singleton
└── task-queue.ts     # Sequential task executor
```

### B. AudioManager Internal State

| Property | Type | Description |
|----------|------|-------------|
| `currentAudio` | `HTMLAudioElement \| null` | Currently playing audio |
| `currentModel` | `Live2DModel \| null` | Associated Live2D model |

### C. TaskQueue Internal State

| Property | Type | Description |
|----------|------|-------------|
| `queue` | `(() => Promise<void>)[]` | Pending tasks |
| `running` | `boolean` | Currently executing |
| `taskInterval` | `number` | Delay between tasks (ms) |
| `activeTasks` | `Set<Promise<void>>` | Currently running task |

### D. Related Documents

- Audio Task Hook: [../feature/hook/README.md](../feature/hook/README.md)
- Live2D Model Hook: [../feature/hook/README.md](../feature/hook/README.md)
