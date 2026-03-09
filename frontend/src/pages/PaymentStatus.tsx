import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Home, ArrowRight } from 'lucide-react';
import { useLanguage } from '../i18n';

export const PaymentSuccess = () => {
    const [searchParams] = useSearchParams();
    const sessionId = searchParams.get('session_id');
    const { t } = useLanguage();

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-green-50 px-6 text-center">
            <CheckCircle size={100} className="text-green-500 mb-8 animate-bounce" />
            <h1 className="text-5xl font-black text-gray-900 mb-4 tracking-tight">{t('payment.success.title')}</h1>
            <p className="text-xl text-gray-600 mb-12 max-w-md mx-auto font-medium">
                {t('payment.success.subtitle')}
            </p>
            {sessionId && (
                <div className="bg-white p-4 rounded-xl shadow-inner mb-12 font-mono text-sm text-gray-400 border border-green-100">
                    ID: {sessionId}
                </div>
            )}
            <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/dashboard" className="flex items-center gap-3 px-10 py-5 bg-indigo-600 text-white text-xl font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-xl hover:shadow-indigo-400/30 active:scale-95 group">
                    <Home size={24} />
                    {t('payment.success.dashboard')}
                </Link>
                <Link to="/" className="flex items-center gap-3 px-10 py-5 bg-white text-gray-700 text-xl font-bold rounded-2xl hover:bg-gray-100 transition-all shadow-md active:scale-95">
                    {t('payment.success.home')}
                </Link>
            </div>
        </div>
    );
};

export const PaymentCancelled = () => {
    const { t } = useLanguage();

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-red-50 px-6 text-center">
            <XCircle size={100} className="text-red-500 mb-8" />
            <h1 className="text-5xl font-black text-gray-900 mb-4 tracking-tight">{t('payment.cancelled.title')}</h1>
            <p className="text-xl text-gray-600 mb-12 max-w-md mx-auto font-medium">
                {t('payment.cancelled.subtitle')}
            </p>
            <Link to="/" className="flex items-center gap-3 px-10 py-5 bg-indigo-600 text-white text-xl font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-xl hover:shadow-indigo-400/30 active:scale-95 group">
                <ArrowRight size={24} />
                {t('payment.cancelled.retry')}
            </Link>
        </div>
    );
};
