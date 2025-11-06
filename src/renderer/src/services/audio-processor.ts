/**
 * Audio Processing Utilities
 *
 * Provides utilities for processing audio data for lip-sync animation,
 * including base64 decoding, WAV parsing, and volume extraction.
 */

import { debugLog, errorLog } from "./logger";

/**
 * WAV file header structure for validation
 */
interface WAVHeader {
  riff: string; // "RIFF"
  fileSize: number;
  wave: string; // "WAVE"
  fmt: string; // "fmt "
  fmtSize: number;
  audioFormat: number; // 1 = PCM
  numChannels: number;
  sampleRate: number;
  byteRate: number;
  blockAlign: number;
  bitsPerSample: number;
}

/**
 * Result of base64 WAV decoding
 */
export interface DecodedWAV {
  arrayBuffer: ArrayBuffer;
  header: WAVHeader;
  isValid: boolean;
}

/**
 * Extracted PCM audio data
 */
export interface PCMData {
  samples: Float32Array;
  sampleRate: number;
  numChannels: number;
  duration: number; // in seconds
}

/**
 * Decodes a base64-encoded WAV audio string into an ArrayBuffer
 * and validates the WAV header.
 *
 * @param base64Audio - Base64-encoded WAV audio data
 * @returns Decoded WAV data with validation status
 * @throws Error if base64 string is empty or invalid
 */
export function decodeBase64WAV(base64Audio: string): DecodedWAV {
  debugLog("audio-processor", "Decoding base64 WAV audio", {
    length: base64Audio.length,
  });

  // Validate input
  if (!base64Audio || base64Audio.trim().length === 0) {
    const error = new Error("Base64 audio string is empty");
    errorLog("audio-processor", "Failed to decode base64 WAV", error);
    throw error;
  }

  try {
    // Remove data URL prefix if present (e.g., "data:audio/wav;base64,")
    const cleanBase64 = base64Audio.replace(/^data:audio\/wav;base64,/, "");

    // Decode base64 to binary string
    const binaryString = atob(cleanBase64);

    // Convert binary string to ArrayBuffer
    const arrayBuffer = new ArrayBuffer(binaryString.length);
    const uint8Array = new Uint8Array(arrayBuffer);

    for (let i = 0; i < binaryString.length; i++) {
      uint8Array[i] = binaryString.charCodeAt(i);
    }

    // Validate WAV header
    const header = parseWAVHeader(arrayBuffer);
    const isValid = validateWAVHeader(header);

    debugLog("audio-processor", "Base64 WAV decoded successfully", {
      bufferSize: arrayBuffer.byteLength,
      isValid,
      sampleRate: header.sampleRate,
      channels: header.numChannels,
      bitsPerSample: header.bitsPerSample,
    });

    return {
      arrayBuffer,
      header,
      isValid,
    };
  } catch (error) {
    errorLog("audio-processor", "Failed to decode base64 WAV", error as Error);
    throw error;
  }
}

/**
 * Parses the WAV header from an ArrayBuffer
 *
 * @param arrayBuffer - ArrayBuffer containing WAV data
 * @returns Parsed WAV header
 */
function parseWAVHeader(arrayBuffer: ArrayBuffer): WAVHeader {
  const dataView = new DataView(arrayBuffer);

  // Read RIFF header (bytes 0-3)
  const riff = String.fromCharCode(
    dataView.getUint8(0),
    dataView.getUint8(1),
    dataView.getUint8(2),
    dataView.getUint8(3),
  );

  // File size (bytes 4-7)
  const fileSize = dataView.getUint32(4, true);

  // WAVE format (bytes 8-11)
  const wave = String.fromCharCode(
    dataView.getUint8(8),
    dataView.getUint8(9),
    dataView.getUint8(10),
    dataView.getUint8(11),
  );

  // Format chunk marker (bytes 12-15)
  const fmt = String.fromCharCode(
    dataView.getUint8(12),
    dataView.getUint8(13),
    dataView.getUint8(14),
    dataView.getUint8(15),
  );

  // Format chunk size (bytes 16-19)
  const fmtSize = dataView.getUint32(16, true);

  // Audio format (bytes 20-21) - 1 = PCM
  const audioFormat = dataView.getUint16(20, true);

  // Number of channels (bytes 22-23)
  const numChannels = dataView.getUint16(22, true);

  // Sample rate (bytes 24-27)
  const sampleRate = dataView.getUint32(24, true);

  // Byte rate (bytes 28-31)
  const byteRate = dataView.getUint32(28, true);

  // Block align (bytes 32-33)
  const blockAlign = dataView.getUint16(32, true);

  // Bits per sample (bytes 34-35)
  const bitsPerSample = dataView.getUint16(34, true);

  return {
    riff,
    fileSize,
    wave,
    fmt,
    fmtSize,
    audioFormat,
    numChannels,
    sampleRate,
    byteRate,
    blockAlign,
    bitsPerSample,
  };
}

