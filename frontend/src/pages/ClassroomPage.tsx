import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Video,
    Clock,
    BookOpen,
    Save,
    ExternalLink,
    Maximize2,
    Minimize2,
    ArrowLeft,
    CheckCircle2,
    Copy,
    Download,
    PanelRightClose,
    PanelRightOpen,
    AlertCircle,
    Wifi,
    ScreenShare
} from 'lucide-react';
import {
    LiveKitRoom,
    VideoConference,
    RoomAudioRenderer,
    useLocalParticipant,
} from '@livekit/components-react';
import '@livekit/components-styles';

import apiClient from '../services/apiClient';
import { LIVEKIT_SERVER_URL } from '../config';
import { useToast } from '../components/Toast';

interface ClassroomLesson {
    id: string;
    teacher_id: string;
    teacher_name: string;
    student_id: string;
    student_name: string;
    student_email: string;
    lesson_type: string;
    start_time: string | null;
    duration: number;
    price: number;
    status: string;
    meeting_link: string;
    feedback_vocabulary?: string;
    feedback_errors?: string;
    feedback_materials?: string;
}

/**
 * Dedicated Screen Share button rendered inside the LiveKit room.
 * Allows instant sharing of screen, window, or tab with audio.
 */
const ScreenShareButton: React.FC = () => {
    const { isScreenShareEnabled, localParticipant } = useLocalParticipant();
    const [toggling, setToggling] = useState(false);

    const toggleScreenShare = async () => {
        if (!localParticipant || toggling) return;
        setToggling(true);
        try {
            await localParticipant.setScreenShareEnabled(!isScreenShareEnabled, {
                audio: true, // Shares audio from video/browser tab
                selfBrowserSurface: 'include',
                surfaceSwitching: 'include',
            });
        } catch (err: any) {
            if (err?.name !== 'NotAllowedError') {
                console.warn('Screen share error:', err);
            }
        } finally {
            setToggling(false);
        }
    };

    return (
        <button
            onClick={toggleScreenShare}
            disabled={toggling}
            className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl text-base font-black transition-all shadow-2xl backdrop-blur-md ${
                isScreenShareEnabled
                    ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/40 ring-2 ring-rose-400/60 animate-pulse'
                    : 'bg-slate-900/95 hover:bg-emerald-600 border border-slate-700/80 hover:border-emerald-500 text-white shadow-black/50 hover:scale-[1.02] active:scale-[0.98]'
            }`}
            title={isScreenShareEnabled ? 'Stop screen sharing' : 'Share your screen, window, or browser tab with audio'}
        >
            <ScreenShare size={20} className={isScreenShareEnabled ? 'animate-bounce' : 'text-emerald-400'} />
            <span>
                {isScreenShareEnabled ? 'Stop Sharing' : 'Share Screen'}
            </span>
        </button>
    );
};

export const ClassroomPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { addToast } = useToast();

    const [lesson, setLesson] = useState<ClassroomLesson | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Sidebar & View state
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [activeTab, setActiveTab] = useState<'vocabulary' | 'errors' | 'materials'>('vocabulary');
    const [isFullscreen, setIsFullscreen] = useState(false);

    // User role detection
    const [isTeacher, setIsTeacher] = useState(false);
    const [currentUserName, setCurrentUserName] = useState('Participant');

    // Notes form state
    const [vocabularyNotes, setVocabularyNotes] = useState('');
    const [errorsNotes, setErrorsNotes] = useState('');
    const [materialsNotes, setMaterialsNotes] = useState('');
    const [savingNotes, setSavingNotes] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);

    // Countdown Timer state
    const [timeLeftSeconds, setTimeLeftSeconds] = useState<number | null>(null);
    const [timerStatus, setTimerStatus] = useState<'upcoming' | 'active' | 'warning' | 'overtime' | 'ended'>('active');
    const hasPlayedFiveMinWarningRef = useRef(false);

    // LiveKit WebRTC state
    const [livekitToken, setLivekitToken] = useState<string | null>(null);
    const [livekitServerUrl, setLivekitServerUrl] = useState<string>(LIVEKIT_SERVER_URL);
    const [livekitConnecting, setLivekitConnecting] = useState(true);
    const [livekitConnected, setLivekitConnected] = useState(false);
    const [livekitError, setLivekitError] = useState<string | null>(null);

    // Local Test Preview state (allows testing screen share and camera immediately)
    const [localPreviewStream, setLocalPreviewStream] = useState<MediaStream | null>(null);
    const [isLocalScreenSharing, setIsLocalScreenSharing] = useState(false);
    const localVideoRef = useRef<HTMLVideoElement>(null);

    const startLocalScreenShare = async () => {
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: true,
            });
            setLocalPreviewStream(stream);
            setIsLocalScreenSharing(true);
            addToast('success', 'Screen sharing started successfully!');
            stream.getVideoTracks()[0].onended = () => {
                setIsLocalScreenSharing(false);
                setLocalPreviewStream(null);
            };
        } catch (err: any) {
            if (err?.name !== 'NotAllowedError') {
                console.warn('Error sharing screen:', err);
                addToast('error', 'Could not access screen.');
            }
        }
    };

    const startLocalCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true,
            });
            setLocalPreviewStream(stream);
            setIsLocalScreenSharing(false);
            addToast('success', 'Camera and microphone activated.');
        } catch (err: any) {
            console.warn('Error activating camera:', err);
            addToast('error', 'Could not access camera or microphone.');
        }
    };

    const stopLocalPreview = () => {
        if (localPreviewStream) {
            localPreviewStream.getTracks().forEach((track) => track.stop());
            setLocalPreviewStream(null);
            setIsLocalScreenSharing(false);
            addToast('info', 'Preview test stopped.');
        }
    };

    useEffect(() => {
        if (localVideoRef.current && localPreviewStream) {
            localVideoRef.current.srcObject = localPreviewStream;
        }
    }, [localPreviewStream]);

    // Detect user role & display name on mount
    useEffect(() => {
        const teacherAuth = localStorage.getItem('teacher_auth');
        const studentAuth = localStorage.getItem('student_auth');

        if (teacherAuth) {
            try {
                const parsed = JSON.parse(teacherAuth);
                if (parsed.teacher_id || parsed.access_token) {
                    setIsTeacher(true);
                    setCurrentUserName(parsed.name || 'Marta (Teacher)');
                    return;
                }
            } catch { /* ignore */ }
        }

        if (studentAuth) {
            try {
                const parsed = JSON.parse(studentAuth);
                setIsTeacher(false);
                setCurrentUserName(parsed.name ? `${parsed.name} (Student)` : 'Student');
                return;
            } catch { /* ignore */ }
        }

        setCurrentUserName('Participant');
    }, []);

    // Fetch lesson details
    useEffect(() => {
        if (!id) {
            setError('Lesson ID was not provided');
            setLoading(false);
            return;
        }

        // Demo test mode support: /classroom/demo or /classroom/test
        if (id === 'demo' || id === 'test') {
            const now = new Date();
            const demoLesson: ClassroomLesson = {
                id: 'demo',
                teacher_id: 'teacher_1',
                teacher_name: 'Marta',
                student_id: 'student_demo',
                student_name: 'Test Student (Demo)',
                student_email: 'student@example.com',
                lesson_type: 'Spanish Conversation (Demo Class)',
                start_time: new Date(now.getTime() - 5 * 60 * 1000).toISOString(),
                duration: 45,
                price: 23.56,
                status: 'scheduled',
                meeting_link: 'https://meet.google.com/pyv-dxwi-mxc',
                feedback_vocabulary: '1. ¡Hola! ¿Cómo estás? = Hello! How are you?\n2. Me alegro de verte = Nice to see you\n3. Desarrollar = To develop\n4. Echar de menos = To miss someone',
                feedback_errors: '• Remember: "Estoy de acuerdo" (not "Soy de acuerdo")\n• Practice the rolled "rr" in "ferrocarril" and "perro"',
                feedback_materials: '• Reading article: https://elpais.com\n• Homework: write 3 sentences using the past tense',
            };
            setLesson(demoLesson);
            setVocabularyNotes(demoLesson.feedback_vocabulary || '');
            setErrorsNotes(demoLesson.feedback_errors || '');
            setMaterialsNotes(demoLesson.feedback_materials || '');
            setLoading(false);
            return;
        }

        const fetchLesson = async () => {
            try {
                setLoading(true);
                const res = await apiClient.get(`/lessons/${id}`);
                const data: ClassroomLesson = res.data;
                setLesson(data);
                setVocabularyNotes(data.feedback_vocabulary || '');
                setErrorsNotes(data.feedback_errors || '');
                setMaterialsNotes(data.feedback_materials || '');

                const teacherAuth = localStorage.getItem('teacher_auth');
                if (!teacherAuth && data.student_name) {
                    setCurrentUserName(`${data.student_name}`);
                }
            } catch (err: any) {
                console.error('Failed to load lesson:', err);
                setError('Could not find the requested lesson or it is unavailable.');
            } finally {
                setLoading(false);
            }
        };

        fetchLesson();
    }, [id]);

    // Fetch LiveKit access token from backend
    useEffect(() => {
        if (!lesson) return;

        const fetchToken = async () => {
            try {
                setLivekitConnecting(true);
                const res = await apiClient.get(
                    `/lessons/${lesson.id}/livekit-token?user_name=${encodeURIComponent(currentUserName)}`
                );
                if (res.data && res.data.token) {
                    setLivekitToken(res.data.token);
                    if (res.data.server_url) {
                        setLivekitServerUrl(res.data.server_url);
                    }
                }
            } catch (err: any) {
                console.warn('LiveKit token request error:', err);
                setLivekitError('Could not obtain LiveKit access token.');
            } finally {
                setLivekitConnecting(false);
            }
        };

        fetchToken();
    }, [lesson, currentUserName]);

    // Timer calculation based on start_time and duration
    useEffect(() => {
        if (!lesson || !lesson.start_time) return;

        const updateTimer = () => {
            const startMs = new Date(lesson.start_time!).getTime();
            const durationMs = (lesson.duration || 60) * 60 * 1000;
            const endMs = startMs + durationMs;
            const nowMs = Date.now();

            if (nowMs < startMs) {
                const secondsToStart = Math.max(0, Math.floor((startMs - nowMs) / 1000));
                setTimeLeftSeconds(secondsToStart);
                setTimerStatus('upcoming');
            } else if (nowMs <= endMs) {
                const secondsLeft = Math.floor((endMs - nowMs) / 1000);
                setTimeLeftSeconds(secondsLeft);
                if (secondsLeft <= 300) {
                    setTimerStatus('warning');
                    if (!hasPlayedFiveMinWarningRef.current) {
                        hasPlayedFiveMinWarningRef.current = true;
                        addToast('info', '5 minutes remaining in the lesson.');
                    }
                } else {
                    setTimerStatus('active');
                }
            } else {
                const overtimeSeconds = Math.floor((nowMs - endMs) / 1000);

                // For demo mode, automatically keep a fresh 40-minute active demo lesson
                if (lesson.id === 'demo' || lesson.id === 'test') {
                    const freshStart = new Date(Date.now() - 5 * 60 * 1000).toISOString();
                    setLesson((prev) => (prev ? { ...prev, start_time: freshStart } : null));
                    return;
                }

                // If real lesson ended more than 30 minutes ago, show as 'ended'
                if (overtimeSeconds > 30 * 60) {
                    setTimeLeftSeconds(null);
                    setTimerStatus('ended');
                } else {
                    setTimeLeftSeconds(overtimeSeconds);
                    setTimerStatus('overtime');
                }
            }
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [lesson, addToast]);

    // Format timer
    const formatTime = (totalSeconds: number | null) => {
        if (totalSeconds === null) return '--:--';
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Handle Saving Notes (Teacher only)
    const handleSaveNotes = async () => {
        if (!lesson) return;
        setSavingNotes(true);
        if (lesson.id === 'demo' || lesson.id === 'test') {
            setTimeout(() => {
                setLastSaved(new Date());
                addToast('success', 'Demo notes saved successfully.');
                setSavingNotes(false);
            }, 300);
            return;
        }
        try {
            await apiClient.patch(`/lessons/${lesson.id}/feedback`, {
                feedback_vocabulary: vocabularyNotes,
                feedback_errors: errorsNotes,
                feedback_materials: materialsNotes,
            });
            setLastSaved(new Date());
            addToast('success', 'Lesson notes saved successfully.');
        } catch (err: any) {
            console.error('Failed to save notes:', err);
            addToast('error', 'Could not save lesson notes.');
        } finally {
            setSavingNotes(false);
        }
    };

    // Copy notes to clipboard
    const handleCopyNotes = () => {
        const text = `=== SPANISH LESSON WITH MARTA ===\nDate: ${lesson?.start_time ? new Date(lesson.start_time).toLocaleDateString() : ''}\nType: ${lesson?.lesson_type}\n\n[VOCABULARY]\n${vocabularyNotes || '(No notes yet)'}\n\n[CORRECTIONS & GRAMMAR]\n${errorsNotes || '(No notes yet)'}\n\n[MATERIALS & HOMEWORK]\n${materialsNotes || '(No notes yet)'}`;
        navigator.clipboard.writeText(text);
        addToast('success', 'All notes copied to clipboard.');
    };

    // Download notes as .txt file
    const handleDownloadNotes = () => {
        const text = `=== SPANISH LESSON WITH MARTA ===\nDate: ${lesson?.start_time ? new Date(lesson.start_time).toLocaleString() : ''}\nType: ${lesson?.lesson_type}\n\n--- VOCABULARY & EXPRESSIONS ---\n${vocabularyNotes || '(No notes yet)'}\n\n--- CORRECTIONS & GRAMMAR ---\n${errorsNotes || '(No notes yet)'}\n\n--- MATERIALS & HOMEWORK ---\n${materialsNotes || '(No notes yet)'}\n`;
        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Lesson_Notes_${(lesson?.lesson_type || 'Spanish').replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.txt`;
        link.click();
        URL.revokeObjectURL(url);
    };

    // Fullscreen toggle
    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
            setIsFullscreen(true);
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen().catch(() => {});
                setIsFullscreen(false);
            }
        }
    };

    // Exit classroom back to appropriate dashboard
    const handleExitClassroom = () => {
        if (isTeacher) {
            navigate('/teacher/dashboard?tab=lessons');
        } else {
            navigate('/dashboard');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-6">
                <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
                <h2 className="text-2xl font-black tracking-tight">Setting up your Virtual Classroom...</h2>
                <p className="text-slate-400 text-base mt-2">Connecting to Marta's classroom room</p>
            </div>
        );
    }

    if (error || !lesson) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-6">
                <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl max-w-md w-full text-center shadow-2xl">
                    <AlertCircle size={52} className="text-amber-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-black text-white mb-2">Lesson Unavailable</h2>
                    <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                        {error || 'Could not find the requested lesson session.'}
                    </p>
                    <button
                        onClick={handleExitClassroom}
                        className="w-full py-3.5 px-6 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-base rounded-xl transition"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen w-screen bg-slate-950 flex flex-col overflow-hidden text-slate-100 select-none">
            {/* Top Navigation Bar */}
            <header className="h-20 sm:h-24 bg-slate-900/95 border-b border-slate-800/80 px-4 sm:px-6 flex items-center justify-between shrink-0 backdrop-blur-md z-20">
                {/* Left: Brand & Back */}
                <div className="flex items-center gap-3 sm:gap-4">
                    <button
                        onClick={handleExitClassroom}
                        className="px-3.5 sm:px-4 py-2.5 text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-xl transition flex items-center gap-2 text-sm sm:text-base font-bold"
                        title="Exit classroom"
                    >
                        <ArrowLeft size={20} />
                        <span className="hidden sm:inline">Exit</span>
                    </button>
                    <div className="h-8 w-px bg-slate-800 hidden sm:block" />
                    <div className="flex items-center gap-3 sm:gap-3.5">
                        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 shrink-0">
                            <Video size={22} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2.5">
                                <span className="font-black text-base sm:text-lg text-white tracking-tight">Marta's Classroom</span>
                                <span className="px-2.5 py-1 rounded-md text-xs sm:text-sm font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                    {lesson.lesson_type || 'Spanish Lesson'}
                                </span>
                            </div>
                            <p className="text-sm sm:text-base text-slate-300 font-medium truncate max-w-[200px] sm:max-w-[360px]">
                                {isTeacher ? `Student: ${lesson.student_name || 'Student'}` : 'Live 1-on-1 Lesson with Marta'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Center: Live Lesson Countdown Timer */}
                <div className="flex items-center gap-2">
                    <div
                        className={`flex items-center gap-2.5 px-4 sm:px-5 py-2.5 rounded-full text-sm sm:text-base lg:text-lg font-black tracking-wider transition-all shadow-md ${
                            timerStatus === 'upcoming'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                                : timerStatus === 'warning'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 animate-pulse'
                                : timerStatus === 'overtime'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                : timerStatus === 'ended'
                                ? 'bg-slate-800 text-slate-300 border border-slate-700/80'
                                : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        }`}
                        title="Lesson status / remaining time"
                    >
                        <Clock size={20} className={timerStatus === 'active' ? 'animate-spin' : ''} style={{ animationDuration: '8s' }} />
                        <span>
                            {timerStatus === 'upcoming' && `Starts in ${formatTime(timeLeftSeconds)}`}
                            {timerStatus === 'overtime' && `+${formatTime(timeLeftSeconds)} overtime`}
                            {timerStatus === 'ended' && `Lesson Ended`}
                            {(timerStatus === 'active' || timerStatus === 'warning') &&
                                `${timeLeftSeconds !== null ? formatTime(timeLeftSeconds) : `${lesson.duration || 60}:00`} remaining`}
                        </span>
                        {timerStatus === 'active' && (
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                        )}
                    </div>
                </div>

                {/* Right: Controls & Actions */}
                <div className="flex items-center gap-2 sm:gap-3">
                    {/* Google Meet fallback link */}
                    <a
                        href={lesson.meeting_link || 'https://meet.google.com/pyv-dxwi-mxc'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hidden lg:flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-sm sm:text-base font-bold transition border border-slate-700/60"
                        title="Open backup meeting in Google Meet"
                    >
                        <ExternalLink size={18} />
                        <span>Google Meet</span>
                    </a>

                    {/* Toggle Whiteboard / Notes Sidebar */}
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm sm:text-base font-black transition-all ${
                            sidebarOpen
                                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60'
                        }`}
                        title={sidebarOpen ? 'Hide Notes Sidebar' : 'Show Notes Sidebar'}
                    >
                        {sidebarOpen ? <PanelRightClose size={19} /> : <PanelRightOpen size={19} />}
                        <span className="hidden sm:inline">Notes & Board</span>
                    </button>

                    {/* Fullscreen Button */}
                    <button
                        onClick={toggleFullscreen}
                        className="p-2.5 sm:p-3 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl transition border border-slate-700/60"
                        title={isFullscreen ? 'Exit full screen' : 'Full screen'}
                    >
                        {isFullscreen ? <Minimize2 size={19} /> : <Maximize2 size={19} />}
                    </button>
                </div>
            </header>

            {/* Main Classroom Body */}
            <div className="flex-1 flex overflow-hidden relative">
                {/* Left/Center: Video Conference Window powered by LiveKit */}
                <div className="flex-1 relative bg-slate-950 flex flex-col overflow-hidden">
                    {livekitToken ? (
                        <div className="w-full h-full flex-1 relative bg-slate-950">
                            <LiveKitRoom
                                video={true}
                                audio={true}
                                token={livekitToken}
                                serverUrl={livekitServerUrl}
                                connect={true}
                                data-lk-theme="default"
                                className="h-full w-full flex flex-col bg-slate-950 text-white"
                                onConnected={() => {
                                    setLivekitConnected(true);
                                    setLivekitError(null);
                                }}
                                onDisconnected={() => {
                                    setLivekitConnected(false);
                                }}
                                onError={(err) => {
                                    console.warn('LiveKit room error:', err);
                                    setLivekitError(err.message || 'Error connecting to LiveKit server');
                                }}
                            >
                                {/* Prominent Floating Screen Share Button */}
                                <div className="absolute top-4 left-4 z-30 flex items-center gap-2">
                                    <ScreenShareButton />
                                </div>
                                <VideoConference />
                                <RoomAudioRenderer />
                            </LiveKitRoom>

                            {/* Local Screen Share / Camera Preview Tester */}
                            {localPreviewStream && (
                                <div className="absolute inset-0 z-20 bg-slate-950 flex flex-col items-center justify-center">
                                    <video
                                        ref={localVideoRef}
                                        autoPlay
                                        playsInline
                                        muted={true}
                                        className="w-full h-full object-contain"
                                    />
                                    <div className="absolute top-4 left-4 z-30 flex items-center gap-3">
                                        <button
                                            onClick={isLocalScreenSharing ? stopLocalPreview : startLocalScreenShare}
                                            className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl text-base font-black transition-all shadow-xl backdrop-blur-md ${
                                                isLocalScreenSharing
                                                    ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30 ring-2 ring-rose-400/60 animate-pulse'
                                                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/25'
                                            }`}
                                        >
                                            <ScreenShare size={20} />
                                            <span>{isLocalScreenSharing ? 'Stop Sharing' : 'Share Screen'}</span>
                                        </button>
                                        <button
                                            onClick={stopLocalPreview}
                                            className="px-5 py-3 bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white rounded-2xl text-base font-bold border border-slate-700/80 transition"
                                        >
                                            Close Test Mode
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Fallback notice if LiveKit server is offline */}
                            {!livekitConnected && !localPreviewStream && (
                                <div className="absolute bottom-4 left-4 right-4 max-w-2xl mx-auto bg-slate-900/95 border border-slate-700/80 p-4 sm:p-5 rounded-2xl shadow-2xl backdrop-blur-md z-30 flex flex-wrap items-center justify-between gap-4 animate-in fade-in">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center shrink-0 text-emerald-400">
                                            <Wifi size={24} />
                                        </div>
                                        <div>
                                            <p className="text-base font-black text-white">LiveKit Server ({livekitServerUrl})</p>
                                            <p className="text-sm text-slate-300 font-medium">
                                                {livekitError || 'Connecting to your LiveKit classroom server...'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2.5 flex-wrap">
                                        <button
                                            onClick={startLocalScreenShare}
                                            className="px-4 sm:px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider shrink-0 transition flex items-center gap-2 shadow-md shadow-emerald-600/25 hover:scale-[1.02]"
                                            title="Test screen sharing now"
                                        >
                                            <ScreenShare size={17} />
                                            <span>Test Screen Share</span>
                                        </button>
                                        <button
                                            onClick={startLocalCamera}
                                            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs sm:text-sm font-bold shrink-0 transition"
                                            title="Test webcam"
                                        >
                                            Test Camera
                                        </button>
                                        <a
                                            href={lesson.meeting_link || 'https://meet.google.com/pyv-dxwi-mxc'}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs sm:text-sm font-bold shrink-0 transition flex items-center gap-1.5 border border-slate-700/60"
                                        >
                                            <ExternalLink size={16} />
                                            <span>Google Meet</span>
                                        </a>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : livekitConnecting ? (
                        <div className="flex-1 flex flex-col items-center justify-center bg-slate-950 p-6 text-center">
                            <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
                            <p className="text-lg font-bold text-slate-100">Generating secure LiveKit classroom room...</p>
                            <p className="text-sm text-slate-400 mt-1">Private room: {lesson.student_name} & Marta</p>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center bg-slate-950 p-6 text-center">
                            <div className="max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center">
                                <Video size={52} className="text-emerald-500 mx-auto mb-4" />
                                <h3 className="text-2xl font-black text-white mb-2">Aula Virtual</h3>
                                <p className="text-sm sm:text-base text-slate-300 mb-6 leading-relaxed">
                                    Conectando la videollamada interactiva. Si tarda en cargar o prefieres usar Google Meet, puedes entrar directamente pulsando el botón de abajo:
                                </p>
                                <a
                                    href={lesson.meeting_link || 'https://meet.google.com/pyv-dxwi-mxc'}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-sm sm:text-base uppercase tracking-wider transition shadow-lg shadow-emerald-600/25"
                                >
                                    <ExternalLink size={18} />
                                    Abrir en Google Meet
                                </a>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right: Interactive In-Class Notes / Vocabulary Board */}
                {sidebarOpen && (
                    <aside className="w-full sm:w-96 md:w-[420px] lg:w-[480px] bg-slate-900 border-l border-slate-800 flex flex-col shrink-0 z-10 shadow-2xl animate-in slide-in-from-right duration-200">
                        {/* Sidebar Header */}
                        <div className="p-4 sm:p-5 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/60">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
                                    <BookOpen size={20} />
                                </div>
                                <div>
                                    <h3 className="font-black text-base sm:text-lg lg:text-xl text-white">Lesson Notes</h3>
                                    <p className="text-xs sm:text-sm text-slate-300 font-medium">
                                        {isTeacher ? 'Your notes are saved for the student' : "Marta's notes taken during class"}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={handleCopyNotes}
                                    className="p-2.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl transition"
                                    title="Copy all notes to clipboard"
                                >
                                    <Copy size={18} />
                                </button>
                                <button
                                    onClick={handleDownloadNotes}
                                    className="p-2.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl transition"
                                    title="Download notes as .txt"
                                >
                                    <Download size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Note Category Tabs */}
                        <div className="flex border-b border-slate-800 bg-slate-950/50 p-2 gap-2">
                            <button
                                onClick={() => setActiveTab('vocabulary')}
                                className={`flex-1 py-3 text-xs sm:text-sm md:text-base font-black rounded-xl transition ${
                                    activeTab === 'vocabulary'
                                        ? 'bg-emerald-600 text-white shadow-md'
                                        : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                                }`}
                            >
                                📖 Vocabulary
                            </button>
                            <button
                                onClick={() => setActiveTab('errors')}
                                className={`flex-1 py-3 text-xs sm:text-sm md:text-base font-black rounded-xl transition ${
                                    activeTab === 'errors'
                                        ? 'bg-emerald-600 text-white shadow-md'
                                        : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                                }`}
                            >
                                ✍️ Corrections
                            </button>
                            <button
                                onClick={() => setActiveTab('materials')}
                                className={`flex-1 py-3 text-xs sm:text-sm md:text-base font-black rounded-xl transition ${
                                    activeTab === 'materials'
                                        ? 'bg-emerald-600 text-white shadow-md'
                                        : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                                }`}
                            >
                                🔗 Homework
                            </button>
                        </div>

                        {/* Note Content Area */}
                        <div className="flex-1 p-4 sm:p-5 flex flex-col overflow-y-auto">
                            {activeTab === 'vocabulary' && (
                                <div className="flex-1 flex flex-col">
                                    <label className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-300 mb-2.5 flex items-center justify-between">
                                        <span>New Words & Expressions</span>
                                        <span className="text-xs sm:text-sm text-emerald-400 font-bold">
                                            {isTeacher ? 'Edit Mode' : 'View Only'}
                                        </span>
                                    </label>
                                    <textarea
                                        value={vocabularyNotes}
                                        onChange={(e) => setVocabularyNotes(e.target.value)}
                                        readOnly={!isTeacher}
                                        placeholder={
                                            isTeacher
                                                ? 'e.g. \n• To develop = Desarrollar\n• To miss someone = Echar de menos\n• "Por si acaso" = Just in case...'
                                                : 'Marta will write vocabulary here during class...'
                                        }
                                        className="flex-1 w-full bg-slate-950/70 border border-slate-800 focus:border-emerald-500 rounded-2xl p-4 sm:p-5 text-base sm:text-lg text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none font-sans leading-relaxed"
                                    />
                                </div>
                            )}

                            {activeTab === 'errors' && (
                                <div className="flex-1 flex flex-col">
                                    <label className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-300 mb-2.5 flex items-center justify-between">
                                        <span>Grammar & Pronunciation Corrections</span>
                                        <span className="text-xs sm:text-sm text-amber-400 font-bold">
                                            {isTeacher ? 'Edit Mode' : 'View Only'}
                                        </span>
                                    </label>
                                    <textarea
                                        value={errorsNotes}
                                        onChange={(e) => setErrorsNotes(e.target.value)}
                                        readOnly={!isTeacher}
                                        placeholder={
                                            isTeacher
                                                ? 'e.g. \n• Say: "Estoy de acuerdo" (not "Soy de acuerdo")\n• Subjunctive: "Cuando tenga tiempo..."'
                                                : 'Marta will write grammar corrections here...'
                                        }
                                        className="flex-1 w-full bg-slate-950/70 border border-slate-800 focus:border-emerald-500 rounded-2xl p-4 sm:p-5 text-base sm:text-lg text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none font-sans leading-relaxed"
                                    />
                                </div>
                            )}

                            {activeTab === 'materials' && (
                                <div className="flex-1 flex flex-col">
                                    <label className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-300 mb-2.5 flex items-center justify-between">
                                        <span>Practice Materials & Homework</span>
                                        <span className="text-xs sm:text-sm text-teal-400 font-bold">
                                            {isTeacher ? 'Edit Mode' : 'View Only'}
                                        </span>
                                    </label>
                                    <textarea
                                        value={materialsNotes}
                                        onChange={(e) => setMaterialsNotes(e.target.value)}
                                        readOnly={!isTeacher}
                                        placeholder={
                                            isTeacher
                                                ? 'e.g. \n• Read article: https://elpais.com\n• Exercise: Chapter 4\n• Homework: write 3 sentences'
                                                : 'Marta will leave practice materials and homework here...'
                                        }
                                        className="flex-1 w-full bg-slate-950/70 border border-slate-800 focus:border-emerald-500 rounded-2xl p-4 sm:p-5 text-base sm:text-lg text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none font-sans leading-relaxed"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Sidebar Footer */}
                        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between gap-3">
                            {isTeacher ? (
                                <>
                                    <div className="text-xs sm:text-sm text-slate-300 font-medium">
                                        {lastSaved ? (
                                            <span className="text-emerald-400 flex items-center gap-1.5 font-bold">
                                                <CheckCircle2 size={16} />
                                                Saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        ) : (
                                            'Changes are visible to the student'
                                        )}
                                    </div>
                                    <button
                                        onClick={handleSaveNotes}
                                        disabled={savingNotes}
                                        className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-sm sm:text-base font-black uppercase tracking-wider transition flex items-center gap-2 shadow-lg shadow-emerald-600/30"
                                    >
                                        <Save size={17} />
                                        {savingNotes ? 'Saving...' : 'Save Notes'}
                                    </button>
                                </>
                            ) : (
                                <div className="w-full flex items-center justify-between text-sm text-slate-300 font-medium">
                                    <span>Notes available in your dashboard</span>
                                    <button
                                        onClick={handleDownloadNotes}
                                        className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-bold transition flex items-center gap-2"
                                    >
                                        <Download size={16} />
                                        Download
                                    </button>
                                </div>
                            )}
                        </div>
                    </aside>
                )}
            </div>
        </div>
    );
};

export default ClassroomPage;
