import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Cookie, X } from 'lucide-react';

export const CookieBanner = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem('cookie-consent');
        if (!consent) {
            // Show after a short delay for better UX
            const timer = setTimeout(() => setIsVisible(true), 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    const accept = () => {
        localStorage.setItem('cookie-consent', 'accepted');
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-6 left-6 right-6 md:left-auto md:right-8 md:max-w-md z-[100] animate-bounce-subtle">
            <div className="bg-white/90 backdrop-blur-xl border border-indigo-100 shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-3xl p-6 md:p-8 relative overflow-hidden group">
                {/* Decoration */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -z-0 opacity-50 group-hover:scale-110 transition-transform duration-700"></div>

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                            <Cookie size={22} />
                        </div>
                        <h3 className="text-lg font-black text-gray-900 tracking-tight">Cookies & Privacidad</h3>
                        <button 
                            onClick={() => setIsVisible(false)}
                            className="ml-auto p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 transition"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <p className="text-sm text-gray-600 font-medium leading-relaxed mb-6">
                        Utilizamos cookies para que disfrutes de la mejor experiencia, procesar pagos seguros con Stripe y permitir el acceso con Google. Al continuar, aceptas nuestra <Link to="/cookies" className="text-indigo-600 underline">Política de Cookies</Link>.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <button 
                            onClick={accept}
                            className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 active:scale-95"
                        >
                            Aceptar y cerrar
                        </button>
                        <Link 
                            to="/privacy"
                            className="flex-1 py-3 bg-gray-50 text-gray-600 font-bold rounded-xl hover:bg-gray-100 text-center transition active:scale-95 text-sm"
                        >
                            Más info
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};
