import React, { useState, useEffect } from 'react';
import { useAudioRecorder, RecordingStatus } from '../hooks/useAudioRecorder';
import { transcribeAudio } from '../services/geminiService';

interface AudioRecorderProps {
    name: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

const MicIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm5 10.586A7 7 0 014 11V9a1 1 0 112 0v2a5 5 0 0010 0V9a1 1 0 112 0v2a7 7 0 01-3 6.325V18a1 1 0 11-2 0v-2.414z" clipRule="evenodd" />
    </svg>
);

const StopIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
    </svg>
);

const AudioRecorder: React.FC<AudioRecorderProps> = ({ name, value, onChange }) => {
    const { recordingStatus, audioBlob, error, startRecording, stopRecording } = useAudioRecorder();
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [transcriptionError, setTranscriptionError] = useState<string | null>(null);

    useEffect(() => {
        if (recordingStatus === 'stopped' && audioBlob) {
            const handleTranscription = async () => {
                setIsTranscribing(true);
                setTranscriptionError(null);
                try {
                    const transcription = await transcribeAudio(audioBlob);

                    // --- NUEVO: appendear al valor existente en vez de sobrescribir ---
                    const currentText = value || '';
                    const separator = currentText.trim().length > 0 ? '\n' : '';
                    const appendedText = `${currentText}${separator}${transcription}`;

                    const mockEvent = { target: { name, value: appendedText } } as React.ChangeEvent<HTMLTextAreaElement>;
                    onChange(mockEvent);
                } catch (err) {
                    if (err instanceof Error) {
                        setTranscriptionError(err.message);
                    } else {
                        setTranscriptionError("Ocurrió un error desconocido durante la transcripción.");
                    }
                } finally {
                    setIsTranscribing(false);
                }
            };
            handleTranscription();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [recordingStatus, audioBlob, name, value]);

    const handleRecordClick = () => {
        if (recordingStatus === 'recording') {
            stopRecording();
        } else {
            startRecording();
        }
    };

    const getButtonState = () => {
        if (recordingStatus === 'recording') {
            return { text: 'Detener Grabación', icon: <StopIcon />, color: 'bg-red-500 hover:bg-red-600' };
        }
        if (isTranscribing) {
            return { text: 'Transcribiendo...', icon: null, color: 'bg-gray-400', disabled: true };
        }
        return { text: 'Grabar Audio', icon: <MicIcon />, color: 'bg-indigo-600 hover:bg-indigo-700' };
    };

    const buttonState = getButtonState();

    return (
        <div className="space-y-4">
            <div>
                <button
                    type="button"
                    onClick={handleRecordClick}
                    disabled={buttonState.disabled}
                    className={`inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${buttonState.color} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                    {isTranscribing ? (
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : buttonState.icon}
                    {buttonState.text}
                </button>
                {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
                {transcriptionError && <p className="mt-2 text-sm text-red-600">{transcriptionError}</p>}
            </div>

            {audioBlob && !isTranscribing && (
                <div className="mt-4">
                    <p className="text-sm font-medium text-slate-600 mb-1">Grabación completada:</p>
                    <audio controls src={URL.createObjectURL(audioBlob)} className="w-full"></audio>
                </div>
            )}

            <textarea
                name={name}
                rows={8}
                value={value}
                onChange={onChange}
                placeholder="La transcripción del audio aparecerá aquí automáticamente. También puede escribir directamente."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
        </div>
    );
};

export default AudioRecorder;