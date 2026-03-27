import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, KeyRound } from 'lucide-react';

const TeacherLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        // MVP authentication
        if (email.toLowerCase() === 'martaespinosagarcia@gmail.com' && password === '4565') {
            localStorage.setItem('teacher_auth', 'true');
            navigate('/teacher/dashboard');
        } else {
            setError('Acceso denegado. Credenciales incorrectas.');
        }
    };

    return (
        <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center p-4">
            <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl border border-gray-100 w-full max-w-md relative overflow-hidden">
                <div className="relative z-10">
                    <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-8 mx-auto shadow-inner">
                        <Lock size={32} className="text-indigo-600" />
                    </div>
                    
                    <h1 className="text-3xl font-black text-center text-gray-900 mb-2">Teacher Login</h1>
                    <p className="text-center text-gray-500 font-medium mb-8">Access your availability dashboard.</p>

                    <form onSubmit={handleLogin} className="flex flex-col gap-6">
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
                                    placeholder="marta@..."
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-black text-gray-400 uppercase tracking-widest ml-1">
                                Password
                            </label>
                            <div className="relative">
                                <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    required
                                    type="password"
                                    className="w-full pl-12 pr-6 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-indigo-600 focus:bg-white transition-all outline-none font-bold text-gray-700"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        {error && (
                            <p className="text-red-500 text-sm font-bold text-center bg-red-50 p-3 rounded-xl">
                                {error}
                            </p>
                        )}

                        <button
                            type="submit"
                            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-xl hover:bg-indigo-700 hover:shadow-indigo-500/40 hover:-translate-y-1 transition-all active:scale-95 mt-2"
                        >
                            Sign In
                        </button>
                    </form>
                </div>

                {/* Decorative background shape */}
                <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-50 -z-0"></div>
            </div>
        </div>
    );
};

export default TeacherLogin;
