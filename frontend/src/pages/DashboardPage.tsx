import { Link } from 'react-router-dom';
import { Calendar, BookOpen, Clock, Settings } from 'lucide-react';
import { useLanguage } from '../i18n';
import LanguageSelector from '../components/LanguageSelector';

const DashboardPage = () => {
    const { t } = useLanguage();

    const navItems = [
        { name: t('dashboard.lessons'), icon: <Calendar size={20} />, active: true },
        { name: t('dashboard.materials'), icon: <BookOpen size={20} /> },
        { name: t('dashboard.progress'), icon: <Clock size={20} /> },
        { name: t('dashboard.settings'), icon: <Settings size={20} /> }
    ];

    return (
        <div className="flex min-h-screen bg-gray-50">
            <aside className="w-64 bg-white border-r border-gray-200 p-6 flex flex-col gap-8">
                <div className="flex items-center justify-between">
                    <div className="text-xl font-black text-indigo-600 tracking-tighter uppercase">{t('dashboard.brand')}</div>
                    <LanguageSelector />
                </div>
                <nav className="flex flex-col gap-2">
                    {navItems.map((item, i) => (
                        <button key={i} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${item.active ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500 hover:bg-gray-50'}`}>
                            {item.icon}
                            {item.name}
                        </button>
                    ))}
                </nav>
            </aside>

            <main className="flex-1 p-12">
                <header className="mb-12">
                    <h1 className="text-4xl font-black text-gray-900 mb-2">{t('dashboard.title')}</h1>
                    <p className="text-gray-500 font-medium">{t('dashboard.subtitle')}</p>
                </header>

                <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-20 text-center">
                    <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-8 text-gray-300">
                        <Calendar size={48} />
                    </div>
                    <h2 className="text-2xl font-black text-gray-800 mb-4">{t('dashboard.empty.title')}</h2>
                    <p className="text-gray-500 max-w-sm mx-auto mb-10 font-medium">{t('dashboard.empty.subtitle')}</p>
                    <Link to="/" className="px-10 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition shadow-xl">
                        {t('dashboard.browseTeachers')}
                    </Link>
                </div>
            </main>
        </div>
    );
};

export default DashboardPage;
