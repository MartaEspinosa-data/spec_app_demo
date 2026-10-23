import { useEffect, useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
    Calendar, 
    BookOpen, 
    Clock, 
    DollarSign, 
    LogOut, 
    Home, 
    User, 
    Menu, 
    X, 
    XCircle, 
    Trash2, 
    Video, 
    CheckCircle2, 
    AlertCircle, 
    ArrowRight, 
    CalendarPlus, 
    Sparkles, 
    Globe, 
    ExternalLink,
    Gift
} from 'lucide-react';
import { useLanguage } from '../i18n';
import { useToast } from '../components/Toast';
import LanguageSelector from '../components/LanguageSelector';
import { StudentBookingCalendar } from '../components/calendar/StudentBookingCalendar';
import { AddToCalendar } from '../components/AddToCalendar';
import apiClient from '../services/apiClient';
import { TEACHER_ID } from '../config';

interface LessonPackage {
    id: string;
    student_id: string;
    teacher_id: string;
    lesson_type: string;
    duration: number;
    total_credits: number;
    remaining_credits: number;
    price_total: number;
    status: string;
    created_at: string;
}

interface LessonInfo {
    id: string;
    lesson_type: string;
    start_time: string;
    duration: number;
    price: number;
    status: string;
    meeting_link: string | null;
    package_id?: string | null;
    feedback_vocabulary?: string;
    feedback_errors?: string;
    feedback_materials?: string;
}

type TabType = 'all' | 'scheduled' | 'completed' | 'cancelled';

