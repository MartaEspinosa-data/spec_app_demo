import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { teacherService } from '../services/teacherService';
import type { Teacher } from '../services/teacherService';
import TeacherProfile from '../components/TeacherProfile';
import { ChevronLeft, ArrowRight, Calendar, Star } from 'lucide-react';
import { useLanguage } from '../i18n';
import LanguageSelector from '../components/LanguageSelector';

const ProfilePage = () => {
    const { id } = useParams<{ id: string }>();
    const [teacher, setTeacher] = useState<Teacher | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { t } = useLanguage();

    useEffect(() => {
        const fetchTeacher = async () => {
            try {
                const list = await teacherService.getTeachers();
                if (id) {
                    const found = list.find(x => x.id === id);
                    setTeacher(found || list[0]);
                } else {
                    setTeacher(list[0]);
                }
            } catch (err) {
                console.error(err);
                setError("Failed to load teacher profile.");
            } finally {
                setLoading(false);
            }
        };
        fetchTeacher();
    }, [id]);

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="text-2xl font-black text-indigo-600 animate-pulse uppercase tracking-widest">{t('profile.loading')}</div>
        </div>
    );

    if (error || !teacher) return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 flex-col gap-6 p-8">
            <h1 className="text-4xl font-black text-red-500 shadow-md p-4 bg-white rounded-xl">{t('profile.notFound')}</h1>
            <Link to="/" className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-full transition-all hover:bg-indigo-700 shadow-lg">{t('profile.returnHome')}</Link>
        </div>
    );

    return (
        <div className="bg-[#f8fafc] min-h-screen pb-32">
            <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
                    <Link to="/" className="text-gray-500 hover:text-indigo-600 transition flex items-center gap-1 font-bold tracking-tight text-sm sm:text-base">
                        <ChevronLeft size={18} />
                        <span className="hidden sm:inline">{t('profile.back')}</span>
                    </Link>
                    <div className="flex items-center gap-2 sm:gap-4">
                        <div className="hidden md:flex items-center gap-1 text-yellow-500">
                            <Star size={18} fill="currentColor" />
                            <Star size={18} fill="currentColor" />
                            <Star size={18} fill="currentColor" />
                            <Star size={18} fill="currentColor" />
                            <Star size={18} fill="currentColor" />
                            <span className="text-gray-500 font-bold ml-1">{t('profile.rating')}</span>
                        </div>
                        <LanguageSelector />
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12">
                <TeacherProfile teacher={teacher} />

                <div className="mt-12 sm:mt-16 text-center">
                    <h3 className="text-3xl sm:text-4xl font-black text-gray-900 mb-4 sm:mb-6 drop-shadow-sm">{t('profile.cta.title')}</h3>
                    <p className="text-base sm:text-lg text-gray-600 mb-8 sm:mb-10 max-w-xl mx-auto font-medium">{t('profile.cta.subtitle', { name: teacher.name })}</p>
                    <Link to={`/book/${teacher.id}`} className="inline-flex items-center gap-3 sm:gap-4 px-8 sm:px-12 py-4 sm:py-6 bg-indigo-600 text-white text-xl sm:text-2xl font-black rounded-2xl sm:rounded-3xl hover:bg-indigo-700 transition-all shadow-2xl hover:shadow-indigo-400/40 hover:-translate-y-1 active:scale-95 group">
                        <Calendar size={24} />
                        {t('profile.cta.button')}
                        <ArrowRight size={28} className="transition-transform group-hover:translate-x-1" />
                    </Link>
                </div>
            </main>
        </div>
    );
};

export default ProfilePage;
