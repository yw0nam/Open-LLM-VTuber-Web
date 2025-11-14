/**
 * API Service Usage Examples
 *
 * This file demonstrates how to use the API service in your application.
 * You can copy these examples and adapt them to your needs.
 */

import { setBaseURL, stmAPI, ttsAPI, vlmAPI, APIError } from "../api-service";

// ============================================================================
// Configuration
// ============================================================================

/**
 * Initialize API service with base URL
 */
export function initializeAPIService(
  baseUrl: string = "http://127.0.0.1:5500/api/v1",
): void {
  setBaseURL(baseUrl);
  console.log("API service initialized with base URL:", baseUrl);
}

// ============================================================================
// STM Examples
// ============================================================================

/**
 * Example: Fetch and display all sessions
 */
export async function exampleListSessions(
  userId: string,
  agentId: string,
): Promise<void> {
  try {
    const sessions = await stmAPI.listSessions({
      user_id: userId,
      agent_id: agentId,
    });

    console.log(`Found ${sessions.length} sessions:`);
    sessions.forEach((session) => {
      console.log(
        `- ${session.session_id}: ${session.metadata.title || "Untitled"}`,
      );
    });
  } catch (error) {
    if (error instanceof APIError) {
      console.error("Failed to list sessions:", error.message);
    }
    throw error;
  }
}

/**
 * Example: Load chat history for a session
 */
export async function exampleLoadChatHistory(
  userId: string,
  agentId: string,
  sessionId: string,
  limit?: number,
): Promise<void> {
  try {
    const history = await stmAPI.getChatHistory({
      user_id: userId,
      agent_id: agentId,
      session_id: sessionId,
      limit,
    });

    console.log(`Chat history for session ${history.session_id}:`);
    console.log(`Total messages: ${history.messages.length}`);

    history.messages.forEach((message, index) => {
      console.log(
        `${index + 1}. [${message.role}]: ${message.content.substring(0, 50)}...`,
      );
    });
  } catch (error) {
    if (error instanceof APIError) {
      console.error("Failed to load chat history:", error.message);
    }
    throw error;
  }
}

/**
 * Example: Create a new chat session
 */
export async function exampleCreateNewSession(
  userId: string,
  agentId: string,
  initialMessage: string,
): Promise<string> {
  try {
    const result = await stmAPI.addChatHistory(
      {
        user_id: userId,
        agent_id: agentId,
        // No session_id = creates new session
      },
      {
        messages: [{ role: "user", content: initialMessage }],
      },
    );

    console.log(`Created new session: ${result.session_id}`);
    console.log(`Messages added: ${result.message_count}`);

    return result.session_id;
  } catch (error) {
    if (error instanceof APIError) {
      console.error("Failed to create session:", error.message);
    }
    throw error;
  }
}

/**
 * Example: Add messages to existing session
 */
export async function exampleAddMessages(
  userId: string,
  agentId: string,
  sessionId: string,
  userMessage: string,
  assistantMessage: string,
): Promise<void> {
  try {
    const result = await stmAPI.addChatHistory(
      {
        user_id: userId,
        agent_id: agentId,
        session_id: sessionId,
      },
      {
        messages: [
          { role: "user", content: userMessage },
          { role: "assistant", content: assistantMessage },
        ],
      },
    );

    console.log(
      `Added ${result.message_count} messages to session ${result.session_id}`,
    );
  } catch (error) {
    if (error instanceof APIError) {
      console.error("Failed to add messages:", error.message);
    }
    throw error;
  }
}

/**
 * Example: Update session title
 */
export async function exampleUpdateSessionTitle(
  sessionId: string,
  newTitle: string,
): Promise<void> {
  try {
    await stmAPI.updateSessionMetadata(sessionId, {
      title: newTitle,
    });

    console.log(`Updated session ${sessionId} title to: ${newTitle}`);
  } catch (error) {
    if (error instanceof APIError) {
      console.error("Failed to update session:", error.message);
    }
    throw error;
  }
}

/**
 * Example: Delete a session
 */
export async function exampleDeleteSession(
  userId: string,
  agentId: string,
  sessionId: string,
): Promise<void> {
  try {
    await stmAPI.deleteSession(sessionId, {
      user_id: userId,
      agent_id: agentId,
    });

    console.log(`Deleted session: ${sessionId}`);
  } catch (error) {
    if (error instanceof APIError) {
      console.error("Failed to delete session:", error.message);
    }
    throw error;
  }
}

// ============================================================================
// TTS Examples
// ============================================================================

/**
 * Example: Synthesize speech from text
 */
export async function exampleSynthesizeSpeech(text: string): Promise<string> {
  try {
    const result = await ttsAPI.synthesizeSpeech({
      text,
      output_format: "base64",
    });

    console.log(`Synthesized ${text.length} characters of text`);
    console.log(`Audio format: ${result.format}`);
    console.log(`Audio data length: ${result.audio_data.length} bytes`);

    return result.audio_data;
  } catch (error) {
    if (error instanceof APIError) {
      console.error("Failed to synthesize speech:", error.message);
    }
    throw error;
  }
}

