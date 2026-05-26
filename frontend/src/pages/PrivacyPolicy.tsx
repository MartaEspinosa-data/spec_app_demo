import { Lock, CreditCard, ChevronRight } from 'lucide-react';

const PrivacyPolicy = () => {
    return (
        <div className="bg-[#f0f2f5] min-h-screen pt-20 sm:pt-32 pb-20 px-4 sm:px-6 md:px-8">
            <div className="max-w-4xl mx-auto bg-white rounded-2xl sm:rounded-[2.5rem] p-6 sm:p-8 md:p-16 shadow-xl border border-gray-100">
                <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                        <Lock size={28} />
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-black text-gray-900">Política de Privacidad</h1>
                </div>

                <div className="space-y-8 text-gray-600 leading-relaxed font-medium">
                    <p className="text-lg">
                        En cumplimiento del Reglamento General de Protección de Datos (RGPD), le informamos sobre cómo tratamos sus datos personales.
                    </p>

                    <section>
                        <h2 className="text-xl font-black text-indigo-600 mb-4 flex items-center gap-2">
                            <ChevronRight size={20} />
                            Responsable del Tratamiento
                        </h2>
                        <p>
                            Responsable: <strong>Marta Espinosa García</strong><br />
                            Email: <strong>martaespinosagarcia@gmail.com</strong>
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-black text-indigo-600 mb-4 flex items-center gap-2">
                            <ChevronRight size={20} />
                            ¿Qué datos recogemos?
                        </h2>
                        <p className="mb-4">Recogemos los datos estrictamente necesarios para la prestación del servicio:</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Datos identificativos: Nombre y Email.</li>
                            <li>Datos de gestión de clases: Horarios, nivel de español y preferencias.</li>
                            <li>Información de pago mediante transferencia bancaria o Payoneer.</li>
                            <li>Datos de inicio de sesión mediante Google OAuth si usted lo elige.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-black text-indigo-600 mb-4 flex items-center gap-2">
                            <ChevronRight size={20} />
                            Finalidad del Tratamiento
                        </h2>
                        <p>Los datos se usan para:</p>
                        <ul className="list-disc pl-6 space-y-2 mt-2">
                            <li>Gestionar la reserva y realización de clases de español.</li>
                            <li>Comunicación directa con el estudiante sobre sus lecciones.</li>
                            <li>Facturación y gestión de pagos seguros.</li>
                            <li>Acceso al área personal del estudiante.</li>
                        </ul>
                    </section>

                    <section className="bg-indigo-50 p-8 rounded-3xl border border-indigo-100">
                        <h2 className="text-xl font-black text-indigo-900 mb-4 flex items-center gap-2">
                            <CreditCard size={24} className="text-indigo-600" />
                            Método de Pago
                        </h2>
                        <p className="text-indigo-800">
                            Los pagos se realizan mediante <strong>transferencia bancaria o Payoneer</strong> a la cuenta de la profesora. No almacenamos datos de tarjetas de crédito. Recibirá las instrucciones de pago por email tras confirmar su reserva.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-black text-indigo-600 mb-4 flex items-center gap-2">
                            <ChevronRight size={20} />
                            Derechos del Usuario
                        </h2>
                        <p>Usted tiene derecho a:</p>
                        <ul className="list-disc pl-6 space-y-2 mt-2">
                            <li>Acceder a sus datos.</li>
                            <li>Rectificar datos inexactos.</li>
                            <li>Solicitar la supresión de sus datos.</li>
                            <li>Oponerse o limitar el tratamiento.</li>
                        </ul>
                        <p className="mt-4">Puede ejercer estos derechos enviando un email a <strong>martaespinosagarcia@gmail.com</strong>.</p>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
