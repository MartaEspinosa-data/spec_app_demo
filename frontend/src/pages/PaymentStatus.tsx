import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Home, ArrowRight, Video, Loader2, Clock } from 'lucide-react';
import { useLanguage } from '../i18n';
import { API_URL } from '../config';

const GOOGLE_MEET_LINK = "https://meet.google.com/pyv-dxwi-mxc";

type VerifyState = 'idle' | 'verifying' | 'confirmed' | 'timeout';

export const PaymentSuccess = () => {
    const [searchParams] = useSearchParams();
    const sessionId = searchParams.get('session_id');
    const { t } = useLanguage();

    const [verifyState, setVerifyState] = useState<VerifyState>('idle');
    const [verifyMessage, setVerifyMessage] = useState('');

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
        <div className="flex flex-col items-center justify-center min-h-screen bg-green-50 px-4 sm:px-6 text-center">
            {/* Verification indicator */}
            {verifyState === 'verifying' && (
                <div className="flex flex-col items-center gap-4 mb-8">
                    <div className="w-16 h-16 rounded-full bg-amber-50 border-2 border-amber-200 flex items-center justify-center">
                        <Loader2 size={32} className="text-amber-500 animate-spin" />
                    </div>
                    <h1 className="text-2xl sm:text-4xl font-black text-gray-900 tracking-tight">
                        {t('payment.success.verifying')}
                    </h1>
                    <p className="text-sm sm:text-base text-gray-500 max-w-sm">
                        {t('payment.success.verifyingSubtitle')}
                    </p>
                    {verifyMessage && (
                        <p className="text-xs text-gray-400 animate-pulse">{verifyMessage}</p>
                    )}
                </div>
            )}

            {/* Confirmed state */}
            {(verifyState === 'confirmed' || verifyState === 'idle') && (
                <>
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
                </>
            )}

            {/* Timeout state — payment went through but we couldn't verify */}
            {verifyState === 'timeout' && (
                <>
                    <Clock size={80} className="text-amber-500 mb-6 sm:mb-8" />
                    <h1 className="text-3xl sm:text-5xl font-black text-gray-900 mb-4 tracking-tight">{t('payment.success.title')}</h1>
                    <p className="text-base sm:text-xl text-gray-600 mb-6 sm:mb-8 max-w-md mx-auto font-medium px-2">
                        {t('payment.success.verifyingTimeout')}
                    </p>

                    {/* Google Meet Link Card */}
                    <div className="bg-white p-8 rounded-3xl shadow-xl border border-amber-100 mb-8 max-w-md w-full">
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
                        📧 A confirmation email with the lesson link will be sent to your inbox shortly.
                    </p>
                </>
            )}

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
