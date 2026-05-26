import { Info } from 'lucide-react';

const CookiePolicy = () => {
    return (
        <div className="bg-[#f0f2f5] min-h-screen pt-20 sm:pt-32 pb-20 px-4 sm:px-6 md:px-8">
            <div className="max-w-4xl mx-auto bg-white rounded-2xl sm:rounded-[2.5rem] p-6 sm:p-8 md:p-16 shadow-xl border border-gray-100">
                <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                        <Info size={28} />
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-black text-gray-900">Política de Cookies</h1>
                </div>

                <div className="space-y-8 text-gray-600 leading-relaxed font-medium">
                    <section>
                        <h2 className="text-xl font-black text-gray-900 mb-4">¿Qué son las cookies?</h2>
                        <p>
                            Las cookies son pequeños archivos de texto que los sitios web almacenan en su ordenador o dispositivo móvil cuando usted los visita. Ayudan a que el sitio web funcione correctamente y a personalizar su experiencia.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-black text-gray-900 mb-4">Cookies que utilizamos</h2>
                        <div className="space-y-4">
                            <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                                <h3 className="font-bold text-indigo-600 mb-1">Cookies Técnicas (Necesarias)</h3>
                                <p className="text-sm">Permiten el funcionamiento básico de la web, como el inicio de sesión del estudiante y la selección de idioma. Sin ellas, el sitio no funcionaría.</p>
                            </div>
                            <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                                <h3 className="font-bold text-indigo-600 mb-1">Cookies de Terceros (Google)</h3>
                                <p className="text-sm text-gray-600">
                                    Utilizamos servicios de <strong>Google</strong> para el inicio de sesión (OAuth) y visualización de vídeos (YouTube). Estos servicios pueden instalar sus propias cookies para recordar preferencias.
                                </p>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-black text-gray-900 mb-4">Cómo controlar las cookies</h2>
                        <p>
                            Usted puede controlar y/o eliminar las cookies en cualquier momento a través de la configuración de su navegador. Sin embargo, si deshabilita las cookies técnicas, es posible que no pueda utilizar algunas funciones de la web (como reservar clases o entrar en su panel de estudiante).
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default CookiePolicy;
