import { useEffect, useState, type MouseEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Home, ArrowRight, Loader2, Clock, Sparkles } from 'lucide-react';
import { useLanguage } from '../i18n';
import { API_URL } from '../config';

type VerifyState = 'idle' | 'verifying' | 'confirmed' | 'timeout';

export const PaymentSuccess = () => {
    const [searchParams] = useSearchParams();
    const sessionId = searchParams.get('session_id');
    const { t } = useLanguage();

    const [verifyState, setVerifyState] = useState<VerifyState>('idle');
    const [verifyMessage, setVerifyMessage] = useState('');
    const navigate = useNavigate();

    /**
     * Student clicked "Return to main page": ask the backend to verify the
     * payment and email both the student (payment successful) and the teacher
     * (student has paid the lesson). `keepalive` lets the request finish even
     * though we navigate away immediately. The backend only sends once.
     */
    const handleReturnHome = (e: MouseEvent) => {
        e.preventDefault();
        const lessonId = localStorage.getItem('pending_payment_lesson_id');
        if (sessionId || lessonId) {
            fetch(`${API_URL}/lessons/payment-notify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ session_id: sessionId, lesson_id: lessonId }),
                keepalive: true,
            })
                .then(resp => (resp.ok ? resp.json() : null))
                .then(data => {
                    if (data && (data.status === 'sent' || data.status === 'already_sent')) {
                        localStorage.removeItem('pending_payment_lesson_id');
                    }
                })
                .catch(err => console.warn('[PaymentSuccess] payment-notify failed', err));
        }
        navigate('/');
    };

    useEffect(() => {
        if (!sessionId) {
            // No session_id to verify — show the standard success page
            setVerifyState('confirmed');
            return;
        }

        let cancelled = false;
        let attempts = 0;
        const MAX_ATTEMPTS = 10;
        const POLL_INTERVAL_MS = 3000;

        const poll = async () => {
            while (attempts < MAX_ATTEMPTS && !cancelled) {
                attempts++;
                setVerifyState('verifying');

                try {
                    const resp = await fetch(`${API_URL}/lessons/verify-payment/${sessionId}`);
                    if (!resp.ok && resp.status === 400) {
                        // Session may be invalid/expired — stop polling
                        if (!cancelled) {
                            setVerifyState('confirmed'); // show success anyway (payment did go through)
                            setVerifyMessage('');
                        }
                        return;
                    }

                    const data = await resp.json();

                    if (data.status === 'confirmed') {
                        if (!cancelled) {
                            setVerifyState('confirmed');
                            setVerifyMessage(data.message || '');
                        }
                        return;
                    }

                    if (data.status === 'pending') {
                        // Payment not yet completed — keep polling
                        if (!cancelled) {
                            setVerifyMessage(data.message || '');
                        }
                    }
                } catch (err) {
                    // Network error — retry on next interval
                    console.warn('[PaymentSuccess] Verification poll failed, retrying...', err);
                }

                // Wait before next poll
                await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
            }

            // Max attempts reached
            if (!cancelled) {
                setVerifyState('timeout');
            }
        };

        poll();

        return () => {
            cancelled = true;
        };
    }, [sessionId]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-green-50/70 via-white to-indigo-50/30 px-4 sm:px-6 text-center py-12 sm:py-16">
            <Link to="/" className="mb-6 hover:opacity-90 transition inline-block">
                <img src="/logo.png" alt="Marta Spanish Teacher" className="h-16 w-auto object-contain mx-auto" />
            </Link>

            {/* Verification indicator */}
            {verifyState === 'verifying' && (
                <div className="flex flex-col items-center gap-4 mb-8 bg-white p-8 rounded-3xl shadow-xl border border-amber-100 max-w-md w-full">
                    <div className="w-16 h-16 rounded-full bg-amber-50 border-2 border-amber-200 flex items-center justify-center">
                        <Loader2 size={32} className="text-amber-500 animate-spin" />
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                        {t('payment.success.verifying')}
                    </h1>
                    <p className="text-sm text-gray-500 max-w-sm">
                        {t('payment.success.verifyingSubtitle')}
                    </p>
                    {verifyMessage && (
                        <p className="text-xs text-gray-400 animate-pulse font-medium">{verifyMessage}</p>
                    )}
                </div>
            )}

            {/* Confirmed state */}
            {(verifyState === 'confirmed' || verifyState === 'idle') && (
                <div className="flex flex-col items-center max-w-xl w-full">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100/80 text-emerald-800 rounded-full font-bold text-xs uppercase tracking-wider mb-5">
                        <Sparkles size={15} className="text-emerald-600" />
                        {t('payment.success.badge')}
                    </div>

                    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-tr from-emerald-500 to-green-400 text-white rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/25 mb-6">
                        <CheckCircle size={44} className="stroke-[2.5]" />
                    </div>

                    <h1 className="text-3xl sm:text-5xl font-black text-gray-900 mb-4 tracking-tight">
                        {t('payment.success.title')}
                    </h1>

                    <p className="text-base sm:text-lg text-gray-600 mb-8 max-w-lg mx-auto font-medium leading-relaxed">
                        {t('payment.success.subtitle')}
                    </p>

                    {/* Next steps checklist */}
                    <div className="bg-emerald-50/70 border border-emerald-100 rounded-3xl p-6 sm:p-8 mb-6 w-full text-left">
                        <h4 className="font-black text-emerald-900 text-xs sm:text-sm uppercase tracking-wider mb-3 flex items-center gap-2">
                            <span>📋</span> {t('payment.success.nextStepsTitle')}
                        </h4>
                        <ul className="space-y-2.5 text-xs sm:text-sm text-emerald-950/80 font-medium">
                            <li className="flex items-start gap-2.5">
                                <span className="text-emerald-600 font-bold shrink-0">✓</span>
                                <span>{t('payment.success.step1')}</span>
                            </li>
                            <li className="flex items-start gap-2.5">
                                <span className="text-emerald-600 font-bold shrink-0">✓</span>
                                <span>{t('payment.success.step2')}</span>
                            </li>
                            <li className="flex items-start gap-2.5">
                                <span className="text-emerald-600 font-bold shrink-0">✓</span>
                                <span>{t('payment.success.step3')}</span>
                            </li>
                        </ul>
                    </div>

                    <p className="text-xs sm:text-sm text-gray-500 font-medium mb-8 max-w-md">
                        📩 {t('payment.success.emailNotice')}
                    </p>
                </div>
            )}

            {/* Timeout state — payment went through but we couldn't verify immediately */}
            {verifyState === 'timeout' && (
                <div className="flex flex-col items-center max-w-xl w-full">
                    <Clock size={72} className="text-amber-500 mb-6" />
                    <h1 className="text-3xl sm:text-5xl font-black text-gray-900 mb-4 tracking-tight">
                        {t('payment.success.title')}
                    </h1>
                    <p className="text-base sm:text-lg text-gray-600 mb-8 max-w-lg mx-auto font-medium leading-relaxed">
                        {t('payment.success.verifyingTimeout')}
                    </p>

                    <p className="text-xs sm:text-sm text-gray-500 font-medium mb-8 max-w-md">
                        📩 {t('payment.success.emailNotice')}
                    </p>
                </div>
            )}

            {sessionId && (
                <div className="bg-white/80 px-4 py-2 rounded-xl text-xs font-mono text-gray-400 mb-8 border border-gray-200">
                    ID: {sessionId}
                </div>
            )}

            {/* Navigation button: Volver a la página principal en color */}
            <div className="w-full max-w-md flex justify-center">
                <Link 
                    to="/" 
                    id="payment-success-return-home"
                    onClick={handleReturnHome}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-10 py-4.5 bg-indigo-600 hover:bg-indigo-700 text-white text-lg font-bold rounded-2xl shadow-xl shadow-indigo-600/30 hover:-translate-y-0.5 transition-all active:scale-95"
                >
                    <Home size={22} />
                    {t('payment.success.home')}
                </Link>
            </div>
        </div>
    );
};

export const PaymentCancelled = () => {
    const { t } = useLanguage();

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-red-50 px-4 sm:px-6 text-center py-12">
            <Link to="/" className="mb-6 hover:opacity-90 transition inline-block">
                <img src="/logo.png" alt="Marta Spanish Teacher" className="h-16 w-auto object-contain mx-auto" />
            </Link>
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