/**
 * Example: Synthesize speech with voice cloning
 */
export async function exampleSynthesizeWithVoice(
  text: string,
  referenceId: string,
): Promise<string> {
  try {
    const result = await ttsAPI.synthesizeSpeech({
      text,
      reference_id: referenceId,
      output_format: "base64",
    });

    console.log(`Synthesized with voice ${referenceId}`);

    return result.audio_data;
  } catch (error) {
    if (error instanceof APIError) {
      console.error("Failed to synthesize with voice:", error.message);
    }
    throw error;
  }
}

/**
 * Example: Play synthesized audio
 */
export async function examplePlaySynthesizedAudio(text: string): Promise<void> {
  try {
    const base64Audio = await exampleSynthesizeSpeech(text);

    // Convert base64 to audio blob
    const byteCharacters = atob(base64Audio);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: "audio/wav" });

    // Create audio element and play
    const audioUrl = URL.createObjectURL(blob);
    const audio = new Audio(audioUrl);

    await audio.play();
    console.log("Playing audio...");

    // Clean up after playing
    audio.addEventListener("ended", () => {
      URL.revokeObjectURL(audioUrl);
      console.log("Audio playback finished");
    });
  } catch (error) {
    if (error instanceof APIError) {
      console.error("Failed to play audio:", error.message);
    }
    throw error;
  }
}

// ============================================================================
// VLM Examples
// ============================================================================

/**
 * Example: Analyze an image with a question
 */
export async function exampleAnalyzeImageWithPrompt(
  imageFile: File,
  prompt: string,
): Promise<string> {
  try {
    const result = await vlmAPI.analyzeImage({
      image: imageFile,
      prompt,
    });

    console.log(`Image analyzed with prompt: "${prompt}"`);
    console.log(`Analysis: ${result.analysis}`);

    return result.analysis;
  } catch (error) {
    if (error instanceof APIError) {
      console.error("Failed to analyze image:", error.message);
    }
    throw error;
  }
}

/**
 * Example: Get general image description
 */
export async function exampleDescribeImage(imageFile: File): Promise<string> {
  try {
    const result = await vlmAPI.analyzeImage({
      image: imageFile,
    });

    console.log("General image description:", result.analysis);

    return result.analysis;
  } catch (error) {
    if (error instanceof APIError) {
      console.error("Failed to describe image:", error.message);
    }
    throw error;
  }
}

/**
 * Example: Analyze image from URL
 */
export async function exampleAnalyzeImageFromURL(
  imageUrl: string,
  prompt?: string,
): Promise<string> {
  try {
    // Fetch image as blob
    const response = await fetch(imageUrl);
    const blob = await response.blob();

    const result = await vlmAPI.analyzeImage({
      image: blob,
      prompt,
    });

    console.log(`Analyzed image from ${imageUrl}`);
    console.log(`Analysis: ${result.analysis}`);

    return result.analysis;
  } catch (error) {
    if (error instanceof APIError) {
      console.error("Failed to analyze image from URL:", error.message);
    }
    throw error;
  }
}

// ============================================================================
// Comprehensive Example
// ============================================================================

/**
 * Example: Complete chat workflow with TTS and VLM
 */
export async function exampleCompleteChatWorkflow(
  userId: string,
  agentId: string,
  imageFile?: File,
): Promise<void> {
  try {
    // 1. Create new session
    console.log("Step 1: Creating new session...");
    const sessionId = await exampleCreateNewSession(
      userId,
      agentId,
      "Hello! I want to chat with you.",
    );

    // 2. Update session title
    console.log("Step 2: Updating session title...");
    await exampleUpdateSessionTitle(sessionId, "My First Chat with API");

    // 3. Add more messages
    console.log("Step 3: Adding messages...");
    await exampleAddMessages(
      userId,
      agentId,
      sessionId,
      "What can you help me with?",
      "I can help you with many things! Would you like to try image analysis or text-to-speech?",
    );

    // 4. Synthesize a response
    console.log("Step 4: Synthesizing speech...");
    const audioData = await exampleSynthesizeSpeech(
      "I can help you with many things!",
    );
    console.log(`Got audio data: ${audioData.substring(0, 50)}...`);

    // 5. Analyze image if provided
    if (imageFile) {
      console.log("Step 5: Analyzing image...");
      const analysis = await exampleAnalyzeImageWithPrompt(
        imageFile,
        "Describe this image in detail",
      );

      // Add image analysis to chat
      await exampleAddMessages(
        userId,
        agentId,
        sessionId,
        "Here is an image. What do you see?",
        analysis,
      );
    }

    // 6. Load full chat history
    console.log("Step 6: Loading chat history...");
    await exampleLoadChatHistory(userId, agentId, sessionId);

    console.log("Workflow completed successfully!");
  } catch (error) {
    console.error("Workflow failed:", error);
    throw error;
  }
}
