import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Calendar, LogOut, Home, BookOpen, User, Clock, DollarSign, Menu, X, Trash2 } from 'lucide-react';
import LanguageSelector from '../components/LanguageSelector';
import { useToast } from '../components/Toast';
import { TeacherAvailabilityGrid } from '../components/calendar/TeacherAvailabilityGrid';
import { AddToCalendar } from '../components/AddToCalendar';
import apiClient from '../services/apiClient';
import { TEACHER_ID } from '../config';

interface LessonInfo {
    id: string;
    student_name: string;
    student_email: string;
    lesson_type: string;
    start_time: string;
    duration: number;
    price: number;
    status: string;
    feedback_vocabulary?: string;
    feedback_errors?: string;
    feedback_materials?: string;
    student_payment_account?: string;
}

const TeacherDashboard = () => {
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [activeTab, setActiveTab] = useState<'availability' | 'lessons'>('availability');
    const [lessons, setLessons] = useState<LessonInfo[]>([]);
    const [loadingLessons, setLoadingLessons] = useState(false);
    const [editingLesson, setEditingLesson] = useState<LessonInfo | null>(null);
    const [feedbackForm, setFeedbackForm] = useState({
        vocabulary: '',
        errors: '',
        materials: ''
    });
    const [savingFeedback, setSavingFeedback] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Rejection confirmation dialog
    const [rejectingLesson, setRejectingLesson] = useState<LessonInfo | null>(null);
    const [rejecting, setRejecting] = useState(false);

    // Clear all lessons confirmation
    const [showClearAll, setShowClearAll] = useState(false);
    const [clearing, setClearing] = useState(false);

    useEffect(() => {
        const teacherAuth = localStorage.getItem('teacher_auth');
        if (!teacherAuth) {
            navigate('/teacher/login');
            return;
        }
        try {
            const parsed = JSON.parse(teacherAuth);
            if (!parsed.access_token) {
                localStorage.removeItem('teacher_auth');
                navigate('/teacher/login');
            }
        } catch {
            localStorage.removeItem('teacher_auth');
            navigate('/teacher/login');
        }
    }, [navigate]);

    useEffect(() => {
        if (activeTab === 'lessons') {
            fetchLessons();
        }
    }, [activeTab]);

    const fetchLessons = async () => {
        setLoadingLessons(true);
        try {
            const res = await apiClient.get(`/lessons/teacher/${TEACHER_ID}`);
            // Filter out completed lessons — they disappear once marked complete
            const activeLessons = res.data.lessons.filter((l: LessonInfo) => l.status !== 'completed');
            setLessons(activeLessons);
        } catch (err: any) {
            addToast('error', err?.response?.data?.detail || 'Failed to load lessons.');
        } finally {
            setLoadingLessons(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('teacher_auth');
        navigate('/');
    };

    const handleEditFeedback = (lesson: LessonInfo) => {
        setEditingLesson(lesson);
        setFeedbackForm({
            vocabulary: lesson.feedback_vocabulary || '',
            errors: lesson.feedback_errors || '',
            materials: lesson.feedback_materials || ''
        });
    };

    const saveFeedback = async () => {
        if (!editingLesson) return;
        setSavingFeedback(true);
        try {
            await apiClient.patch(`/lessons/${editingLesson.id}/feedback`, {
                feedback_vocabulary: feedbackForm.vocabulary,
                feedback_errors: feedbackForm.errors,
                feedback_materials: feedbackForm.materials
            });
            setEditingLesson(null);
            fetchLessons();
            addToast('success', 'Feedback saved successfully.');
        } catch (err: any) {
            addToast('error', err?.response?.data?.detail || 'Failed to save feedback.');
        } finally {
            setSavingFeedback(false);
        }
    };

    const updateStatus = async (lessonId: string, newStatus: string, lesson: LessonInfo) => {
        // If teacher is rejecting a pending lesson (pending → cancelled), show confirmation dialog
        if (lesson.status === 'pending' && newStatus === 'cancelled') {
            setRejectingLesson(lesson);
            return;
        }
        await executeStatusUpdate(lessonId, newStatus);
    };

    const executeStatusUpdate = async (lessonId: string, newStatus: string) => {
        try {
            await apiClient.patch(`/lessons/${lessonId}/feedback`, {}, {
                params: { status: newStatus }
            });
            // If marked complete, remove from the list instantly
            if (newStatus === 'completed') {
                setLessons(prev => prev.filter(l => l.id !== lessonId));
            } else {
                fetchLessons();
            }
            addToast('success', `Lesson status updated to ${newStatus}.`);
        } catch (err: any) {
            addToast('error', err?.response?.data?.detail || 'Failed to update lesson status.');
        }
    };

    const confirmRejection = async () => {
        if (!rejectingLesson) return;
        setRejecting(true);
        try {
            await apiClient.patch(`/lessons/${rejectingLesson.id}/feedback`, {}, {
                params: { status: 'cancelled' }
            });
            fetchLessons();
            addToast('success', `Lesson rejected. Student will be refunded $${rejectingLesson.price.toFixed(2)}.`);
        } catch (err: any) {
            addToast('error', err?.response?.data?.detail || 'Failed to reject lesson.');
        } finally {
            setRejecting(false);
            setRejectingLesson(null);
        }
    };

    const handleClearAll = () => {
        setShowClearAll(true);
    };

    const confirmClearAll = async () => {
        setClearing(true);
        try {
            const res = await apiClient.delete(`/lessons/teacher/${TEACHER_ID}`);
            const deletedCount = res.data.deleted_count;
            setLessons([]);
            addToast('success', `${deletedCount} lesson(s) have been permanently deleted.`);
        } catch (err: any) {
            addToast('error', err?.response?.data?.detail || 'Failed to clear lessons.');
        } finally {
            setClearing(false);
            setShowClearAll(false);
        }
    };

    const formatDate = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleDateString('en-GB', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            timeZone: 'Europe/Madrid',
        });
    };

    const formatTime = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Europe/Madrid',
        });
    };

    const statusColor = (status: string) => {
        switch (status) {
            case 'scheduled': return 'bg-green-100 text-green-700';
            case 'pending': return 'bg-yellow-100 text-yellow-700';
            case 'completed': return 'bg-blue-100 text-blue-700';
            case 'cancelled': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

    const navItems = [
        { name: 'Availability', icon: <Calendar size={20} />, key: 'availability' as const },
        { name: 'Lessons', icon: <BookOpen size={20} />, key: 'lessons' as const },
    ];

    const selectTab = (key: 'availability' | 'lessons') => {
        setActiveTab(key);
        setSidebarOpen(false);
    };

    const SidebarContent = () => (
        <div className="flex flex-col gap-8">
            <div className="flex items-center justify-between">
                <div className="text-xl font-black text-indigo-600 tracking-tighter uppercase">Teacher</div>
                <div className="flex items-center gap-4">
                    <LanguageSelector />
                    <Link to="/" className="text-gray-400 hover:text-indigo-600 transition flex items-center gap-1 font-bold text-sm" title="Return to Site">
                        <Home size={18} />
                    </Link>
                    <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 transition" title="Logout">
                        <LogOut size={20} />
                    </button>
                </div>
            </div>
            <nav className="flex flex-col gap-2">
                {navItems.map((item) => (
                    <button
                        key={item.key}
                        onClick={() => selectTab(item.key)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === item.key ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        {item.icon}
                        {item.name}
                    </button>
                ))}
            </nav>
        </div>
    );

    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex w-64 bg-white border-r border-gray-200 p-6 flex-col">
                <SidebarContent />
            </aside>

            {/* Mobile Top Bar */}
            <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
                <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-lg hover:bg-gray-100 transition">
                    {sidebarOpen ? <X size={22} className="text-gray-600" /> : <Menu size={22} className="text-gray-600" />}
                </button>
                <div className="text-base font-black text-indigo-600 tracking-tighter uppercase">
                    {activeTab === 'availability' ? 'Availability' : 'Lessons'}
                </div>
                <div className="flex items-center gap-2">
                    <LanguageSelector />
                    <Link to="/" className="text-gray-400 hover:text-indigo-600 transition p-1">
                        <Home size={18} />
                    </Link>
                    <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 transition p-1">
                        <LogOut size={18} />
                    </button>
                </div>
            </div>

            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div className="md:hidden fixed inset-0 z-30 flex">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)}></div>
                    <div className="relative w-64 bg-white border-r border-gray-200 p-6 overflow-y-auto animate-slide-in-left">
                        <SidebarContent />
                    </div>
                </div>
            )}

            <main className="flex-1 p-4 sm:p-8 md:p-12 pt-16 md:pt-12">
                <header className="mb-8 sm:mb-12">
                    <h1 className="text-2xl sm:text-4xl font-black text-gray-900 mb-2">
                        {activeTab === 'availability' ? 'Manage Availability' : 'Scheduled Lessons'}
                    </h1>
                    <p className="text-sm sm:text-base text-gray-500 font-medium">
                        {activeTab === 'availability'
                            ? 'Set your weekly availability for students to book.'
                            : 'View all lessons that students have booked.'}
                    </p>
                </header>

                {activeTab === 'availability' ? (
                    <div className="flex justify-center">
                        <TeacherAvailabilityGrid teacherId={TEACHER_ID} />
                    </div>
                ) : (
                    <div className="max-w-5xl">
                        {loadingLessons ? (
                            <div className="text-center py-20 text-gray-400 font-bold text-lg">Loading lessons...</div>
                        ) : lessons.length === 0 ? (
                            <div className="text-center py-20">
                                <BookOpen size={48} className="text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-400 font-bold text-lg">No lessons booked yet</p>
                                <p className="text-gray-300 text-sm mt-2">When students book lessons, they will appear here.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-4">
                                        <p className="text-xs sm:text-sm font-bold text-gray-400 uppercase tracking-wider">
                                            {lessons.length} lesson{lessons.length !== 1 ? 's' : ''} total
                                        </p>
                                        <button
                                            onClick={handleClearAll}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-500 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-widest hover:bg-red-100 hover:text-red-600 transition-all"
                                        >
                                            <Trash2 size={13} />
                                            Clear All Lessons
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-400">Times shown in Europe/Madrid</p>
                                </div>
                                {lessons.map((lesson) => (
                                    <div key={lesson.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all p-4 sm:p-6">
                                        <div className="flex items-start justify-between flex-wrap gap-3 sm:gap-4">
                                            <div className="flex items-center gap-3 sm:gap-4">
                                                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                                                    <User size={20} className="text-indigo-500" />
                                                </div>
                                                <div className="min-w-0">
                                                    <h3 className="font-black text-gray-900 text-base sm:text-lg truncate">{lesson.student_name}</h3>
                                                    <p className="text-gray-400 text-xs sm:text-sm font-medium truncate">{lesson.student_email}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 sm:gap-3">
                                                <AddToCalendar 
                                                    title={`Spanish Lesson: ${lesson.student_name}`}
                                                    startTime={lesson.start_time}
                                                    durationMinutes={lesson.duration}
                                                    description={`Spanish lesson with ${lesson.student_name} (${lesson.student_email}). \n\nMeeting link: https://meet.google.com/pyv-dxwi-mxc`}
                                                    location="https://meet.google.com/pyv-dxwi-mxc"
                                                    className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 bg-gray-50 text-gray-500 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-widest hover:bg-indigo-50 hover:text-indigo-600 transition-all"
                                                />
                                                <select
                                                    value={lesson.status}
                                                    onChange={(e) => updateStatus(lesson.id, e.target.value, lesson)}
                                                    className={`px-2 sm:px-3 py-1.5 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider border border-transparent shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer transition-all ${statusColor(lesson.status)}`}
                                                >
                                                    <option value="pending" className="bg-white text-gray-700">pending</option>
                                                    <option value="scheduled" className="bg-white text-gray-700">scheduled</option>
                                                    <option value="completed" className="bg-white text-gray-700">completed</option>
                                                    <option value="cancelled" className="bg-white text-gray-700">cancelled</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="mt-4 sm:mt-5 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                                            <div className="flex items-center gap-2 text-xs sm:text-sm">
                                                <Calendar size={14} className="text-gray-400 shrink-0" />
                                                <span className="font-bold text-gray-700">{formatDate(lesson.start_time)}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs sm:text-sm">
                                                <Clock size={14} className="text-gray-400 shrink-0" />
                                                <span className="font-bold text-gray-700">{formatTime(lesson.start_time)} · {lesson.duration} min</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs sm:text-sm">
                                                <BookOpen size={14} className="text-gray-400 shrink-0" />
                                                <span className="font-bold text-gray-700">{lesson.lesson_type}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs sm:text-sm">
                                                <DollarSign size={14} className="text-gray-400 shrink-0" />
                                                <span className="font-bold text-gray-700">${lesson.price.toFixed(2)}</span>
                                            </div>
                                        </div>

                                        {/* Student Payment Account Info */}
                                        {lesson.student_payment_account && (
                                            <div className="mt-3 bg-amber-50 rounded-xl p-3 border border-amber-100">
                                                <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">💳 Student's Payment Account:</p>
                                                <p className="text-sm font-mono text-gray-700 font-bold">{lesson.student_payment_account}</p>
                                            </div>
                                        )}

                                        {/* Feedback Section */}
                                        <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-50">
                                            <div className="flex items-center justify-between mb-4">
                                                <h4 className="text-xs sm:text-sm font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                                                    <BookOpen size={14} className="text-indigo-600" />
                                                    Progress & Feedback
                                                </h4>
                                                <button 
                                                    onClick={() => handleEditFeedback(lesson)}
                                                    className="text-[10px] sm:text-xs font-black text-indigo-600 hover:text-indigo-700 uppercase tracking-widest bg-indigo-50 px-2 sm:px-3 py-1 rounded-lg transition-colors"
                                                >
                                                    {lesson.feedback_vocabulary || lesson.feedback_errors || lesson.feedback_materials ? 'Edit' : 'Add Feedback'}
                                                </button>
                                            </div>

                                            {(lesson.feedback_vocabulary || lesson.feedback_errors || lesson.feedback_materials) ? (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                                                    {lesson.feedback_vocabulary && (
                                                        <div className="bg-gray-50/50 p-3 sm:p-4 rounded-xl border border-gray-100">
                                                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Vocabulary</p>
                                                            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{lesson.feedback_vocabulary}</p>
                                                        </div>
                                                    )}
                                                    {lesson.feedback_errors && (
                                                        <div className="bg-red-50/30 p-3 sm:p-4 rounded-xl border border-red-50">
                                                            <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-2">Common Errors</p>
                                                            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{lesson.feedback_errors}</p>
                                                        </div>
                                                    )}
                                                    {lesson.feedback_materials && (
                                                        <div className="bg-blue-50/30 p-3 sm:p-4 rounded-xl border border-blue-50">
                                                            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">Materials</p>
                                                            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed font-medium underline text-blue-600 truncate">
                                                                {lesson.feedback_materials}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <p className="text-xs sm:text-sm text-gray-300 italic">No feedback added yet for this session.</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Feedback Modal */}
                {editingLesson && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl sm:rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                            <div className="p-6 sm:p-8 md:p-12">
                                <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-2">Lesson Feedback</h2>
                                <p className="text-sm sm:text-base text-gray-500 font-medium mb-6 sm:mb-8">Share vocabulary, corrections, and materials with {editingLesson.student_name}.</p>
                                
                                <div className="space-y-4 sm:space-y-6">
                                    <div>
                                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Vocabulary learned</label>
                                        <textarea 
                                            value={feedbackForm.vocabulary}
                                            onChange={(e) => setFeedbackForm({...feedbackForm, vocabulary: e.target.value})}
                                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-3 sm:p-4 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all h-24 resize-none"
                                            placeholder="e.g. El vocabulario de hoy: la comida, el restaurante..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Errors to correct</label>
                                        <textarea 
                                            value={feedbackForm.errors}
                                            onChange={(e) => setFeedbackForm({...feedbackForm, errors: e.target.value})}
                                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-3 sm:p-4 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all h-24 resize-none"
                                            placeholder="e.g. Recuerda la diferencia entre ser y estar..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Materials & Links</label>
                                        <input 
                                            type="text"
                                            value={feedbackForm.materials}
                                            onChange={(e) => setFeedbackForm({...feedbackForm, materials: e.target.value})}
                                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-3 sm:p-4 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                            placeholder="e.g. https://youtube.com/watch?v=..."
                                        />
                                    </div>
                                </div>

                                <div className="mt-8 sm:mt-10 flex gap-3 sm:gap-4">
                                    <button 
                                        onClick={() => setEditingLesson(null)}
                                        className="flex-1 py-3 sm:py-4 bg-gray-50 text-gray-500 font-black rounded-2xl hover:bg-gray-100 transition shadow-sm active:scale-95 text-sm sm:text-base"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        onClick={saveFeedback}
                                        disabled={savingFeedback}
                                        className="flex-1 py-3 sm:py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition shadow-xl shadow-indigo-100 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 text-sm sm:text-base"
                                    >
                                        {savingFeedback ? 'Saving...' : 'Save Feedback'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Rejection Confirmation Modal */}
                {rejectingLesson && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl sm:rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                            <div className="p-6 sm:p-8">
                                <div className="text-center">
                                    <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                                        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                        </svg>
                                    </div>
                                    <h2 className="text-xl sm:text-2xl font-black text-gray-900 mb-2">Reject This Lesson?</h2>
                                    <p className="text-sm text-gray-500 font-medium mb-6">
                                        This will cancel{' '}
                                        <strong className="text-gray-700">{rejectingLesson.student_name}</strong>'s
                                        {' '}lesson and issue a refund of{' '}
                                        <strong className="text-red-600">${rejectingLesson.price.toFixed(2)}</strong>.
                                    </p>
                                </div>

                                <div className="bg-gray-50 rounded-xl p-4 mb-6">
                                    <table className="w-full text-sm">
                                        <tbody>
                                            <tr>
                                                <td className="py-1 text-gray-400 font-bold uppercase text-[10px] tracking-wider">Date</td>
                                                <td className="py-1 text-gray-700 font-bold text-right">{formatDate(rejectingLesson.start_time)}</td>
                                            </tr>
                                            <tr>
                                                <td className="py-1 text-gray-400 font-bold uppercase text-[10px] tracking-wider">Time</td>
                                                <td className="py-1 text-gray-700 font-bold text-right">{formatTime(rejectingLesson.start_time)}</td>
                                            </tr>
                                            <tr>
                                                <td className="py-1 text-gray-400 font-bold uppercase text-[10px] tracking-wider">Duration</td>
                                                <td className="py-1 text-gray-700 font-bold text-right">{rejectingLesson.duration} min</td>
                                            </tr>
                                            <tr>
                                                <td className="py-1 text-gray-400 font-bold uppercase text-[10px] tracking-wider">Type</td>
                                                <td className="py-1 text-gray-700 font-bold text-right">{rejectingLesson.lesson_type}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                <div className="flex gap-3 sm:gap-4">
                                    <button
                                        onClick={() => setRejectingLesson(null)}
                                        disabled={rejecting}
                                        className="flex-1 py-3 bg-gray-50 text-gray-500 font-black rounded-2xl hover:bg-gray-100 transition shadow-sm active:scale-95 disabled:opacity-50 text-sm"
                                    >
                                        Keep Pending
                                    </button>
                                    <button
                                        onClick={confirmRejection}
                                        disabled={rejecting}
                                        className="flex-1 py-3 bg-red-600 text-white font-black rounded-2xl hover:bg-red-700 transition shadow-xl shadow-red-100 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 text-sm"
                                    >
                                        {rejecting ? 'Rejecting...' : 'Reject & Refund'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Clear All Lessons Confirmation Modal */}
                {showClearAll && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl sm:rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                            <div className="p-6 sm:p-8">
                                <div className="text-center">
                                    <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                                        <Trash2 className="w-8 h-8 text-red-600" />
                                    </div>
                                    <h2 className="text-xl sm:text-2xl font-black text-gray-900 mb-2">Clear All Lessons?</h2>
                                    <p className="text-sm text-gray-500 font-medium mb-2">
                                        This will{' '}
                                        <strong className="text-red-600">permanently delete</strong>{' '}
                                        all <strong className="text-gray-700">{lessons.length} lesson{lessons.length !== 1 ? 's' : ''}</strong> from the system.
                                    </p>
                                    <p className="text-xs text-gray-400 font-medium mb-6">
                                        This action cannot be undone.
                                    </p>
                                </div>

                                <div className="flex gap-3 sm:gap-4">
                                    <button
                                        onClick={() => setShowClearAll(false)}
                                        disabled={clearing}
                                        className="flex-1 py-3 bg-gray-50 text-gray-500 font-black rounded-2xl hover:bg-gray-100 transition shadow-sm active:scale-95 disabled:opacity-50 text-sm"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={confirmClearAll}
                                        disabled={clearing}
                                        className="flex-1 py-3 bg-red-600 text-white font-black rounded-2xl hover:bg-red-700 transition shadow-xl shadow-red-100 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 text-sm"
                                    >
                                        {clearing ? 'Deleting...' : 'Delete All'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default TeacherDashboard;
