import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight, BookOpen } from 'lucide-react';
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
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

            if (!res.ok) {
                const data = await res.json();
                const msg = data.detail || 'Authentication failed';
                setError(msg);
                addToast('error', msg); // Also show as toast for consistency
                setLoading(false);
                return;
            }

            const data = await res.json();
            // Store full response including access_token for JWT auth
            localStorage.setItem('student_auth', JSON.stringify(data));
            addToast('success', isRegister ? 'Account created successfully!' : 'Welcome back!');
            navigate('/dashboard');
        } catch (err: any) {
            const msg = err.message || 'Connection error. Please try again.';
            setError(msg);
            addToast('error', msg);
            setLoading(false);
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
                        {isRegister ? 'Create Account' : 'Student Login'}
                    </h1>
                    <p className="text-gray-500 font-medium text-sm sm:text-base">
                        {isRegister ? 'Sign up to book and track your lessons' : 'Access your booked lessons'}
                    </p>
                </div>

                <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-100 p-5 sm:p-8">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 font-bold text-sm text-center border border-red-100">
                            {error}
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
                            onClick={() => { setIsRegister(!isRegister); setError(''); }}
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
                </div>
            </div>
        </div>
    );
};

export default StudentLogin;