/**
 * Validates a WAV header for correctness
 *
 * @param header - WAV header to validate
 * @returns True if header is valid, false otherwise
 */
function validateWAVHeader(header: WAVHeader): boolean {
  const errors: string[] = [];

  // Check RIFF marker
  if (header.riff !== "RIFF") {
    errors.push(`Invalid RIFF marker: ${header.riff}`);
  }

  // Check WAVE format
  if (header.wave !== "WAVE") {
    errors.push(`Invalid WAVE format: ${header.wave}`);
  }

  // Check fmt chunk
  if (header.fmt !== "fmt ") {
    errors.push(`Invalid fmt chunk: ${header.fmt}`);
  }

  // Check audio format (1 = PCM)
  if (header.audioFormat !== 1) {
    errors.push(
      `Unsupported audio format: ${header.audioFormat} (expected PCM = 1)`,
    );
  }

  // Check channels (1 or 2)
  if (header.numChannels < 1 || header.numChannels > 2) {
    errors.push(
      `Invalid channel count: ${header.numChannels} (expected 1 or 2)`,
    );
  }

  // Check sample rate (reasonable range)
  if (header.sampleRate < 8000 || header.sampleRate > 192000) {
    errors.push(
      `Invalid sample rate: ${header.sampleRate} (expected 8000-192000)`,
    );
  }

  // Check bits per sample (8, 16, 24, or 32)
  if (![8, 16, 24, 32].includes(header.bitsPerSample)) {
    errors.push(
      `Invalid bits per sample: ${header.bitsPerSample} (expected 8, 16, 24, or 32)`,
    );
  }

  // Validate block align
  const expectedBlockAlign = (header.numChannels * header.bitsPerSample) / 8;
  if (header.blockAlign !== expectedBlockAlign) {
    errors.push(
      `Invalid block align: ${header.blockAlign} (expected ${expectedBlockAlign})`,
    );
  }

  // Validate byte rate
  const expectedByteRate =
    header.sampleRate * header.numChannels * (header.bitsPerSample / 8);
  if (header.byteRate !== expectedByteRate) {
    errors.push(
      `Invalid byte rate: ${header.byteRate} (expected ${expectedByteRate})`,
    );
  }

  if (errors.length > 0) {
    errorLog(
      "audio-processor",
      "WAV header validation failed",
      new Error(errors.join("; ")),
    );
    return false;
  }

  return true;
}

/**
 * Finds the data chunk in a WAV file
 *
 * @param arrayBuffer - ArrayBuffer containing WAV data
 * @returns Offset to the start of PCM data
 */
function findDataChunk(arrayBuffer: ArrayBuffer): number {
  const dataView = new DataView(arrayBuffer);
  let offset = 12; // Start after RIFF header

  // Search for 'data' chunk
  while (offset < arrayBuffer.byteLength - 8) {
    const chunkId = String.fromCharCode(
      dataView.getUint8(offset),
      dataView.getUint8(offset + 1),
      dataView.getUint8(offset + 2),
      dataView.getUint8(offset + 3),
    );

    const chunkSize = dataView.getUint32(offset + 4, true);

    if (chunkId === "data") {
      return offset + 8; // Return offset to actual data (skip 'data' + size)
    }

    // Move to next chunk (chunk ID + size + chunk data)
    offset += 8 + chunkSize;
  }

  throw new Error("Data chunk not found in WAV file");
}

/**
 * Extracts PCM samples from a WAV file
 *
 * @param arrayBuffer - ArrayBuffer containing WAV data
 * @param header - Parsed WAV header
 * @returns Extracted PCM data as Float32Array
 */
