import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Mail, ArrowLeft, KeyRound } from 'lucide-react';
import { API_URL } from '../config';
import { useToast } from '../components/Toast';

interface ForgotPasswordProps {
    role: 'student' | 'teacher';
}

const ForgotPassword = ({ role }: ForgotPasswordProps) => {
    const [searchParams] = useSearchParams();
    const initialToken = searchParams.get('token') || '';
    const isReset = !!initialToken; // If token is in URL, we're resetting

    const [email, setEmail] = useState('');
    const [token, setToken] = useState(initialToken);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const navigate = useNavigate();
    const { addToast } = useToast();

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            const endpoint = role === 'student'
                ? `${API_URL}/students/forgot-password`
                : `${API_URL}/teachers/forgot-password`;

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.detail || 'Something went wrong. Please try again.');
                addToast('error', data.detail || 'Something went wrong.');
                setLoading(false);
                return;
            }

            setSuccess(data.message || 'If an account exists, a reset link has been sent.');
            addToast('success', 'Reset link sent! Check your email.');
        } catch (err: any) {
            setError(err.message || 'Connection error. Please try again.');
            addToast('error', err.message || 'Connection error.');
        }
        setLoading(false);
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setLoading(true);

        try {
            const endpoint = role === 'student'
                ? `${API_URL}/students/reset-password`
                : `${API_URL}/teachers/reset-password`;

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, new_password: newPassword }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.detail || 'Invalid or expired reset token.');
                addToast('error', data.detail || 'Reset failed.');
                setLoading(false);
                return;
            }

            setSuccess(data.message || 'Password reset successfully!');
            addToast('success', 'Password reset successfully! You can now log in.');

            // Redirect to login after 2 seconds
            setTimeout(() => {
                navigate(role === 'student' ? '/student/login' : '/teacher/login');
            }, 2000);
        } catch (err: any) {
            setError(err.message || 'Connection error. Please try again.');
            addToast('error', err.message || 'Connection error.');
        }
        setLoading(false);
    };

    const roleLabel = role === 'student' ? 'Student' : 'Teacher';
    const loginPath = role === 'student' ? '/student/login' : '/teacher/login';

    return (
        <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center p-4">
            <div className="bg-white p-6 sm:p-10 rounded-2xl sm:rounded-[2.5rem] shadow-2xl border border-gray-100 w-full max-w-md relative overflow-hidden">
                <div className="relative z-10">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6 sm:mb-8 mx-auto shadow-inner">
                        <KeyRound size={28} className="text-indigo-600" />
                    </div>

                    <h1 className="text-2xl sm:text-3xl font-black text-center text-gray-900 mb-2">
                        {isReset ? 'Reset Password' : 'Forgot Password'}
                    </h1>
                    <p className="text-center text-gray-500 font-medium text-sm sm:text-base mb-6 sm:mb-8">
                        {isReset
                            ? 'Enter your new password below.'
                            : `Enter your ${roleLabel.toLowerCase()} email and we'll send you a reset link.`}
                    </p>

                    {success && (
                        <div className="bg-green-50 text-green-700 p-4 rounded-xl mb-6 font-bold text-sm text-center border border-green-100">
                            {success}
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 font-bold text-sm text-center border border-red-100">
                            {error}
                        </div>
                    )}

                    {!isReset ? (
                        /* ---- Step 1: Forgot Password Form ---- */
                        <form onSubmit={handleForgotPassword} className="flex flex-col gap-6">
                            <div className="space-y-2">
                                <label className="block text-sm font-black text-gray-400 uppercase tracking-widest ml-1">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                    <input
                                        required
                                        type="email"
                                        className="w-full pl-12 pr-6 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-indigo-600 focus:bg-white transition-all outline-none font-bold text-gray-700"
                                        placeholder={role === 'teacher' ? 'marta@...' : 'you@email.com'}
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-xl hover:bg-indigo-700 hover:shadow-indigo-500/40 hover:-translate-y-1 transition-all active:scale-95 mt-2 disabled:opacity-50"
                            >
                                {loading ? 'Sending...' : 'Send Reset Link'}
                            </button>

                            <Link
                                to={loginPath}
                                className="flex items-center justify-center gap-2 text-sm font-bold text-gray-400 hover:text-indigo-600 transition"
                            >
                                <ArrowLeft size={16} />
                                Back to {roleLabel} Login
                            </Link>
                        </form>
                    ) : (
                        /* ---- Step 2: Reset Password Form ---- */
                        <form onSubmit={handleResetPassword} className="flex flex-col gap-6">
                            <div className="space-y-2">
                                <label className="block text-sm font-black text-gray-400 uppercase tracking-widest ml-1">
                                    New Password
                                </label>
                                <div className="relative">
                                    <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                    <input
                                        required
                                        type="password"
                                        className="w-full pl-12 pr-6 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-indigo-600 focus:bg-white transition-all outline-none font-bold text-gray-700"
                                        placeholder="••••••••"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-black text-gray-400 uppercase tracking-widest ml-1">
                                    Confirm Password
                                </label>
                                <div className="relative">
                                    <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                    <input
                                        required
                                        type="password"
                                        className="w-full pl-12 pr-6 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-indigo-600 focus:bg-white transition-all outline-none font-bold text-gray-700"
                                        placeholder="••••••••"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-xl hover:bg-indigo-700 hover:shadow-indigo-500/40 hover:-translate-y-1 transition-all active:scale-95 mt-2 disabled:opacity-50"
                            >
                                {loading ? 'Resetting...' : 'Reset Password'}
                            </button>

                            <Link
                                to={loginPath}
                                className="flex items-center justify-center gap-2 text-sm font-bold text-gray-400 hover:text-indigo-600 transition"
                            >
                                <ArrowLeft size={16} />
                                Back to {roleLabel} Login
                            </Link>
                        </form>
                    )}
                </div>

                {/* Decorative background shape */}
                <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-50 -z-0"></div>
            </div>
        </div>
    );
};

export default ForgotPassword;
