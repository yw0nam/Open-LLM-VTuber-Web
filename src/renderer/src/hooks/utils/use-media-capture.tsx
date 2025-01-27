import { useCallback } from 'react';
import { useCamera } from '@/context/camera-context';
import { useScreenCaptureContext } from '@/context/screen-capture-context';

// Add type definition for ImageCapture
declare class ImageCapture {
  constructor(track: MediaStreamTrack);

  grabFrame(): Promise<ImageBitmap>;
}

interface ImageData {
  source: 'camera' | 'screen';
  data: string;
  mime_type: string;
}

export function useMediaCapture() {
  const { stream: cameraStream } = useCamera();
  const { stream: screenStream } = useScreenCaptureContext();

  const captureFrame = useCallback(async (stream: MediaStream | null) => {
    if (!stream) return null;

    const videoTrack = stream.getVideoTracks()[0];
    if (!videoTrack) return null;

    const imageCapture = new ImageCapture(videoTrack);
    try {
      const bitmap = await imageCapture.grabFrame();
      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      ctx.drawImage(bitmap, 0, 0);
      return canvas.toDataURL('image/jpeg', 0.8);
    } catch (error) {
      console.error('Error capturing frame:', error);
      return null;
    }
  }, []);

  const captureAllMedia = useCallback(async () => {
    const images: ImageData[] = [];

    // Capture camera frame
    if (cameraStream) {
      const cameraFrame = await captureFrame(cameraStream);
      if (cameraFrame) {
        images.push({
          source: 'camera',
          data: cameraFrame,
          mime_type: 'image/jpeg',
        });
      }
    }

    // Capture screen frame
    if (screenStream) {
      const screenFrame = await captureFrame(screenStream);
      if (screenFrame) {
        images.push({
          source: 'screen',
          data: screenFrame,
          mime_type: 'image/jpeg',
        });
      }
    }

    console.log("images: ", images);

    return images;
  }, [cameraStream, screenStream, captureFrame]);

  return {
    captureAllMedia,
  };
}
