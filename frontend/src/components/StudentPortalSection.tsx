import { Link } from 'react-router-dom';
import { 
    GraduationCap, 
    Video, 
    BookOpen, 
    CalendarCheck, 
    TrendingUp, 
    ArrowRight, 
    CheckCircle2, 
    Sparkles, 
    Clock, 
    ExternalLink,
    Calendar
} from 'lucide-react';
import { useLanguage } from '../i18n';

interface StudentPortalSectionProps {
    studentAuth?: { name?: string; email?: string } | null;
}

export const StudentPortalSection = ({ studentAuth }: StudentPortalSectionProps) => {
    const { t } = useLanguage();

    const features = [
        {
            icon: <Video className="text-indigo-600" size={24} />,
            bg: 'bg-indigo-50 border-indigo-100/80',
            title: t('landing.studentPortal.f1.title'),
            desc: t('landing.studentPortal.f1.desc'),
        },
        {
            icon: <BookOpen className="text-emerald-600" size={24} />,
            bg: 'bg-emerald-50 border-emerald-100/80',
            title: t('landing.studentPortal.f2.title'),
            desc: t('landing.studentPortal.f2.desc'),
        },
        {
            icon: <CalendarCheck className="text-purple-600" size={24} />,
            bg: 'bg-purple-50 border-purple-100/80',
            title: t('landing.studentPortal.f3.title'),
            desc: t('landing.studentPortal.f3.desc'),
        },
        {
            icon: <TrendingUp className="text-amber-600" size={24} />,
            bg: 'bg-amber-50 border-amber-100/80',
            title: t('landing.studentPortal.f4.title'),
            desc: t('landing.studentPortal.f4.desc'),
        },
    ];

    return (
        <section id="student-portal" className="max-w-7xl mx-auto mb-20 sm:mb-32 px-4 scroll-mt-24">
            {/* Outer Container with soft gradient & subtle border */}
            <div className="relative rounded-[2.5rem] bg-gradient-to-b from-white via-indigo-50/20 to-white p-6 sm:p-10 md:p-16 border border-indigo-100/80 shadow-2xl overflow-hidden">
                {/* Background decorative ambient orbs */}
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-200/30 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl pointer-events-none" />

                {/* Section Header */}
                <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16 relative z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-100/80 text-indigo-700 text-xs sm:text-sm font-bold uppercase tracking-wider rounded-full border border-indigo-200/80 mb-4 shadow-xs">
                        <GraduationCap size={16} className="text-indigo-600" />
                        <span>{t('landing.studentPortal.badge')}</span>
                    </div>
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 tracking-tight leading-tight mb-4">
                        {t('landing.studentPortal.title')}
                    </h2>
                    <div className="w-20 sm:w-24 h-1.5 bg-indigo-600 mx-auto rounded-full mb-6" />
                    <p className="text-base sm:text-lg md:text-xl text-gray-600 font-medium leading-relaxed">
                        {t('landing.studentPortal.subtitle')}
                    </p>
                </div>

                {/* Main Content Grid: Features (Left) + Interactive Preview Mockup (Right) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
                    {/* Left: 4 Feature Cards + CTA */}
                    <div className="lg:col-span-7 flex flex-col gap-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {features.map((feat, idx) => (
                                <div 
                                    key={idx}
                                    className="bg-white/90 backdrop-blur-sm p-5 sm:p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-300 group"
                                >
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center border mb-4 transition-transform group-hover:scale-105 ${feat.bg}`}>
                                        {feat.icon}
                                    </div>
                                    <h3 className="text-base sm:text-lg font-black text-gray-900 mb-2 leading-snug">
                                        {feat.title}
                                    </h3>
                                    <p className="text-xs sm:text-sm text-gray-600 leading-relaxed font-medium">
                                        {feat.desc}
                                    </p>
                                </div>
                            ))}
                        </div>

                        {/* CTA Buttons Banner */}
                        <div className="mt-4 p-5 sm:p-6 bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-2xl text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="text-center sm:text-left">
                                <div className="flex items-center justify-center sm:justify-start gap-2 text-indigo-100 text-xs font-bold uppercase tracking-wider mb-1">
                                    <Sparkles size={14} className="text-yellow-300" />
                                    <span>{studentAuth ? t('dashboard.studentTitle') : t('landing.studentPortal.badge')}</span>
                                </div>
                                <h4 className="text-lg sm:text-xl font-black">
                                    {studentAuth 
                                        ? `¡Hola ${studentAuth.name || ''}! Tu aula está lista` 
                                        : t('landing.studentPortal.ctaLogin')}
                                </h4>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-2.5 w-full sm:w-auto">
                                {studentAuth ? (
                                    <Link 
                                        to="/dashboard"
                                        className="w-full sm:w-auto px-6 py-3 bg-white text-indigo-700 hover:bg-indigo-50 font-black rounded-xl transition-all shadow-md text-sm text-center flex items-center justify-center gap-2 group cursor-pointer"
                                    >
                                        <span>{t('landing.studentPortal.ctaDashboard')}</span>
                                        <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                                    </Link>
                                ) : (
                                    <>
                                        <Link 
                                            to="/student/login"
                                            className="w-full sm:w-auto px-6 py-3 bg-white text-indigo-700 hover:bg-indigo-50 font-black rounded-xl transition-all shadow-md text-sm text-center flex items-center justify-center gap-2 group cursor-pointer"
                                        >
                                            <span>{t('landing.studentPortal.ctaLogin')}</span>
                                            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                                        </Link>
                                        <a 
                                            href="#book-a-lesson"
                                            className="w-full sm:w-auto px-5 py-3 bg-indigo-500/40 hover:bg-indigo-500/60 text-white font-bold rounded-xl transition text-sm text-center border border-white/20"
                                        >
                                            {t('landing.studentPortal.ctaBook')}
                                        </a>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right: Realistic Interactive Preview Mockup */}
                    <div className="lg:col-span-5">
                        <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-2xl border border-gray-200/80 relative transform hover:-translate-y-1 transition-transform duration-300">
                            {/* Window header */}
                            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-3 h-3 rounded-full bg-rose-400" />
                                    <div className="w-3 h-3 rounded-full bg-amber-400" />
                                    <div className="w-3 h-3 rounded-full bg-emerald-400" />
                                    <span className="ml-2 text-xs font-bold text-gray-500">
                                        {t('landing.studentPortal.previewTag')}
                                    </span>
                                </div>
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span>Sync 24/7</span>
                                </div>
                            </div>

                            {/* Spotlight Card Preview */}
                            <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 rounded-2xl p-5 text-white mb-4 shadow-lg relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl" />
                                
                                <div className="flex items-center justify-between mb-3 relative z-10">
                                    <span className="text-[10px] uppercase tracking-wider font-extrabold text-indigo-300 flex items-center gap-1.5">
                                        <Sparkles size={12} className="text-yellow-400" />
                                        {t('landing.studentPortal.previewNextLesson')}
                                    </span>
                                    <span className="px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 text-[10px] font-bold border border-indigo-400/30">
                                        Mañana · 17:00
                                    </span>
                                </div>

                                <h4 className="text-base sm:text-lg font-black tracking-tight mb-2 relative z-10">
                                    Conversación en Español con Marta
                                </h4>
                                <div className="flex items-center gap-4 text-xs text-indigo-200 mb-4 font-medium relative z-10">
                                    <span className="flex items-center gap-1"><Clock size={13} /> 60 min</span>
                                    <span className="flex items-center gap-1"><CheckCircle2 size={13} className="text-emerald-400" /> Confirmada</span>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-2 relative z-10">
                                    <Link 
                                        to={studentAuth ? "/dashboard" : "/student/login"}
                                        className="flex-1 py-2.5 px-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-md group"
                                    >
                                        <Video size={14} className="text-emerald-300 animate-pulse" />
                                        <span>{t('landing.studentPortal.previewJoin')}</span>
                                        <ExternalLink size={12} className="opacity-70 group-hover:opacity-100" />
                                    </Link>
                                    <button 
                                        type="button"
                                        className="py-2.5 px-3 bg-white/10 hover:bg-white/20 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-1.5 transition border border-white/10"
                                    >
                                        <Calendar size={13} className="text-indigo-300" />
                                        <span>Google Calendar</span>
                                    </button>
                                </div>
                            </div>

                            {/* Marta's Feedback & Notes Preview */}
                            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 mb-4">
                                <div className="flex items-center gap-2 mb-2.5">
                                    <img 
                                        src="/marta-photo.jpg" 
                                        alt="Marta" 
                                        className="w-6 h-6 rounded-full object-cover border border-white shadow-xs" 
                                    />
                                    <span className="text-xs font-black text-gray-800">
                                        {t('landing.studentPortal.previewVocab')}
                                    </span>
                                </div>
                                <div className="space-y-1.5">
                                    <div className="flex items-start gap-1.5 text-xs text-gray-600">
                                        <span className="font-bold text-indigo-600 shrink-0">📖 Vocabulario:</span>
                                        <span className="italic font-medium">{t('landing.studentPortal.previewSampleVocab')}</span>
                                    </div>
                                    <div className="flex items-start gap-1.5 text-xs text-emerald-700 bg-emerald-50/80 px-2 py-1 rounded-lg border border-emerald-100/60 font-medium">
                                        <CheckCircle2 size={13} className="text-emerald-600 shrink-0 mt-0.5" />
                                        <span>{t('landing.studentPortal.previewSampleCorrection')}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Learning Stats Preview */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 text-center">
                                    <span className="block text-lg font-black text-indigo-700">12</span>
                                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                                        {t('landing.studentPortal.previewCompleted')}
                                    </span>
                                </div>
                                <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-100 text-center">
                                    <span className="block text-lg font-black text-purple-700">10.5 h</span>
                                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                                        {t('landing.studentPortal.previewHoursLearned')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