export function extractPCMSamples(
  arrayBuffer: ArrayBuffer,
  header: WAVHeader,
): PCMData {
  debugLog("audio-processor", "Extracting PCM samples", {
    channels: header.numChannels,
    sampleRate: header.sampleRate,
    bitsPerSample: header.bitsPerSample,
  });

  try {
    const dataOffset = findDataChunk(arrayBuffer);
    const dataView = new DataView(arrayBuffer);

    // Calculate number of samples
    const bytesRemaining = arrayBuffer.byteLength - dataOffset;
    const bytesPerSample = header.bitsPerSample / 8;
    const totalSamples = Math.floor(bytesRemaining / bytesPerSample);

    // Create output array (mono - if stereo, we'll mix down)
    const numFrames = Math.floor(totalSamples / header.numChannels);
    const samples = new Float32Array(numFrames);

    // Extract and convert samples based on bit depth
    switch (header.bitsPerSample) {
      case 8:
        extract8BitSamples(dataView, dataOffset, samples, header.numChannels);
        break;
      case 16:
        extract16BitSamples(dataView, dataOffset, samples, header.numChannels);
        break;
      case 24:
        extract24BitSamples(dataView, dataOffset, samples, header.numChannels);
        break;
      case 32:
        extract32BitSamples(dataView, dataOffset, samples, header.numChannels);
        break;
      default:
        throw new Error(`Unsupported bit depth: ${header.bitsPerSample}`);
    }

    const duration = numFrames / header.sampleRate;

    debugLog("audio-processor", "PCM extraction complete", {
      totalFrames: numFrames,
      duration: `${duration.toFixed(2)}s`,
    });

    return {
      samples,
      sampleRate: header.sampleRate,
      numChannels: header.numChannels,
      duration,
    };
  } catch (error) {
    errorLog(
      "audio-processor",
      "Failed to extract PCM samples",
      error as Error,
    );
    throw error;
  }
}

/**
 * Extract 8-bit PCM samples (unsigned, 0-255)
 */
function extract8BitSamples(
  dataView: DataView,
  offset: number,
  output: Float32Array,
  numChannels: number,
): void {
  for (let i = 0; i < output.length; i++) {
    if (numChannels === 1) {
      // Mono: convert unsigned 8-bit (0-255) to float (-1 to 1)
      output[i] = (dataView.getUint8(offset + i) - 128) / 128;
    } else {
      // Stereo: mix down to mono
      const left = (dataView.getUint8(offset + i * 2) - 128) / 128;
      const right = (dataView.getUint8(offset + i * 2 + 1) - 128) / 128;
      output[i] = (left + right) / 2;
    }
  }
}

/**
 * Extract 16-bit PCM samples (signed, -32768 to 32767)
 */
function extract16BitSamples(
  dataView: DataView,
  offset: number,
  output: Float32Array,
  numChannels: number,
): void {
  for (let i = 0; i < output.length; i++) {
    if (numChannels === 1) {
      // Mono: convert signed 16-bit to float (-1 to 1)
      output[i] = dataView.getInt16(offset + i * 2, true) / 32768;
    } else {
      // Stereo: mix down to mono
      const left = dataView.getInt16(offset + i * 4, true) / 32768;
      const right = dataView.getInt16(offset + i * 4 + 2, true) / 32768;
      output[i] = (left + right) / 2;
    }
  }
}

/**
 * Extract 24-bit PCM samples (signed)
 */
function extract24BitSamples(
  dataView: DataView,
  offset: number,
  output: Float32Array,
  numChannels: number,
): void {
  const read24Bit = (byteOffset: number): number => {
    const byte1 = dataView.getUint8(byteOffset);
    const byte2 = dataView.getUint8(byteOffset + 1);
    const byte3 = dataView.getUint8(byteOffset + 2);

    // Combine bytes (little-endian) and convert to signed
    let value = byte1 | (byte2 << 8) | (byte3 << 16);
    if (value & 0x800000) {
      value |= ~0xffffff; // Sign extend
    }
    return value / 8388608; // Normalize to -1 to 1
  };

  for (let i = 0; i < output.length; i++) {
    if (numChannels === 1) {
      output[i] = read24Bit(offset + i * 3);
    } else {
      const left = read24Bit(offset + i * 6);
      const right = read24Bit(offset + i * 6 + 3);
      output[i] = (left + right) / 2;
    }
  }
}

/**
 * Extract 32-bit PCM samples (signed)
 */
function extract32BitSamples(
  dataView: DataView,
  offset: number,
  output: Float32Array,
  numChannels: number,
): void {
  for (let i = 0; i < output.length; i++) {
    if (numChannels === 1) {
      // 32-bit is typically float, but check if it's int
      output[i] = dataView.getFloat32(offset + i * 4, true);
    } else {
      const left = dataView.getFloat32(offset + i * 8, true);
      const right = dataView.getFloat32(offset + i * 8 + 4, true);
      output[i] = (left + right) / 2;
    }
  }
}

/**
 * Extracts volume data from base64-encoded WAV audio
 *
 * @param base64Audio - Base64-encoded WAV audio data
 * @param frameSize - Number of samples per frame (default: 1024)
 * @returns Array of normalized volume values (0-1 range)
 */
