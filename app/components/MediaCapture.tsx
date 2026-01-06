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
  const [stream, setStream] = useState<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);

  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setStream(s);
      if (videoRef.current) videoRef.current.srcObject = s;
    } catch (err) {
      console.error("Camera access error:", err);
    }
  };

  useEffect(() => {
    startCamera();
    return () => stream?.getTracks().forEach((t) => t.stop());
  }, []);

  useEffect(() => {
    if (isRecording && stream) {
      audioChunks.current = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (e) => audioChunks.current.push(e.data);
      recorder.onstop = () =>
        onVoiceData(new Blob(audioChunks.current, { type: "audio/webm" }));
      recorder.start();
    } else if (
      !isRecording &&
      mediaRecorderRef.current?.state === "recording"
    ) {
      mediaRecorderRef.current.stop();
    }
  }, [isRecording, stream, onVoiceData]);

  const capture = useCallback(() => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(videoRef.current, 0, 0);
      const data = canvas.toDataURL("image/jpeg").split(",")[1];
      onCaptureFrame(data);
    }
  }, [onCaptureFrame]);

  return (
    <div className="relative group overflow-hidden rounded-xl border border-slate-700 bg-black aspect-video">
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
        <button
          onClick={capture}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-full font-medium shadow-lg flex items-center gap-2"
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
      {isRecording && (
        <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-600/80 px-3 py-1 rounded-full animate-pulse">
          <div className="w-2 h-2 bg-white rounded-full"></div>
          <span className="text-xs font-bold uppercase tracking-wider">
            Listening
          </span>
        </div>
      )}
    </div>
  );
};