const DashboardPage = () => {
    const { t, language } = useLanguage();
    const { addToast } = useToast();
    const navigate = useNavigate();
    const [lessons, setLessons] = useState<LessonInfo[]>([]);
    const [packages, setPackages] = useState<LessonPackage[]>([]);
    const [loading, setLoading] = useState(true);
    const [reschedulingLesson, setReschedulingLesson] = useState<LessonInfo | null>(null);
    const [bookingPackage, setBookingPackage] = useState<LessonPackage | null>(null);
    const [packageBookingSlot, setPackageBookingSlot] = useState<string | null>(null);
    const [bookingWithCreditLoading, setBookingWithCreditLoading] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>('all');

    const studentAuth = JSON.parse(localStorage.getItem('student_auth') || 'null');

    useEffect(() => {
        if (!studentAuth) {
            navigate('/student/login');
            return;
        }
        fetchLessons();
        fetchPackages();
    }, []);

    const fetchPackages = async () => {
        if (!studentAuth?.student_id) return;
        try {
            const res = await apiClient.get(`/packages/student/${studentAuth.student_id}`);
            setPackages(res.data.packages || []);
        } catch (err: any) {
            console.warn('[Dashboard] Could not fetch packages:', err);
        }
    };

    const handleBookPackageCredit = async () => {
        if (!bookingPackage || !packageBookingSlot) {
            addToast('error', t('dashboard.package.selectSlotPrompt') || 'Por favor, selecciona una fecha y hora en el calendario.');
            return;
        }
        setBookingWithCreditLoading(true);
        try {
            await apiClient.post(`/packages/${bookingPackage.id}/book`, {
                start_time: packageBookingSlot
            });
            addToast('success', t('dashboard.package.bookSuccess') || '¡Clase reservada con éxito usando 1 crédito de tu bono!');
            setBookingPackage(null);
            setPackageBookingSlot(null);
            await Promise.all([fetchLessons(), fetchPackages()]);
        } catch (err: any) {
            addToast('error', err?.response?.data?.detail || 'Error al reservar con el crédito.');
        } finally {
            setBookingWithCreditLoading(false);
        }
    };

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

    const handleLogout = () => {
        localStorage.removeItem('student_auth');
        navigate('/student/login');
    };

    const getLocaleCode = (lang: string) => {
        switch (lang) {
            case 'es': return 'es-ES';
            case 'fr': return 'fr-FR';
            case 'ru': return 'ru-RU';
            default: return 'en-US';
        }
    };

    const formatDateParts = (isoString: string) => {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const date = new Date(isoString);
        const locale = getLocaleCode(language);
        return {
            weekday: date.toLocaleDateString(locale, { weekday: 'short', timeZone: tz }),
            day: date.toLocaleDateString(locale, { day: 'numeric', timeZone: tz }),
            month: date.toLocaleDateString(locale, { month: 'short', timeZone: tz }).replace('.', '').toUpperCase(),
            year: date.toLocaleDateString(locale, { year: 'numeric', timeZone: tz }),
            full: date.toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: tz }),
        };
    };

    const formatTime = (isoString: string) => {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        return new Date(isoString).toLocaleTimeString([], {
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

    const handleCleanAll = async () => {
        const cancelledCount = lessons.filter(l => l.status === 'cancelled').length;
        const completedCount = lessons.filter(l => l.status === 'completed').length;
        const total = cancelledCount + completedCount;

        if (total === 0) {
            addToast('info', t('lesson.cleanNone'));
            return;
        }

        const message = t('lesson.cleanPrompt')
            .replace('{count}', String(total))
            .replace('{cancelled}', String(cancelledCount))
            .replace('{completed}', String(completedCount));

        if (!window.confirm(message)) return;

        try {
            const res = await apiClient.delete(`/students/${studentAuth.student_id}/lessons/clean`);
            addToast('success', t('lesson.cleanSuccess').replace('{count}', String(res.data.deleted_count)));
            await fetchLessons();
        } catch (err: any) {
            addToast('error', err?.response?.data?.detail || t('lesson.cleanError'));
        }
    };

    // Metrics calculations
    const scheduledLessons = useMemo(() => lessons.filter(l => l.status === 'scheduled'), [lessons]);
    const completedLessons = useMemo(() => lessons.filter(l => l.status === 'completed'), [lessons]);
    const cancelledLessons = useMemo(() => lessons.filter(l => l.status === 'cancelled'), [lessons]);
    const totalMinutesLearned = useMemo(() => 
        completedLessons.reduce((acc, curr) => acc + (curr.duration || 0), 0),
        [completedLessons]
    );

    // Next upcoming scheduled lesson
    const nextLesson = useMemo(() => {
        const now = new Date().getTime();
        const future = scheduledLessons
            .filter(l => new Date(l.start_time).getTime() + (l.duration || 30) * 60000 > now)
            .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
        return future[0] || null;
    }, [scheduledLessons]);

    // Next lesson timing indicator
    const getNextLessonStatus = (lesson: LessonInfo) => {
        const now = new Date().getTime();
        const start = new Date(lesson.start_time).getTime();
        const end = start + (lesson.duration || 30) * 60000;

        if (now >= start - 15 * 60000 && now <= end) {
            return { isLive: true, badge: t('dashboard.nextLesson.liveNow') };
        }

        const diffHours = (start - now) / (1000 * 60 * 60);
        const diffDays = Math.ceil(diffHours / 24);

        const startDate = new Date(lesson.start_time);
        const nowDate = new Date();
        const isToday = startDate.toDateString() === nowDate.toDateString();

        const tomorrow = new Date();
        tomorrow.setDate(nowDate.getDate() + 1);
        const isTomorrow = startDate.toDateString() === tomorrow.toDateString();

        if (isToday) return { isLive: false, badge: t('dashboard.nextLesson.today') };
        if (isTomorrow) return { isLive: false, badge: t('dashboard.nextLesson.tomorrow') };
        return { isLive: false, badge: t('dashboard.nextLesson.inDays', { days: String(diffDays) }) };
    };

    // Filtered list based on active tab
    const filteredLessons = useMemo(() => {
        switch (activeTab) {
            case 'scheduled':
                return scheduledLessons;
            case 'completed':
                return completedLessons;
            case 'cancelled':
                return cancelledLessons;
            default:
                return lessons;
        }
    }, [activeTab, lessons, scheduledLessons, completedLessons, cancelledLessons]);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'scheduled':
                return {
                    label: t('dashboard.status.scheduled'),
                    style: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
                    dot: 'bg-emerald-500'
                };
            case 'pending':
                return {
                    label: t('dashboard.status.pending'),
                    style: 'bg-amber-50 text-amber-700 border-amber-200/80',
                    dot: 'bg-amber-500'
                };
            case 'completed':
                return {
                    label: t('dashboard.status.completed'),
                    style: 'bg-blue-50 text-blue-700 border-blue-200/80',
                    dot: 'bg-blue-500'
                };
            case 'cancelled':
                return {
                    label: t('dashboard.status.cancelled'),
                    style: 'bg-rose-50/80 text-rose-600 border-rose-200/60',
                    dot: 'bg-rose-400'
                };
            default:
                return {
                    label: status,
                    style: 'bg-gray-50 text-gray-600 border-gray-200',
                    dot: 'bg-gray-400'
                };
        }
    };

    if (!studentAuth) return null;

    const userInitial = studentAuth.name ? studentAuth.name.trim()[0].toUpperCase() : 'E';
    const currentTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const SidebarContent = () => (
        <div className="flex flex-col h-full justify-between">
            <div className="space-y-6">
                {/* Brand / Logo Header */}
                <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                    <Link to="/" className="flex items-center gap-3 group">
                        <img 
                            src="/icon.png" 
                            alt="Marta Spanish Teacher" 
                            className="h-9 w-auto object-contain transition-transform group-hover:scale-105" 
                        />
                        <div className="flex flex-col">
                            <span className="text-base font-black text-[#233b5d] tracking-tight leading-none">
                                Spanish con Marta
                            </span>
                            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider leading-none mt-1">
                                {t('dashboard.sidebar.role') || 'Estudiante'}
                            </span>
                        </div>
                    </Link>
                </div>

                {/* Student Profile Card */}
                <div className="bg-gradient-to-br from-indigo-50/80 via-white to-purple-50/60 rounded-2xl p-4 border border-indigo-100/80 shadow-xs">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-black flex items-center justify-center shrink-0 shadow-sm text-base">
                            {userInitial}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="font-bold text-gray-900 text-sm truncate" title={studentAuth.name}>
                                {studentAuth.name}
                            </p>
                            <p className="text-gray-500 text-xs truncate" title={studentAuth.email}>
                                {studentAuth.email}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Navigation Links */}
                <nav className="flex flex-col gap-1.5 pt-2">
                    <button 
                        onClick={() => { setActiveTab('all'); setSidebarOpen(false); }}
                        className="flex items-center justify-between px-4 py-3 rounded-xl font-bold bg-indigo-50 text-indigo-600 transition-all text-sm group"
                    >
                        <span className="flex items-center gap-3">
                            <BookOpen size={18} className="text-indigo-600" />
                            {t('dashboard.sidebar.myLessons')}
                        </span>
                        {scheduledLessons.length > 0 && (
                            <span className="bg-indigo-600 text-white text-[11px] font-black px-2 py-0.5 rounded-full shadow-xs">
                                {scheduledLessons.length}
                            </span>
                        )}
                    </button>

                    <Link 
                        to="/#book-a-lesson" 
                        className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-gray-600 hover:text-indigo-600 hover:bg-gray-50 transition-all text-sm"
                        onClick={() => setSidebarOpen(false)}
                    >
                        <CalendarPlus size={18} className="text-gray-400 group-hover:text-indigo-600" />
                        {t('dashboard.sidebar.bookLesson')}
                    </Link>

                    <Link 
                        to="/" 
                        className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-gray-600 hover:text-indigo-600 hover:bg-gray-50 transition-all text-sm"
                        onClick={() => setSidebarOpen(false)}
                    >
                        <Home size={18} className="text-gray-400 group-hover:text-indigo-600" />
                        {t('dashboard.sidebar.home')}
                    </Link>
                </nav>
            </div>

            {/* Bottom Controls */}
            <div className="pt-6 border-t border-gray-100 flex flex-col gap-4">
                <div className="flex items-center justify-between px-1">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{t('dashboard.language') || 'Language'}</span>
                    <LanguageSelector />
                </div>
                <button 
                    onClick={handleLogout} 
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-gray-500 hover:text-rose-600 hover:bg-rose-50 font-bold transition-all text-xs cursor-pointer w-full"
                >
                    <LogOut size={16} />
                    <span>{t('dashboard.sidebar.logout')}</span>
                </button>
            </div>
        </div>
    );

    return (
        <div className="flex min-h-screen bg-[#f8fafc]">
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex w-72 bg-white border-r border-gray-200/80 p-6 flex-col shrink-0 shadow-xs sticky top-0 h-screen">
                <SidebarContent />
            </aside>

            {/* Mobile Top Bar */}
            <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200 px-4 py-3 flex items-center justify-between">
                <button 
                    onClick={() => setSidebarOpen(!sidebarOpen)} 
                    className="p-2 rounded-xl text-gray-700 hover:bg-gray-100 transition"
                    aria-label="Toggle menu"
                >
                    {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
                </button>
                <div className="flex items-center gap-2">
                    <img src="/icon.png" alt="Marta Spanish" className="h-6 w-auto" />
                    <span className="text-sm font-black text-[#233b5d] tracking-tight">
                        {t('dashboard.studentTitle')}
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    <LanguageSelector />
                    <button 
                        onClick={handleLogout} 
                        className="p-2 text-gray-400 hover:text-rose-500 transition"
                        title={t('dashboard.sidebar.logout')}
                    >
                        <LogOut size={18} />
                    </button>
                </div>
            </div>

            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div className="md:hidden fixed inset-0 z-50 flex">
                    <div 
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
                        onClick={() => setSidebarOpen(false)}
                    />
                    <div className="relative w-72 bg-white border-r border-gray-200 p-6 overflow-y-auto h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-left duration-200">
                        <SidebarContent />
                    </div>
                </div>
            )}

            {/* Main Content */}
            <main className="flex-1 p-4 sm:p-8 lg:p-10 pt-20 md:pt-10 max-w-7xl mx-auto w-full">
                {/* Header Welcome Section */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full mb-2 border border-indigo-100">
                            <Sparkles size={13} className="text-indigo-600" />
                            <span>{t('dashboard.studentTitle')}</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900 tracking-tight">
                            {t('dashboard.welcome', { name: studentAuth.name })}
                        </h1>
                        <p className="text-sm sm:text-base text-gray-500 font-medium mt-1">
                            {t('dashboard.welcomeSub')}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link
                            to="/#book-a-lesson"
                            className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-md shadow-indigo-500/20 hover:shadow-lg transition-all text-sm shrink-0 hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <CalendarPlus size={16} />
                            <span>{t('dashboard.bookNew')}</span>
                        </Link>
                    </div>
                </div>

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 mb-8">
                    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-150 shadow-xs flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                            <Calendar size={22} />
                        </div>
                        <div>
                            <span className="text-2xl sm:text-3xl font-black text-gray-900 leading-none block">
                                {scheduledLessons.length}
                            </span>
                            <span className="text-xs font-semibold text-gray-500 mt-1 block">
                                {t('dashboard.stats.upcoming')}
                            </span>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-150 shadow-xs flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
                            <CheckCircle2 size={22} />
                        </div>
                        <div>
                            <span className="text-2xl sm:text-3xl font-black text-gray-900 leading-none block">
                                {completedLessons.length}
                            </span>
                            <span className="text-xs font-semibold text-gray-500 mt-1 block">
                                {t('dashboard.stats.completed')}
                            </span>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-150 shadow-xs flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100">
                            <Clock size={22} />
                        </div>
                        <div>
                            <span className="text-2xl sm:text-3xl font-black text-gray-900 leading-none block">
                                {totalMinutesLearned} <span className="text-sm font-bold text-gray-400">min</span>
                            </span>
                            <span className="text-xs font-semibold text-gray-500 mt-1 block">
                                {t('dashboard.stats.learningTime')}
                            </span>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-150 shadow-xs flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
                            <BookOpen size={22} />
                        </div>
                        <div>
                            <span className="text-2xl sm:text-3xl font-black text-gray-900 leading-none block">
                                {lessons.length}
                            </span>
                            <span className="text-xs font-semibold text-gray-500 mt-1 block">
                                {t('dashboard.stats.total')}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Lesson Packages Section */}
                {packages.length > 0 && (
                    <div className="mb-8 bg-gradient-to-br from-amber-500/10 via-indigo-50/40 to-purple-50/20 rounded-3xl p-6 sm:p-7 border border-amber-200/80 shadow-xs">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                            <div className="flex items-center gap-3">
                                <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/30">
                                    <Gift size={22} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight">
                                            {t('dashboard.packages.title') || 'Mis Bonos de Clases'}
                                        </h2>
                                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-200">
                                            3% Dto.
                                        </span>
                                    </div>
                                    <p className="text-xs sm:text-sm text-gray-500 font-medium mt-0.5">
                                        {t('dashboard.packages.subtitle') || 'Usa tus créditos disponibles para programar tus clases cuando mejor te convenga.'}
                                    </p>
                                </div>
                            </div>
                            <Link
                                to="/#book-a-lesson"
                                className="self-start sm:self-auto inline-flex items-center gap-1.5 text-xs font-bold text-amber-900 hover:text-amber-950 bg-white hover:bg-amber-50/80 px-3.5 py-2 rounded-xl border border-amber-200/80 transition-all shadow-2xs"
                            >
                                <span>+ Comprar nuevo bono</span>
                            </Link>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {packages.map((pkg) => {
                                const isDepleted = pkg.remaining_credits <= 0;
                                return (
                                    <div 
                                        key={pkg.id} 
                                        className={`rounded-2xl p-5 border transition-all ${
                                            isDepleted 
                                                ? 'bg-white/60 border-gray-200 opacity-70' 
                                                : 'bg-white border-amber-200 shadow-sm hover:shadow-md'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-2 mb-3">
                                            <div>
                                                <span className="text-[11px] font-black uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-lg border border-amber-100">
                                                    Bono 5 Clases
                                                </span>
                                                <h3 className="font-black text-base text-gray-900 mt-1.5">
                                                    {pkg.lesson_type}
                                                </h3>
                                                <p className="text-xs text-gray-500 font-medium">
                                                    {pkg.duration} minutos por clase
                                                </p>
                                            </div>
                                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                                isDepleted 
                                                    ? 'bg-gray-100 text-gray-600' 
                                                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                            }`}>
                                                {isDepleted ? 'Agotado' : 'Activo'}
                                            </span>
                                        </div>

                                        {/* Credit progress pills */}
                                        <div className="my-4 p-3 bg-gray-50/80 rounded-xl border border-gray-100">
                                            <div className="flex items-center justify-between text-xs font-bold text-gray-700 mb-2">
                                                <span>Créditos restantes</span>
                                                <span className="text-sm font-black text-indigo-600">
                                                    {pkg.remaining_credits} / {pkg.total_credits}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                {Array.from({ length: pkg.total_credits }).map((_, idx) => {
                                                    const isAvailable = idx < pkg.remaining_credits;
                                                    return (
                                                        <div
                                                            key={idx}
                                                            className={`h-2 flex-1 rounded-full transition-all ${
                                                                isAvailable 
                                                                    ? 'bg-gradient-to-r from-amber-400 to-amber-500 shadow-2xs' 
                                                                    : 'bg-gray-200'
                                                            }`}
                                                            title={isAvailable ? 'Crédito disponible' : 'Crédito canjeado'}
                                                        />
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => {
                                                setBookingPackage(pkg);
                                                setPackageBookingSlot(null);
                                            }}
                                            disabled={isDepleted}
                                            className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                                                isDepleted
                                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-md shadow-indigo-600/20 active:scale-98 cursor-pointer'
                                            }`}
                                        >
                                            <CalendarPlus size={15} />
                                            <span>
                                                {isDepleted ? 'Bono agotado' : 'Reservar con 1 crédito'}
                                            </span>
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Hero Spotlight: Next Upcoming Lesson */}
                {nextLesson && (
                    <div className="mb-8 relative overflow-hidden bg-gradient-to-br from-[#1e293b] via-[#1e1b4b] to-[#0f172a] rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-indigo-950/10 border border-slate-700/50">
                        {/* Decorative background glow */}
                        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
                        <div className="absolute bottom-0 right-1/4 -mb-16 w-60 h-60 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />

                        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                            <div className="space-y-3 max-w-2xl">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold text-indigo-200">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                    <span>{t('dashboard.nextLesson.title')}</span>
                                    <span className="opacity-60">·</span>
                                    <span className="text-white font-black">{getNextLessonStatus(nextLesson).badge}</span>
                                </div>

                                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                                    {nextLesson.lesson_type}
                                </h2>

                                <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-300 font-medium">
                                    <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
                                        <Calendar size={15} className="text-indigo-400 shrink-0" />
                                        <span>{formatDateParts(nextLesson.start_time).full}</span>
                                    </div>
                                    <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
                                        <Clock size={15} className="text-indigo-400 shrink-0" />
                                        <span>{formatTime(nextLesson.start_time)} · {nextLesson.duration} min</span>
                                    </div>
                                    <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
                                        <User size={15} className="text-indigo-400 shrink-0" />
                                        <span>{t('dashboard.teacherWith')}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 shrink-0">
                                <AddToCalendar 
                                    title={`Spanish Lesson with Marta (${nextLesson.lesson_type})`}
                                    startTime={nextLesson.start_time}
                                    durationMinutes={nextLesson.duration}
                                    description={`Spanish lesson focused on ${nextLesson.lesson_type}. \n\nMeeting link: ${nextLesson.meeting_link || 'https://meet.google.com/pyv-dxwi-mxc'}`}
                                    location={nextLesson.meeting_link || 'https://meet.google.com/pyv-dxwi-mxc'}
                                    className="px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold rounded-xl transition-all flex items-center gap-2 text-xs sm:text-sm backdrop-blur-md"
                                    label={t('dashboard.actions.addToCalendar')}
                                />

                                <Link
                                    to={`/classroom/${nextLesson.id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-black rounded-xl shadow-lg shadow-emerald-500/30 transition-all flex items-center gap-2.5 text-xs sm:text-sm hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    <Video size={18} />
                                    <span>{t('dashboard.actions.enter')}</span>
                                    <ArrowRight size={15} />
                                </Link>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tabs & Controls Toolbar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    {/* Filter Tabs */}
                    <div className="inline-flex p-1.5 bg-gray-200/70 rounded-2xl gap-1 overflow-x-auto max-w-full">
                        <button
                            onClick={() => setActiveTab('all')}
                            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
                                activeTab === 'all'
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            {t('dashboard.tabs.all')}
                            <span className="ml-2 text-xs opacity-75 font-semibold bg-gray-100 px-2 py-0.5 rounded-full">
                                {lessons.length}
                            </span>
                        </button>
                        <button
                            onClick={() => setActiveTab('scheduled')}
                            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
                                activeTab === 'scheduled'
                                    ? 'bg-white text-emerald-700 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            {t('dashboard.tabs.upcoming')}
                            <span className="ml-2 text-xs opacity-75 font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">
                                {scheduledLessons.length}
                            </span>
                        </button>
                        <button
                            onClick={() => setActiveTab('completed')}
                            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
                                activeTab === 'completed'
                                    ? 'bg-white text-blue-700 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            {t('dashboard.tabs.completed')}
                            <span className="ml-2 text-xs opacity-75 font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                                {completedLessons.length}
                            </span>
                        </button>
                        <button
                            onClick={() => setActiveTab('cancelled')}
                            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
                                activeTab === 'cancelled'
                                    ? 'bg-white text-rose-700 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            {t('dashboard.tabs.cancelled')}
                            <span className="ml-2 text-xs opacity-75 font-semibold bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full">
                                {cancelledLessons.length}
                            </span>
                        </button>
                    </div>

                    {/* Secondary Actions & Timezone Note */}
                    <div className="flex items-center gap-3 self-end sm:self-auto">
                        <span className="hidden md:inline-flex items-center gap-1.5 text-xs text-gray-400 font-medium">
                            <Globe size={13} />
                            <span>{currentTimezone}</span>
                        </span>

                        {(cancelledLessons.length > 0 || completedLessons.length > 0) && (
                            <button
                                onClick={handleCleanAll}
                                className="px-3.5 py-2 bg-white hover:bg-rose-50 text-gray-600 hover:text-rose-600 font-bold rounded-xl transition-all flex items-center gap-2 text-xs border border-gray-200 hover:border-rose-200 cursor-pointer shadow-2xs"
                                title={t('dashboard.cleanHistory')}
                            >
                                <Trash2 size={13} />
                                <span>{t('dashboard.cleanHistory')}</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Content Area */}
                {loading ? (
                    <div className="bg-white rounded-3xl border border-gray-150 p-16 text-center shadow-xs">
                        <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-gray-500 font-bold text-sm">{t('dashboard.loading') || 'Loading...'}</p>
                    </div>
                ) : lessons.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-gray-150 p-12 sm:p-20 text-center shadow-xs">
                        <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-6">
                            <Calendar size={32} />
                        </div>
                        <h2 className="text-xl sm:text-2xl font-black text-gray-900 mb-2">
                            {t('dashboard.emptyAll')}
                        </h2>
                        <p className="text-gray-500 max-w-md mx-auto mb-8 font-medium text-sm sm:text-base">
                            {t('dashboard.emptyAllSub')}
                        </p>
                        <Link 
                            to="/#book-a-lesson" 
                            className="inline-flex items-center gap-2 px-8 py-3.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-600/25 text-sm sm:text-base hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <CalendarPlus size={18} />
                            <span>{t('dashboard.bookNew')}</span>
                        </Link>
                    </div>
                ) : filteredLessons.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-gray-150 p-12 text-center shadow-xs">
                        <p className="text-gray-400 font-bold text-base mb-1">
                            {t('dashboard.emptyFilter')}
                        </p>
                        <p className="text-gray-400 text-xs font-medium">
                            {t('dashboard.emptyFilterSub')}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredLessons.map((lesson) => {
                            const dateInfo = formatDateParts(lesson.start_time);
                            const badge = getStatusBadge(lesson.status);
                            const isScheduled = lesson.status === 'scheduled';
                            const isCancelled = lesson.status === 'cancelled';
                            const canModify = new Date(lesson.start_time).getTime() - new Date().getTime() > 24 * 60 * 60 * 1000;

                            return (
                                <div 
                                    key={lesson.id} 
                                    className={`rounded-2xl transition-all ${
                                        isCancelled 
                                            ? 'bg-white/70 border border-gray-200/70 p-5 sm:p-6 opacity-80' 
                                            : 'bg-white border border-gray-150 p-5 sm:p-6 shadow-xs hover:shadow-md'
                                    }`}
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        {/* Left Side: Date Box & Info */}
                                        <div className="flex items-start gap-4">
                                            {/* Stylized Calendar Box */}
                                            <div className="shrink-0 w-14 rounded-xl overflow-hidden border border-gray-200/80 shadow-2xs text-center bg-gray-50">
                                                <div className="bg-indigo-600 text-white text-[10px] font-black uppercase py-0.5 tracking-wider">
                                                    {dateInfo.month}
                                                </div>
                                                <div className="text-lg font-black text-gray-900 py-1 bg-white leading-none">
                                                    {dateInfo.day}
                                                </div>
                                                <div className="text-[10px] font-bold text-gray-500 uppercase pb-1 bg-white">
                                                    {dateInfo.weekday}
                                                </div>
                                            </div>

                                            {/* Lesson Title & Details */}
                                            <div className="space-y-1.5 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h3 className="font-black text-base sm:text-lg text-gray-900 tracking-tight">
                                                        {lesson.lesson_type}
                                                    </h3>
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider border ${badge.style}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                                                        {badge.label}
                                                    </span>
                                                    {lesson.package_id && (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-50 text-amber-800 border border-amber-200">
                                                            🎟️ {t('dashboard.package.badge') || 'Bono 5 Clases'}
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 font-medium">
                                                    <span className="flex items-center gap-1.5">
                                                        <Clock size={13} className="text-gray-400" />
                                                        <span className="text-gray-700 font-semibold">{formatTime(lesson.start_time)}</span>
                                                        <span>· {lesson.duration} min</span>
                                                    </span>
                                                    <span className="flex items-center gap-1.5">
                                                        <User size={13} className="text-gray-400" />
                                                        <span>{t('dashboard.teacherWith')}</span>
                                                    </span>
                                                    <span className="flex items-center gap-1.5 font-bold text-gray-900">
                                                        <DollarSign size={13} className="text-gray-400" />
                                                        <span>${lesson.price.toFixed(2)}</span>
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Status Tag for Mobile / Alignment */}
                                    </div>

                                    {/* Action buttons row for Scheduled Lessons */}
                                    {isScheduled && (
                                        <div className="mt-5 pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
                                            <div className="flex items-center gap-2">
                                                <AddToCalendar 
                                                    title={`Spanish Lesson with Marta (${lesson.lesson_type})`}
                                                    startTime={lesson.start_time}
                                                    durationMinutes={lesson.duration}
                                                    description={`Spanish lesson focused on ${lesson.lesson_type}. \n\nMeeting link: ${lesson.meeting_link || 'https://meet.google.com/pyv-dxwi-mxc'}`}
                                                    location={lesson.meeting_link || 'https://meet.google.com/pyv-dxwi-mxc'}
                                                    className="px-3.5 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 transition-all flex items-center gap-1.5 shadow-2xs"
                                                    label={t('dashboard.actions.addToCalendar')}
                                                />
                                            </div>

                                            <div className="flex flex-wrap items-center gap-2 ml-auto">
                                                {canModify ? (
                                                    <>
                                                        <button
                                                            onClick={() => setReschedulingLesson(lesson)}
                                                            className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl transition flex items-center gap-1.5 text-xs cursor-pointer"
                                                        >
                                                            <Calendar size={13} />
                                                            <span>{t('dashboard.actions.reschedule')}</span>
                                                        </button>
                                                        <button
                                                            onClick={() => handleCancelLesson(lesson)}
                                                            className="px-3.5 py-2 text-rose-600 hover:bg-rose-50 font-bold rounded-xl transition flex items-center gap-1.5 text-xs border border-transparent hover:border-rose-100 cursor-pointer"
                                                        >
                                                            <XCircle size={13} />
                                                            <span>{t('lesson.cancelButton')}</span>
                                                        </button>
                                                    </>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-[11px] text-gray-400 font-medium px-2 py-1 bg-gray-50 rounded-lg">
                                                        <AlertCircle size={12} />
                                                        {t('dashboard.actions.cancelNotice')}
                                                    </span>
                                                )}

                                                <Link
                                                    to={`/classroom/${lesson.id}`}
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl shadow-xs hover:shadow-md transition-all flex items-center gap-1.5 text-xs hover:scale-[1.02] active:scale-[0.98]"
                                                >
                                                    <Video size={14} />
                                                    <span>{t('dashboard.actions.enter')}</span>
                                                </Link>
                                            </div>
                                        </div>
                                    )}

                                    {/* Feedback and Notes Section (if provided by teacher) */}
                                    {(lesson.feedback_vocabulary || lesson.feedback_errors || lesson.feedback_materials) && (
                                        <div className="mt-5 pt-5 border-t border-gray-150/70">
                                            <div className="bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/30 rounded-2xl p-4 sm:p-5 border border-indigo-100/70">
                                                <h4 className="text-xs font-black text-indigo-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                                                    <BookOpen size={14} className="text-indigo-600" />
                                                    <span>{t('dashboard.notesTitle')}</span>
                                                </h4>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                                                    {lesson.feedback_vocabulary && (
                                                        <div className="bg-white p-3.5 rounded-xl border border-gray-150 shadow-2xs">
                                                            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-wider mb-1">
                                                                {t('dashboard.notesVocabulary')}
                                                            </p>
                                                            <p className="text-xs text-gray-700 leading-relaxed font-medium">
                                                                {lesson.feedback_vocabulary}
                                                            </p>
                                                        </div>
                                                    )}
                                                    {lesson.feedback_errors && (
                                                        <div className="bg-white p-3.5 rounded-xl border border-rose-100 shadow-2xs">
                                                            <p className="text-[10px] font-black text-rose-500 uppercase tracking-wider mb-1">
                                                                {t('dashboard.notesCorrections')}
                                                            </p>
                                                            <p className="text-xs text-gray-700 leading-relaxed font-medium">
                                                                {lesson.feedback_errors}
                                                            </p>
                                                        </div>
                                                    )}
                                                    {lesson.feedback_materials && (
                                                        <div className="bg-white p-3.5 rounded-xl border border-blue-100 shadow-2xs">
                                                            <p className="text-[10px] font-black text-blue-500 uppercase tracking-wider mb-1">
                                                                {t('dashboard.notesMaterials')}
                                                            </p>
                                                            {lesson.feedback_materials.startsWith('http') ? (
                                                                <a 
                                                                    href={lesson.feedback_materials} 
                                                                    target="_blank" 
                                                                    rel="noopener noreferrer" 
                                                                    className="text-xs text-indigo-600 font-bold underline hover:text-indigo-700 break-all inline-flex items-center gap-1"
                                                                >
                                                                    <span>{lesson.feedback_materials}</span>
                                                                    <ExternalLink size={11} className="shrink-0" />
                                                                </a>
                                                            ) : (
                                                                <p className="text-xs text-gray-700 leading-relaxed font-medium">
                                                                    {lesson.feedback_materials}
                                                                </p>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Reschedule Modal */}
                {reschedulingLesson && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
                        <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col border border-gray-100">
                            <div className="p-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-center justify-between shrink-0">
                                <div className="space-y-1">
                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-xs font-bold">
                                        <Calendar size={12} />
                                        <span>{t('dashboard.rescheduleModal.title')}</span>
                                    </div>
                                    <h2 className="text-xl sm:text-2xl font-black text-white">
                                        {reschedulingLesson.lesson_type}
                                    </h2>
                                    <p className="text-xs text-indigo-100 font-medium">
                                        {t('dashboard.rescheduleModal.sub', { type: reschedulingLesson.lesson_type })}
                                    </p>
                                </div>
                                <button 
                                    onClick={() => setReschedulingLesson(null)}
                                    className="p-2 hover:bg-white/10 rounded-full transition text-white/80 hover:text-white shrink-0 cursor-pointer"
                                    aria-label="Cerrar"
                                >
                                    <X size={22} />
                                </button>
                            </div>
                            
                            <div className="p-6 overflow-y-auto">
                                <StudentBookingCalendar
                                    teacherId={TEACHER_ID}
                                    durationMinutes={reschedulingLesson.duration}
                                    onSlotSelect={async (newSlot) => {
                                        if (window.confirm(t('dashboard.rescheduleModal.confirm'))) {
                                            try {
                                                await apiClient.patch(`/lessons/${reschedulingLesson.id}/reschedule?new_start_time=${newSlot}`);
                                                addToast('success', t('dashboard.rescheduleModal.success'));
                                                setReschedulingLesson(null);
                                                await fetchLessons();
                                            } catch (err: any) {
                                                addToast('error', err?.response?.data?.detail || t('dashboard.rescheduleModal.error'));
                                            }
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Booking with Package Credit Modal */}
                {bookingPackage && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
                        <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col border border-gray-100">
                            <div className="p-6 bg-gradient-to-r from-amber-500 to-indigo-600 text-white flex items-center justify-between shrink-0">
                                <div className="space-y-1">
                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-xs font-bold">
                                        <Gift size={12} />
                                        <span>{t('dashboard.package.modalBadge') || 'Bono de 5 Clases'}</span>
                                    </div>
                                    <h2 className="text-xl sm:text-2xl font-black text-white">
                                        {bookingPackage.lesson_type}
                                    </h2>
                                    <p className="text-xs text-amber-100 font-medium">
                                        {bookingPackage.duration} min · {bookingPackage.remaining_credits} créditos disponibles
                                    </p>
                                </div>
                                <button 
                                    onClick={() => {
                                        setBookingPackage(null);
                                        setPackageBookingSlot(null);
                                    }}
                                    className="p-2 hover:bg-white/10 rounded-full transition text-white/80 hover:text-white shrink-0 cursor-pointer"
                                    aria-label="Cerrar"
                                >
                                    <X size={22} />
                                </button>
                            </div>
                            
                            <div className="p-6 overflow-y-auto space-y-4">
                                <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 text-xs sm:text-sm text-amber-900 font-medium">
                                    💡 Selecciona la fecha y hora para tu clase. Al confirmar, se consumirá 1 crédito de tu bono automáticamente.
                                </div>

                                <StudentBookingCalendar
                                    teacherId={bookingPackage.teacher_id || TEACHER_ID}
                                    durationMinutes={bookingPackage.duration}
                                    selectedSlot={packageBookingSlot}
                                    onSlotSelect={(slot) => setPackageBookingSlot(slot)}
                                />
                            </div>

                            <div className="p-4 sm:p-5 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3 shrink-0">
                                <button
                                    onClick={() => {
                                        setBookingPackage(null);
                                        setPackageBookingSlot(null);
                                    }}
                                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-200 transition cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleBookPackageCredit}
                                    disabled={!packageBookingSlot || bookingWithCreditLoading}
                                    className="px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white shadow-md shadow-indigo-600/25 transition-all flex items-center gap-2 cursor-pointer"
                                >
                                    {bookingWithCreditLoading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            <span>Reservando...</span>
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 size={16} />
                                            <span>Confirmar Reserva con Crédito</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default DashboardPage;
