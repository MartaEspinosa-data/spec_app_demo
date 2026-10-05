import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, KeyRound, Eye, EyeOff, Sparkles, ArrowRight } from 'lucide-react';
import { API_URL } from '../config';
import { useToast } from '../components/Toast';

const TeacherLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { addToast } = useToast();

    // Check if teacher is already logged in
    useEffect(() => {
        const teacherAuth = localStorage.getItem('teacher_auth');
        if (teacherAuth) {
            try {
                const parsed = JSON.parse(teacherAuth);
                if (parsed.access_token) {
                    navigate('/teacher/dashboard');
                }
            } catch {
                localStorage.removeItem('teacher_auth');
            }
        }
    }, [navigate]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const cleanEmail = email.trim();

        try {
            const res = await fetch(`${API_URL}/teachers/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: cleanEmail, password }),
            });

            if (!res.ok) {
                const data = await res.json();
                const msg = data.detail || 'Acceso denegado. Credenciales incorrectas.';
                setError(msg);
                addToast('error', msg);
                setLoading(false);
                return;
            }

            const data = await res.json();
            localStorage.setItem('teacher_auth', JSON.stringify(data));
            addToast('success', '¡Bienvenida, Marta! Accediendo al panel...');
            navigate('/teacher/dashboard');
        } catch (err: any) {
            const msg = err.message || 'Error de conexión. Asegúrate de que el servidor esté activo.';
            setError(msg);
            addToast('error', msg);
            setLoading(false);
        }
    };

    const fillMartaCredentials = () => {
        setEmail('martaespinosagarcia@gmail.com');
        setPassword('1378945m');
        setError('');
        addToast('info', 'Credenciales de Marta cargadas.');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Ambient Lighting Orbs */}
            <div className="absolute top-1/4 left-10 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl pointer-events-none"></div>

            <div className="bg-white/95 backdrop-blur-xl p-8 sm:p-12 rounded-[2.5rem] shadow-2xl border border-white/20 w-full max-w-md relative z-10">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/30 transform hover:scale-105 transition-transform">
                        <Lock size={30} className="text-white" />
                    </div>
                    
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Teacher Portal</h1>
                    <p className="text-gray-500 font-medium text-sm mt-1">
                        Acceso exclusivo al panel de profesora
                    </p>

                    {/* One-click quick fill helper */}
                    <button
                        type="button"
                        onClick={fillMartaCredentials}
                        className="mt-4 inline-flex items-center gap-2 px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full border border-indigo-200/60 transition-all hover:scale-[1.02] shadow-sm cursor-pointer"
                    >
                        <Sparkles size={14} className="text-indigo-600" />
                        <span>Autocompletar mi cuenta (Marta)</span>
                    </button>
                </div>

                <form onSubmit={handleLogin} className="flex flex-col gap-5">
                    <div className="space-y-1.5">
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-wider ml-1">
                            Correo Electrónico
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={19} />
                            <input
                                required
                                type="email"
                                className="w-full pl-12 pr-4 py-3.5 bg-gray-50/80 rounded-2xl border-2 border-gray-100 focus:border-indigo-600 focus:bg-white transition-all outline-none font-bold text-gray-800 text-sm shadow-inner placeholder:text-gray-400"
                                placeholder="martaespinosagarcia@gmail.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <div className="flex justify-between items-center ml-1">
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-wider">
                                Contraseña
                            </label>
                        </div>
                        <div className="relative">
                            <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={19} />
                            <input
                                required
                                type={showPassword ? 'text' : 'password'}
                                className="w-full pl-12 pr-12 py-3.5 bg-gray-50/80 rounded-2xl border-2 border-gray-100 focus:border-indigo-600 focus:bg-white transition-all outline-none font-bold text-gray-800 text-sm shadow-inner placeholder:text-gray-400"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                                title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-50/90 border border-red-200 text-red-600 text-xs font-bold p-3.5 rounded-2xl flex items-center gap-2.5 animate-in fade-in slide-in-from-top-1 duration-200">
                            <div className="w-2 h-2 rounded-full bg-red-500 shrink-0"></div>
                            <span className="flex-1">{error}</span>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl font-black text-base shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:-translate-y-0.5 transition-all active:scale-[0.98] mt-2 disabled:opacity-50 flex items-center justify-center gap-2 group cursor-pointer"
                    >
                        {loading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                <span>Iniciando sesión...</span>
                            </>
                        ) : (
                            <>
                                <span>Iniciar Sesión</span>
                                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-6 pt-6 border-t border-gray-100 text-center flex flex-col gap-2">
                    <Link
                        to="/teacher/forgot-password"
                        className="text-xs font-bold text-gray-400 hover:text-indigo-600 transition"
                    >
                        ¿Olvidaste tu contraseña?
                    </Link>
                    <Link
                        to="/"
                        className="text-xs font-bold text-indigo-500 hover:text-indigo-700 transition"
                    >
                        ← Volver a la página principal
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default TeacherLogin;
