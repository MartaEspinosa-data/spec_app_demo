import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Home, ArrowRight, Video } from 'lucide-react';
import { useLanguage } from '../i18n';

const GOOGLE_MEET_LINK = "https://meet.google.com/pyv-dxwi-mxc";

export const PaymentSuccess = () => {
    const [searchParams] = useSearchParams();
    const sessionId = searchParams.get('session_id');
    const { t } = useLanguage();

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-green-50 px-4 sm:px-6 text-center">
            <CheckCircle size={80} className="text-green-500 mb-6 sm:mb-8 animate-bounce" />
            <h1 className="text-3xl sm:text-5xl font-black text-gray-900 mb-4 tracking-tight">{t('payment.success.title')}</h1>
            <p className="text-base sm:text-xl text-gray-600 mb-6 sm:mb-8 max-w-md mx-auto font-medium px-2">
                {t('payment.success.subtitle')}
            </p>

            {/* Google Meet Link Card */}
            <div className="bg-white p-8 rounded-3xl shadow-xl border border-green-100 mb-8 max-w-md w-full">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center">
                        <Video size={24} className="text-indigo-600" />
                    </div>
                    <div className="text-left">
                        <h3 className="font-black text-gray-900">Your Lesson Link</h3>
                        <p className="text-sm text-gray-500">Use this link to join your lesson</p>
                    </div>
                </div>
                <a 
                    href={GOOGLE_MEET_LINK}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg shadow-lg hover:bg-indigo-700 hover:shadow-indigo-500/40 hover:-translate-y-1 transition-all active:scale-95 flex items-center justify-center gap-3"
                >
                    📹 Join Google Meet
                </a>
                <p className="text-xs text-gray-400 mt-3 font-mono break-all">{GOOGLE_MEET_LINK}</p>
            </div>

            <p className="text-sm text-gray-500 font-medium mb-8 max-w-md">
                📧 A confirmation email with the lesson link has been sent to your inbox.
            </p>

            {sessionId && (
                <div className="bg-white p-4 rounded-xl shadow-inner mb-8 font-mono text-sm text-gray-400 border border-green-100">
                    ID: {sessionId}
                </div>
            )}
            <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/" className="flex items-center gap-3 px-10 py-5 bg-white text-gray-700 text-xl font-bold rounded-2xl hover:bg-gray-100 transition-all shadow-md active:scale-95">
                    <Home size={24} />
                    {t('payment.success.home')}
                </Link>
            </div>
        </div>
    );
};

export const PaymentCancelled = () => {
    const { t } = useLanguage();

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-red-50 px-4 sm:px-6 text-center">
            <XCircle size={80} className="text-red-500 mb-6 sm:mb-8" />
            <h1 className="text-3xl sm:text-5xl font-black text-gray-900 mb-4 tracking-tight">{t('payment.cancelled.title')}</h1>
            <p className="text-base sm:text-xl text-gray-600 mb-8 sm:mb-12 max-w-md mx-auto font-medium px-2">
                {t('payment.cancelled.subtitle')}
            </p>
            <Link to="/" className="flex items-center gap-3 px-10 py-5 bg-indigo-600 text-white text-xl font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-xl hover:shadow-indigo-400/30 active:scale-95 group">
                <ArrowRight size={24} />
                {t('payment.cancelled.retry')}
            </Link>
        </div>
    );
};
