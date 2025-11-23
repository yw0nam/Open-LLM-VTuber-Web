// src/renderer/src/services/websocket-service/handlers/handleTTSReadyChunk.ts

import { synthesizeSpeech } from "@/services/api-service/tts";
import type { TTSSynthesizeRequest } from "@/services/schemas/tts";
import type { AiState } from "@/context/ai-state-context";
import type { useAudioTask } from "@/hooks/utils/use-audio-task";
/**
 * Context object passed to message handlers containing state and command functions
 */
export async function handleTTSReadyChunk(
    chunk: string,
    emotion: string | null,
    aistate: AiState,
    addAudioTask: ReturnType<typeof useAudioTask>["addAudioTask"],
    t: (key: string) => string, // 👈 [수정] t 함수를 직접 인자로 받습니다.
    toaster?: any,
) {

    if (aistate === "interrupted" || aistate === "listening") {
        console.log(
            "Audio playback intercepted. Sentence:",
            chunk,
        );
        return;
    }

    if (!chunk?.trim()) {
        console.warn("Received empty TTS chunk. Skipping synthesis.");
        return;
    }

    const referenceVoice = localStorage.getItem("tts_reference_voice");
    const synthesizePayload: TTSSynthesizeRequest = {
        text: chunk,
        output_format: "base64",
        ...(referenceVoice && { reference_id: referenceVoice }),
    };

    try {
        const audioData = await synthesizeSpeech(synthesizePayload);

        addAudioTask({
            audioBase64: audioData.audio_data,
            volumes: [],
            sliceLength: 0,
            text: chunk,
            expressions: emotion ? [emotion] : null,
            forwarded: false,
        });
    } catch (error) {
        console.error("TTS synthesis failed:", error);
        toaster?.create({
            title: t("notification.ttsFailed"),
            type: "error",
            duration: 2000,
        });
    }
}