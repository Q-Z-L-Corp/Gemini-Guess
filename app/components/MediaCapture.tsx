import { useRef, useState, useEffect, useCallback } from "react";

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

  // Keep latest callbacks in refs to avoid stale closures
  const onCaptureFrameRef = useRef(onCaptureFrame);
  onCaptureFrameRef.current = onCaptureFrame;
  const onVoiceDataRef = useRef(onVoiceData);
  onVoiceDataRef.current = onVoiceData;

  const startCamera = useCallback(async () => {
    // Stop any existing tracks first
    streamRef.current?.getTracks().forEach((t) => t.stop());

    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: true,
      });
      streamRef.current = s;
      // Assign stream to video element immediately if it exists
      if (videoRef.current) {
        videoRef.current.srcObject = s;
      }
      setCameraActive(true);
      setCameraError(null);
    } catch (err: any) {
      console.error("Camera access error:", err);
      setCameraError(
        err.name === "NotAllowedError"
          ? "Camera/mic access denied. Please allow permissions."
          : "Could not access camera/microphone.",
      );
      // Fallback: try audio only
      try {
        const audioOnly = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        streamRef.current = audioOnly;
        setCameraError("Camera unavailable — audio-only mode.");
      } catch {
        setCameraError("No camera or microphone available.");
      }
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [startCamera]);

  // Re-assign srcObject whenever the video element mounts or stream changes
  useEffect(() => {
    if (videoRef.current && streamRef.current && cameraActive) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [cameraActive]);

  // Handle audio recording
  useEffect(() => {
    if (isRecording && streamRef.current) {
      // Create a new stream with only audio tracks for recording
      const audioTracks = streamRef.current.getAudioTracks();
      if (audioTracks.length === 0) return;

      const audioStream = new MediaStream(audioTracks);
      audioChunks.current = [];

      try {
        const recorder = new MediaRecorder(audioStream, {
          mimeType: "audio/webm;codecs=opus",
        });
        mediaRecorderRef.current = recorder;
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunks.current.push(e.data);
        };
        recorder.onstop = () => {
          if (audioChunks.current.length > 0) {
            onVoiceDataRef.current(
              new Blob(audioChunks.current, { type: "audio/webm" }),
            );
          }
        };
        recorder.start(100); // collect data every 100ms for smoother recording
      } catch (err) {
        console.error("MediaRecorder error:", err);
      }
    } else if (
      !isRecording &&
      mediaRecorderRef.current?.state === "recording"
    ) {
      mediaRecorderRef.current.stop();
    }
  }, [isRecording, onVoiceData]);

  const capture = useCallback(() => {
    const video = videoRef.current;
    if (!video) {
      console.warn("No video element ref");
      return;
    }
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      console.warn("Video not ready yet (dimensions are 0)");
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const data = canvas.toDataURL("image/jpeg", 0.8).split(",")[1];
    if (data) {
      onCaptureFrameRef.current(data);
    }
  }, []);

  return (
    <div className="relative group overflow-hidden rounded-xl border border-slate-700 bg-black aspect-video">
      {/* Always render video so ref is available when stream starts */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className={`w-full h-full object-cover ${cameraActive ? "" : "hidden"}`}
      />
      {!cameraActive && (
        <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 p-4">
          <svg
            className="w-10 h-10 mb-2 opacity-50"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
          <p className="text-xs text-center">
            {cameraError || "Initializing camera..."}
          </p>
          <button
            onClick={startCamera}
            className="mt-2 text-xs text-indigo-400 hover:text-indigo-300 underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Capture overlay */}
      {cameraActive && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
          <button
            onClick={capture}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-full font-medium shadow-lg flex items-center gap-2 active:scale-95 transition-transform"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            Show Clue
          </button>
        </div>
      )}

      {/* Recording indicator */}
      {isRecording && (
        <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-600/80 px-3 py-1 rounded-full animate-pulse">
          <div className="w-2 h-2 bg-white rounded-full"></div>
          <span className="text-xs font-bold uppercase tracking-wider">
            Listening
          </span>
        </div>
      )}

      {/* Audio-only mode badge */}
      {!cameraActive && streamRef.current && (
        <div className="absolute bottom-2 right-2 bg-indigo-600/60 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
          Audio Only
        </div>
      )}
    </div>
  );
};