export function extractVolumesFromWAV(
  base64Audio: string,
  frameSize: number = 1024,
): number[] {
  debugLog("audio-processor", "Starting volume extraction", { frameSize });

  try {
    // Step 1: Decode base64 WAV
    const decoded = decodeBase64WAV(base64Audio);

    if (!decoded.isValid) {
      throw new Error("Invalid WAV file - cannot extract volumes");
    }

    // Step 2: Extract PCM samples
    const pcmData = extractPCMSamples(decoded.arrayBuffer, decoded.header);

    // Step 3: Calculate RMS per frame
    const rmsValues = calculateRMSPerFrame(pcmData.samples, frameSize);

    // Step 4: Normalize to 0-1 range
    const normalizedVolumes = normalizeVolumes(rmsValues);

    debugLog("audio-processor", "Volume extraction complete", {
      totalFrames: normalizedVolumes.length,
      duration: `${pcmData.duration.toFixed(2)}s`,
    });

    return normalizedVolumes;
  } catch (error) {
    errorLog(
      "audio-processor",
      "Failed to extract volumes from WAV",
      error as Error,
    );
    throw error;
  }
}

/**
 * Calculates RMS (Root Mean Square) volume for each frame of audio samples
 *
 * @param samples - PCM audio samples (Float32Array, normalized to -1 to 1)
 * @param frameSize - Number of samples per frame (default: 1024)
 * @returns Array of RMS values, one per frame
 */
export function calculateRMSPerFrame(
  samples: Float32Array,
  frameSize: number = 1024,
): number[] {
  debugLog("audio-processor", "Calculating RMS per frame", {
    totalSamples: samples.length,
    frameSize,
    numFrames: Math.ceil(samples.length / frameSize),
  });

  const rmsValues: number[] = [];
  const numFrames = Math.ceil(samples.length / frameSize);

  for (let frameIndex = 0; frameIndex < numFrames; frameIndex++) {
    const frameStart = frameIndex * frameSize;
    const frameEnd = Math.min(frameStart + frameSize, samples.length);
    const actualFrameSize = frameEnd - frameStart;

    // Calculate sum of squares for this frame
    let sumOfSquares = 0;
    for (let i = frameStart; i < frameEnd; i++) {
      sumOfSquares += samples[i] * samples[i];
    }

    // Calculate RMS: sqrt(average of squares)
    const rms = Math.sqrt(sumOfSquares / actualFrameSize);
    rmsValues.push(rms);
  }

  debugLog("audio-processor", "RMS calculation complete", {
    numFrames: rmsValues.length,
    avgRMS: (
      rmsValues.reduce((sum, val) => sum + val, 0) / rmsValues.length
    ).toFixed(4),
    maxRMS: Math.max(...rmsValues).toFixed(4),
  });

  return rmsValues;
}

/**
 * Normalizes RMS volume values to 0-1 range
 *
 * @param rmsValues - Array of RMS values (typically 0 to ~0.7 for normalized audio)
 * @param maxAmplitude - Maximum possible RMS value (default: 1.0 for normalized Float32)
 * @returns Array of normalized values between 0 and 1
 */
export function normalizeVolumes(
  rmsValues: number[],
  maxAmplitude: number = 1.0,
): number[] {
  debugLog("audio-processor", "Normalizing volume data", {
    numValues: rmsValues.length,
    maxAmplitude,
  });

  if (rmsValues.length === 0) {
    return [];
  }

  // Find the actual maximum RMS value in the data
  const actualMax = Math.max(...rmsValues);

  // If all values are zero (silence), return all zeros
  if (actualMax === 0) {
    debugLog("audio-processor", "All RMS values are zero (silence)");
    return new Array(rmsValues.length).fill(0);
  }

  // Normalize based on the maximum amplitude
  // For typical audio, RMS max is around 0.707 for sine waves at full amplitude
  // We use the provided maxAmplitude (default 1.0) for normalization
  const normalizationFactor = Math.min(actualMax, maxAmplitude);

  const normalized = rmsValues.map((rms) => {
    const normalizedValue = rms / normalizationFactor;
    // Clamp to [0, 1] range to handle any edge cases
    return Math.max(0, Math.min(1, normalizedValue));
  });

  debugLog("audio-processor", "Normalization complete", {
    actualMax: actualMax.toFixed(4),
    normalizationFactor: normalizationFactor.toFixed(4),
    avgNormalized: (
      normalized.reduce((sum, val) => sum + val, 0) / normalized.length
    ).toFixed(4),
  });

  return normalized;
}
