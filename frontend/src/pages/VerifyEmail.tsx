import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2, ArrowRight, BookOpen, Mail, RefreshCw } from 'lucide-react';
import { API_URL } from '../config';
import { useToast } from '../components/Toast';

const VerifyEmail = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();
    const { addToast } = useToast();

    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('');
    const [resendEmail, setResendEmail] = useState('');
    const [resending, setResending] = useState(false);
    const [resendSuccess, setResendSuccess] = useState(false);

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('No verification token provided. Please check the link from your email.');
            return;
        }

        const verifyToken = async () => {
            try {
                const res = await fetch(`${API_URL}/students/verify-email`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token }),
                });

                const data = await res.json();

                if (!res.ok) {
                    setStatus('error');
                    setMessage(data.detail || 'Verification failed. The link may have expired or already been used.');
                    return;
                }

                // If verification returned an access token, save auth state
                if (data.access_token) {
                    localStorage.setItem('student_auth', JSON.stringify(data));
                }

                setStatus('success');
                setMessage(data.message || 'Your email address has been successfully verified!');
                addToast('success', 'Email verified successfully! Welcome.');

                // Redirect to dashboard after 3 seconds
                setTimeout(() => {
                    navigate('/dashboard');
                }, 3000);
            } catch (err: any) {
                setStatus('error');
                setMessage('Could not connect to the verification service. Please try again.');
            }
        };

        verifyToken();
    }, [token, navigate, addToast]);

    const handleResend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!resendEmail) return;

        setResending(true);
        try {
            const res = await fetch(`${API_URL}/students/resend-verification`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: resendEmail }),
            });
            const data = await res.json();
            setResendSuccess(true);
            addToast('info', data.message || 'Verification link sent if account exists.');
        } catch {
            addToast('error', 'Failed to send verification email. Please try again.');
        } finally {
            setResending(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4 sm:p-6">
            <div className="w-full max-w-md">
                <div className="text-center mb-6 sm:mb-10">
                    <Link to="/" className="inline-flex items-center gap-2 text-indigo-600 font-black text-xl sm:text-2xl tracking-tighter uppercase hover:text-indigo-700 transition">
                        <BookOpen size={24} />
                        SPANISH WITH MARTA
                    </Link>
                </div>

                <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-100 p-6 sm:p-10 text-center">
                    {status === 'loading' && (
                        <div className="py-8 space-y-4">
                            <div className="flex justify-center">
                                <Loader2 size={48} className="animate-spin text-indigo-600" />
                            </div>
                            <h2 className="text-2xl font-black text-gray-900">Verifying Your Email</h2>
                            <p className="text-gray-500 font-medium text-sm">
                                Please wait while we verify your account...
                            </p>
                        </div>
                    )}

                    {status === 'success' && (
                        <div className="py-6 space-y-5">
                            <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                                <CheckCircle2 size={36} />
                            </div>
                            <h2 className="text-2xl font-black text-gray-900">Account Verified! 🎉</h2>
                            <p className="text-gray-600 font-medium text-sm sm:text-base leading-relaxed">
                                {message}
                            </p>
                            <p className="text-xs text-indigo-600 font-bold animate-pulse">
                                Redirecting to your dashboard in a few seconds...
                            </p>
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-base shadow-xl hover:bg-indigo-700 hover:shadow-indigo-500/30 transition-all flex items-center justify-center gap-2 mt-4"
                            >
                                Continue to Dashboard
                                <ArrowRight size={18} />
                            </button>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="py-4 space-y-5">
                            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                                <XCircle size={36} />
                            </div>
                            <h2 className="text-2xl font-black text-gray-900">Verification Failed</h2>
                            <p className="text-gray-600 font-medium text-sm leading-relaxed">
                                {message}
                            </p>

                            <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 text-left space-y-3 mt-4">
                                <p className="text-xs font-black uppercase tracking-wider text-gray-400">
                                    Need a new verification link?
                                </p>
                                {resendSuccess ? (
                                    <div className="bg-green-50 text-green-700 text-sm font-bold p-3 rounded-xl border border-green-100 text-center">
                                        Check your email for the new verification link.
                                    </div>
                                ) : (
                                    <form onSubmit={handleResend} className="space-y-3">
                                        <div className="relative">
                                            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input
                                                type="email"
                                                required
                                                placeholder="you@email.com"
                                                value={resendEmail}
                                                onChange={(e) => setResendEmail(e.target.value)}
                                                className="w-full pl-10 pr-3 py-2.5 bg-white rounded-xl border border-gray-200 text-sm font-bold text-gray-700 outline-none focus:border-indigo-600"
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={resending}
                                            className="w-full py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            {resending ? <RefreshCw size={14} className="animate-spin" /> : null}
                                            {resending ? 'Sending...' : 'Resend Verification Email'}
                                        </button>
                                    </form>
                                )}
                            </div>

                            <div className="pt-2">
                                <Link
                                    to="/student/login"
                                    className="text-sm font-bold text-indigo-600 hover:text-indigo-700 transition"
                                >
                                    Back to Student Sign In
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VerifyEmail;
