import { Link } from 'react-router-dom';
import { Home, Compass } from 'lucide-react';
import { useLanguage } from '../i18n';

const NotFound = () => {
    const { t } = useLanguage();

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-center px-6">
            <div className="text-9xl font-black text-indigo-600 drop-shadow-2xl mb-8 animate-bounce opacity-10">404</div>
            <div className="relative -mt-32 mb-12">
                <Compass size={120} className="text-indigo-600 animate-[spin_5s_linear_infinite]" />
            </div>
            <h1 className="text-5xl font-black text-gray-900 mb-6 tracking-tight">{t('notfound.title')}</h1>
            <p className="text-xl text-gray-600 mb-12 max-w-md mx-auto font-medium">
                {t('notfound.subtitle')}
            </p>
            <Link
                to="/"
                className="flex items-center gap-3 px-10 py-5 bg-indigo-600 text-white text-xl font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-xl hover:shadow-indigo-400/30 active:scale-95 group"
            >
                <Home size={24} className="group-hover:-translate-y-0.5" />
                {t('notfound.returnHome')}
            </Link>
        </div>
    );
};

export default NotFound;
