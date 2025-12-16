import { useState, useRef, useCallback } from 'react';

export type RecordingStatus = 'idle' | 'recording' | 'stopped' | 'error';

export const useAudioRecorder = () => {
  const [recordingStatus, setRecordingStatus] = useState<RecordingStatus>('idle');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    setError(null);
    setAudioBlob(null);
    if (recordingStatus === 'recording') {
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setRecordingStatus('recording');
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const newAudioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(newAudioBlob);
        setRecordingStatus('stopped');
        // Stop all tracks to release the microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
    } catch (err) {
      console.error("Error starting recording:", err);
      setError('No se pudo acceder al micrófono. Por favor, revise los permisos.');
      setRecordingStatus('error');
    }
  }, [recordingStatus]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  return { recordingStatus, audioBlob, error, startRecording, stopRecording };
};
