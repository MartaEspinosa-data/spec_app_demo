import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Calendar, BookOpen, Clock, DollarSign, Package, LogOut, Home, User, Play, Menu, X, XCircle } from 'lucide-react';
import { useLanguage } from '../i18n';
import { useToast } from '../components/Toast';
import LanguageSelector from '../components/LanguageSelector';
import { StudentBookingCalendar } from '../components/calendar/StudentBookingCalendar';
import { AddToCalendar } from '../components/AddToCalendar';
import apiClient from '../services/apiClient';
import { TEACHER_ID } from '../config';

interface LessonInfo {
    id: string;
    lesson_type: string;
    start_time: string;
    duration: number;
    price: number;
    status: string;
    meeting_link: string | null;
    feedback_vocabulary?: string;
    feedback_errors?: string;
    feedback_materials?: string;
}

interface PackageInfo {
    id: string;
    duration: number;
    total_lessons: number;
    remaining_lessons: number;
    price_paid: number;
    status: string;
}

const DashboardPage = () => {
    const { t } = useLanguage();
    const { addToast } = useToast();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'lessons' | 'packages'>('lessons');
    const [lessons, setLessons] = useState<LessonInfo[]>([]);
    const [packages, setPackages] = useState<PackageInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [reschedulingLesson, setReschedulingLesson] = useState<LessonInfo | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const studentAuth = JSON.parse(localStorage.getItem('student_auth') || 'null');

    useEffect(() => {
        if (!studentAuth) {
            navigate('/student/login');
            return;
        }
        fetchLessons();
        fetchPackages();
    }, []);

    const fetchLessons = async () => {
        try {
            const res = await apiClient.get(`/students/${studentAuth.student_id}/lessons`);
            setLessons(res.data.lessons);
        } catch (err: any) {
            addToast('error', err?.response?.data?.detail || 'Failed to load lessons.');
        } finally {
            setLoading(false);
        }
    };

    const fetchPackages = async () => {
        try {
            const res = await apiClient.get(`/packages/student/${studentAuth.student_id}`);
            setPackages(res.data.packages || []);
        } catch (err: any) {
            addToast('error', err?.response?.data?.detail || 'Failed to load packages.');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('student_auth');
        navigate('/student/login');
    };

    const formatDate = (isoString: string) => {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        return new Date(isoString).toLocaleDateString('en-GB', {
            weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: tz,
        });
    };

    const formatTime = (isoString: string) => {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        return new Date(isoString).toLocaleTimeString('en-GB', {
            hour: '2-digit', minute: '2-digit', timeZone: tz,
        });
    };

    const handleCancelLesson = async (lesson: LessonInfo) => {
        if (!window.confirm(t('lesson.cancelPrompt'))) return;
        try {
            await apiClient.patch(`/lessons/${lesson.id}/cancel`);
            addToast('success', t('lesson.cancelSuccess'));
            await fetchLessons();
        } catch (err: any) {
            addToast('error', err?.response?.data?.detail || t('lesson.cancelError'));
        }
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

    if (!studentAuth) return null;

    const navItems = [
        { name: 'My Lessons', icon: <Calendar size={20} />, key: 'lessons' as const },
        { name: 'My Packages', icon: <Package size={20} />, key: 'packages' as const },
    ];

    const selectTab = (key: 'lessons' | 'packages') => {
        setActiveTab(key);
        setSidebarOpen(false);
    };

    const SidebarContent = () => (
        <div className="flex flex-col gap-8">
            <div>
                <div className="flex items-center justify-between mb-4">
                    <div className="text-lg font-black text-indigo-600 tracking-tighter uppercase">{t('dashboard.studentTitle')}</div>
                    <div className="flex items-center gap-3">
                        <LanguageSelector />
                        <Link to="/" className="text-gray-400 hover:text-indigo-600 transition" title="Home">
                            <Home size={18} />
                        </Link>
                        <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 transition" title="Logout">
                            <LogOut size={18} />
                        </button>
                    </div>
                </div>
                <div className="bg-indigo-50 rounded-xl p-3 flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center shrink-0">
                        <User size={18} className="text-indigo-600" />
                    </div>
                    <div className="min-w-0">
                        <p className="font-bold text-gray-900 text-sm truncate">{studentAuth.name}</p>
                        <p className="text-gray-500 text-xs truncate">{studentAuth.email}</p>
                    </div>
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
                    {activeTab === 'lessons' ? 'My Lessons' : 'My Packages'}
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
                <header className="mb-6 sm:mb-10">
                    <h1 className="text-2xl sm:text-4xl font-black text-gray-900 mb-2">
                        {activeTab === 'lessons' ? t('dashboard.studentTitle') : 'My Packages'}
                    </h1>
                    <p className="text-sm sm:text-base text-gray-500 font-medium">
                        {activeTab === 'lessons'
                            ? 'View all your booked and completed lessons.'
                            : 'View your purchased lesson packages and remaining credits.'}
                    </p>
                </header>

                {activeTab === 'lessons' ? (
                    loading ? (
                        <div className="text-center py-20 text-gray-400 font-bold">Loading...</div>
                    ) : lessons.length === 0 ? (
                        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg border border-gray-100 p-12 sm:p-20 text-center">
                            <Calendar size={48} className="mx-auto mb-6 text-gray-300" />
                            <h2 className="text-xl sm:text-2xl font-black text-gray-800 mb-4">No lessons yet</h2>
                            <p className="text-gray-500 max-w-sm mx-auto mb-8 font-medium text-sm sm:text-base">Book your first lesson to get started on your Spanish journey!</p>
                            <Link to="/" className="px-8 sm:px-10 py-3 sm:py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition shadow-xl text-sm sm:text-base">
                                Book a Lesson
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <p className="text-xs sm:text-sm font-bold text-gray-400 uppercase tracking-wider mb-6">
                                {lessons.length} lesson{lessons.length !== 1 ? 's' : ''} total · Times in your timezone
                            </p>
                            {lessons.map((lesson) => (
                                <div key={lesson.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all p-4 sm:p-6">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
                                        <h3 className="font-black text-base sm:text-lg text-gray-900">{lesson.lesson_type}</h3>
                                        <span className={`px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider w-fit ${statusColor(lesson.status)}`}>
                                            {lesson.status}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
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

                                    {lesson.status === 'scheduled' && (
                                        <div className="pt-4 border-t border-gray-50 flex flex-wrap items-center justify-end gap-3">
                                            <div className="mr-auto">
                                                <AddToCalendar 
                                                    title={`Spanish Lesson with Marta (${lesson.lesson_type})`}
                                                    startTime={lesson.start_time}
                                                    durationMinutes={lesson.duration}
                                                    description={`Spanish lesson focused on ${lesson.lesson_type}. \n\nMeeting link: ${lesson.meeting_link || 'https://meet.google.com/pyv-dxwi-mxc'}`}
                                                    location={lesson.meeting_link || 'https://meet.google.com/pyv-dxwi-mxc'}
                                                />
                                            </div>
                                            {new Date(lesson.start_time).getTime() - new Date().getTime() > 24 * 60 * 60 * 1000 ? (
                                                <button
                                                    onClick={() => setReschedulingLesson(lesson)}
                                                    className="px-4 sm:px-6 py-2 sm:py-2.5 bg-indigo-50 text-indigo-600 font-bold rounded-xl hover:bg-indigo-100 transition flex items-center gap-2 text-xs sm:text-sm"
                                                >
                                                    <Calendar size={14} />
                                                    Reschedule
                                                </button>
                                            ) : (
                                                <span className="text-xs text-gray-400 font-medium">
                                                    Rescheduling closed ({'<'} 24h)
                                                </span>
                                            )}
                                            {new Date(lesson.start_time).getTime() - new Date().getTime() > 24 * 60 * 60 * 1000 ? (
                                                <button
                                                    onClick={() => handleCancelLesson(lesson)}
                                                    className="px-4 sm:px-6 py-2 sm:py-2.5 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition flex items-center gap-2 text-xs sm:text-sm"
                                                >
                                                    <XCircle size={14} />
                                                    {t('lesson.cancelButton')}
                                                </button>
                                            ) : (
                                                <span className="text-xs text-gray-400 font-medium">
                                                    Cancel closed ({'<'} 24h)
                                                </span>
                                            )}
                                            <a
                                                href={lesson.meeting_link || 'https://meet.google.com/pyv-dxwi-mxc'}
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="px-4 sm:px-6 py-2 sm:py-2.5 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition shadow-lg hover:shadow-green-500/30 flex items-center gap-2 text-xs sm:text-sm"
                                            >
                                                <Play size={14} />
                                                Join Lesson
                                            </a>
                                        </div>
                                    )}

                                    {/* Feedback Section */}
                                    {(lesson.feedback_vocabulary || lesson.feedback_errors || lesson.feedback_materials) && (
                                        <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-100 bg-gray-50/30 -mx-4 sm:-mx-6 px-4 sm:px-6 rounded-b-2xl">
                                            <h4 className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                <BookOpen size={14} />
                                                Notes from Marta
                                            </h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
                                                {lesson.feedback_vocabulary && (
                                                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Vocabulary</p>
                                                        <p className="text-sm text-gray-700 leading-relaxed font-medium">{lesson.feedback_vocabulary}</p>
                                                    </div>
                                                )}
                                                {lesson.feedback_errors && (
                                                    <div className="bg-white p-4 rounded-xl border border-red-50 shadow-sm">
                                                        <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1">Corrections</p>
                                                        <p className="text-sm text-gray-700 leading-relaxed font-medium">{lesson.feedback_errors}</p>
                                                    </div>
                                                )}
                                                {lesson.feedback_materials && (
                                                    <div className="bg-white p-4 rounded-xl border border-blue-50 shadow-sm">
                                                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Materials</p>
                                                        {lesson.feedback_materials.startsWith('http') ? (
                                                            <a href={lesson.feedback_materials} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 font-bold underline hover:text-indigo-700 break-all">
                                                                {lesson.feedback_materials}
                                                            </a>
                                                        ) : (
                                                            <p className="text-sm text-gray-700 leading-relaxed font-medium">{lesson.feedback_materials}</p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )
                ) : (
                    <div>
                        {packages.length === 0 ? (
                            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg border border-gray-100 p-12 sm:p-20 text-center">
                                <Package size={48} className="mx-auto mb-6 text-gray-300" />
                                <h2 className="text-xl sm:text-2xl font-black text-gray-800 mb-4">No packages yet</h2>
                                <p className="text-gray-500 max-w-sm mx-auto mb-8 font-medium text-sm sm:text-base">Purchase a lesson package to save with bulk pricing!</p>
                                <Link to="/" className="px-8 sm:px-10 py-3 sm:py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition shadow-xl text-sm sm:text-base">
                                    Browse Packages
                                </Link>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                                {packages.map((pkg) => (
                                    <div key={pkg.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="font-black text-base sm:text-lg text-gray-900">{pkg.duration} min Package</h3>
                                            <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${pkg.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                                {pkg.status}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-2xl sm:text-3xl font-black text-indigo-600">{pkg.remaining_lessons}<span className="text-base sm:text-lg text-gray-400">/{pkg.total_lessons}</span></p>
                                                <p className="text-xs sm:text-sm text-gray-500 font-medium">lessons remaining</p>
                                            </div>
                                            {pkg.remaining_lessons > 0 && (
                                                <Link
                                                    to={`/book/${TEACHER_ID}?package=${pkg.id}`}
                                                    className="px-4 sm:px-6 py-2 sm:py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition text-xs sm:text-sm"
                                                >
                                                    Schedule Lesson
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Rescheduling Modal */}
                {reschedulingLesson && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6 animate-fade-in">
                        <div className="bg-white rounded-2xl sm:rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-scale-in max-h-[90vh] flex flex-col">
                            <div className="p-4 sm:p-8 border-b border-gray-100 flex items-center justify-between bg-indigo-600 text-white">
                                <div>
                                    <h2 className="text-xl sm:text-2xl font-black">Reschedule Lesson</h2>
                                    <p className="opacity-80 font-medium text-sm">Select a new date and time for your {reschedulingLesson.lesson_type}</p>
                                </div>
                                <button 
                                    onClick={() => setReschedulingLesson(null)}
                                    className="p-2 hover:bg-white/10 rounded-full transition shrink-0"
                                >
                                    <LogOut size={20} className="rotate-180" />
                                </button>
                            </div>
                            
                            <div className="p-4 sm:p-8 overflow-y-auto">
                                <StudentBookingCalendar
                                    teacherId={TEACHER_ID}
                                    durationMinutes={reschedulingLesson.duration}
                                    onSlotSelect={async (newSlot) => {
                                        if (window.confirm("Confirm rescheduling this lesson?")) {
                                            try {
                                                await apiClient.patch(`/lessons/${reschedulingLesson.id}/reschedule?new_start_time=${newSlot}`);
                                                
                                                alert("Lesson successfully rescheduled!");
                                                setReschedulingLesson(null);
                                                const lessonsRes = await apiClient.get(`/students/${studentAuth.student_id}/lessons`);
                                                setLessons(lessonsRes.data.lessons);
                                            } catch (err) {
                                                alert("Error rescheduling: " + err);
                                            }
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default DashboardPage;
