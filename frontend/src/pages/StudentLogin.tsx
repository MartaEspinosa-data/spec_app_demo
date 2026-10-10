import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight, BookOpen, RefreshCw } from 'lucide-react';
import { API_URL } from '../config';
import { useToast } from '../components/Toast';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';

const StudentLogin = () => {
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [isRegister, setIsRegister] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({ name: '', email: '', password: '' });

    // Email verification state
    const [registeredEmail, setRegisteredEmail] = useState('');
    const [isUnverified, setIsUnverified] = useState(false);
    const [resending, setResending] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsUnverified(false);
        setLoading(true);

        try {
            const endpoint = isRegister ? `${API_URL}/students/register` : `${API_URL}/students/login`;
            const body = isRegister
                ? { name: form.name, email: form.email, password: form.password }
                : { email: form.email, password: form.password };

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            const data = await res.json();

            if (!res.ok) {
                const msg = data.detail || 'Authentication failed';
                setError(msg);
                if (res.status === 403 && msg.toLowerCase().includes('verify')) {
                    setIsUnverified(true);
                }
                addToast('error', msg);
                setLoading(false);
                return;
            }

            if (isRegister) {
                // Registration succeeded — prompt the user to check their email
                setRegisteredEmail(form.email);
                addToast('info', 'Verification link sent! Please check your email.');
                setLoading(false);
                return;
            }

            // Normal login succeeded
            localStorage.setItem('student_auth', JSON.stringify(data));
            addToast('success', 'Welcome back!');
            navigate('/dashboard');
        } catch (err: any) {
            const msg = err.message || 'Connection error. Please try again.';
            setError(msg);
            addToast('error', msg);
            setLoading(false);
        }
    };

    const handleResendVerification = async (targetEmail?: string) => {
        const emailToSend = targetEmail || registeredEmail || form.email;
        if (!emailToSend) return;

        setResending(true);
        try {
            const res = await fetch(`${API_URL}/students/resend-verification`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: emailToSend }),
            });
            const data = await res.json();
            addToast('info', data.message || 'Verification link sent!');
        } catch {
            addToast('error', 'Failed to resend verification email.');
        } finally {
            setResending(false);
        }
    };

    const handleGoogleSuccess = async (credentialResponse: any) => {
        setLoading(true);
        setError('');
        try {
            const decoded: any = jwtDecode(credentialResponse.credential);

            const res = await fetch(`${API_URL}/students/google-login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token: credentialResponse.credential,
                    email: decoded.email,
                    name: decoded.name,
                    google_id: decoded.sub
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                const msg = data.detail || 'Google Login failed';
                setError(msg);
                addToast('error', msg);
                setLoading(false);
                return;
            }

            const data = await res.json();
            // Store full response including access_token for JWT auth
            localStorage.setItem('student_auth', JSON.stringify(data));
            addToast('success', 'Welcome! You are now signed in.');
            navigate('/dashboard');
        } catch (err: any) {
            const msg = err.message || 'Connection error. Please try again.';
            setError(msg);
            addToast('error', msg);
            setLoading(false);
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
                    <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mt-4 sm:mt-6 mb-2">
                        {registeredEmail ? 'Check Your Email' : isRegister ? 'Create Account' : 'Student Login'}
                    </h1>
                    <p className="text-gray-500 font-medium text-sm sm:text-base">
                        {registeredEmail
                            ? 'Verify that your account exists to finish setup'
                            : isRegister
                                ? 'Sign up to book and track your lessons'
                                : 'Access your booked lessons'}
                    </p>
                </div>

                <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-100 p-5 sm:p-8">
                    {registeredEmail ? (
                        <div className="text-center py-4 space-y-6">
                            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                                <Mail size={32} />
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-xl font-black text-gray-900">Verification Link Sent</h3>
                                <p className="text-sm text-gray-600 leading-relaxed">
                                    We've sent a verification link to{' '}
                                    <strong className="text-gray-900 font-bold">{registeredEmail}</strong>.
                                </p>
                                <p className="text-xs text-gray-400">
                                    Please check your inbox (and spam folder) and click the link to verify your account.
                                </p>
                            </div>

                            <div className="pt-2 space-y-3">
                                <button
                                    onClick={() => handleResendVerification(registeredEmail)}
                                    disabled={resending}
                                    className="w-full py-3.5 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-2xl font-bold text-sm transition flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {resending ? <RefreshCw size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                                    {resending ? 'Sending...' : 'Resend Verification Email'}
                                </button>

                                <button
                                    onClick={() => {
                                        setRegisteredEmail('');
                                        setIsRegister(false);
                                        setError('');
                                    }}
                                    className="w-full py-3.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-2xl font-bold text-sm shadow-lg hover:shadow-indigo-500/30 transition"
                                >
                                    Back to Sign In
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            {error && (
                                <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 font-bold text-sm text-center border border-red-100 space-y-2">
                                    <div>{error}</div>
                                    {isUnverified && (
                                        <button
                                            type="button"
                                            onClick={() => handleResendVerification(form.email)}
                                            disabled={resending}
                                            className="text-xs font-black uppercase tracking-wider text-indigo-600 hover:text-indigo-800 underline inline-flex items-center gap-1 mt-1"
                                        >
                                            {resending ? 'Sending...' : 'Click here to resend verification link'}
                                        </button>
                                    )}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-5">
                                {isRegister && (
                                    <div className="space-y-2">
                                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                                        <div className="relative">
                                            <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input
                                                required
                                                type="text"
                                                placeholder="Your name"
                                                value={form.name}
                                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                                className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-indigo-600 focus:bg-white transition-all outline-none font-bold text-gray-700"
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Email</label>
                                    <div className="relative">
                                        <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            required
                                            type="email"
                                            placeholder="you@email.com"
                                            value={form.email}
                                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                                            className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-indigo-600 focus:bg-white transition-all outline-none font-bold text-gray-700"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Password</label>
                                    <div className="relative">
                                        <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            required
                                            type="password"
                                            placeholder="••••••••"
                                            value={form.password}
                                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                                            className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-indigo-600 focus:bg-white transition-all outline-none font-bold text-gray-700"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-xl hover:bg-indigo-700 hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                                >
                                    {loading ? 'Loading...' : (
                                        <>
                                            {isRegister ? 'Create Account' : 'Sign In'}
                                            <ArrowRight size={20} />
                                        </>
                                    )}
                                </button>
                            </form>

                            <div className="relative my-8">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-100"></div>
                                </div>
                                <div className="relative flex justify-center text-xs uppercase font-black tracking-widest">
                                    <span className="bg-white px-4 text-gray-400">or continue with</span>
                                </div>
                            </div>

                            <div className="flex justify-center">
                                <GoogleLogin
                                    onSuccess={handleGoogleSuccess}
                                    onError={() => setError('Google Login failed')}
                                    useOneTap
                                    theme="outline"
                                    shape="pill"
                                    size="large"
                                    width="100%"
                                />
                            </div>

                            <div className="mt-8 text-center space-y-3">
                                <button
                                    onClick={() => { setIsRegister(!isRegister); setError(''); setIsUnverified(false); }}
                                    className="text-sm font-bold text-indigo-600 hover:text-indigo-700 transition"
                                >
                                    {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
                                </button>
                                {!isRegister && (
                                    <div>
                                        <Link
                                            to="/student/forgot-password"
                                            className="text-sm font-bold text-gray-400 hover:text-indigo-600 transition"
                                        >
                                            Forgot your password?
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StudentLogin;
