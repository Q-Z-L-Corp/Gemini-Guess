import { Button } from "@qzlcorp/react";
import { useCallback, useEffect, useRef, useState } from "react";

export interface MediaCaptureProps {
  onCaptureFrame: (base64: string) => void;
  isRecording: boolean;
  onVoiceData: (blob: Blob) => void;
}

export const MediaCapture = ({
  onCaptureFrame,
  isRecording,
  onVoiceData,
}: MediaCaptureProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const onCaptureFrameRef = useRef(onCaptureFrame);
  onCaptureFrameRef.current = onCaptureFrame;
  const onVoiceDataRef = useRef(onVoiceData);
  onVoiceDataRef.current = onVoiceData;

  const startCamera = useCallback(async () => {
    streamRef.current?.getTracks().forEach((track) => {
      track.stop();
    });
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraActive(true);
      setCameraError(null);
    } catch (err: unknown) {
      console.error("Camera access error:", err);
      const name = err instanceof DOMException ? err.name : "";
      setCameraError(
        name === "NotAllowedError"
          ? "Camera/mic access denied. Please allow permissions."
          : "Could not access camera/microphone.",
      );
      try {
        streamRef.current = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        setCameraError("Camera unavailable — audio-only mode.");
      } catch {
        setCameraError("No camera or microphone available.");
      }
    }
  }, []);

  useEffect(() => {
    void startCamera();
    return () => {
      streamRef.current?.getTracks().forEach((track) => {
        track.stop();
      });
    };
  }, [startCamera]);

  useEffect(() => {
    if (videoRef.current && streamRef.current && cameraActive) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [cameraActive]);

  useEffect(() => {
    if (isRecording && streamRef.current) {
      const audioTracks = streamRef.current.getAudioTracks();
      if (audioTracks.length === 0) return;
      const audioStream = new MediaStream(audioTracks);
      audioChunks.current = [];
      try {
        const recorder = new MediaRecorder(audioStream, {
          mimeType: "audio/webm;codecs=opus",
        });
        mediaRecorderRef.current = recorder;
        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) audioChunks.current.push(event.data);
        };
        recorder.onstop = () => {
          if (audioChunks.current.length > 0) {
            onVoiceDataRef.current(
              new Blob(audioChunks.current, { type: "audio/webm" }),
            );
          }
        };
        recorder.start(100);
      } catch (err) {
        console.error("MediaRecorder error:", err);
      }
    } else if (
      !isRecording &&
      mediaRecorderRef.current?.state === "recording"
    ) {
      mediaRecorderRef.current.stop();
    }
  }, [isRecording]);

  const capture = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.drawImage(video, 0, 0);
    const data = canvas.toDataURL("image/jpeg", 0.8).split(",")[1];
    if (data) onCaptureFrameRef.current(data);
  }, []);

  return (
    <div className="camera-preview">
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className={cameraActive ? "camera-video" : "camera-video is-hidden"}
      />
      {!cameraActive && (
        <div className="camera-empty">
          <div className="camera-empty-icon" aria-hidden="true">
            ◉
          </div>
          <p>{cameraError || "Initializing camera..."}</p>
          <Button variant="ghost" size="sm" onClick={startCamera}>
            Retry
          </Button>
        </div>
      )}
      {cameraActive && (
        <div className="camera-actions">
          <Button variant="primary" size="sm" onClick={capture}>
            Capture clue
          </Button>
        </div>
      )}
      {isRecording && (
        <div className="camera-recording">
          <span />
          Listening
        </div>
      )}
      {!cameraActive && streamRef.current && (
        <div className="audio-only-badge">Audio only</div>
      )}
    </div>
  );
};
