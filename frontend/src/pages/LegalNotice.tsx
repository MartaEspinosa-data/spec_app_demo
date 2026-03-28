import { useLanguage } from '../i18n';
import { ShieldCheck, Mail, MapPin, User } from 'lucide-react';

const LegalNotice = () => {
    const { t } = useLanguage();

    return (
        <div className="bg-[#f0f2f5] min-h-screen pt-32 pb-20 px-4 md:px-8">
            <div className="max-w-4xl mx-auto bg-white rounded-[2.5rem] p-8 md:p-16 shadow-xl border border-gray-100">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                        <ShieldCheck size={32} />
                    </div>
                    <h1 className="text-4xl font-black text-gray-900">Aviso Legal</h1>
                </div>

                <div className="space-y-8 text-gray-600 leading-relaxed font-medium">
                    <section>
                        <h2 className="text-xl font-black text-indigo-600 mb-4 uppercase tracking-widest">1. Información Identificativa</h2>
                        <p className="mb-4">
                            En cumplimiento con el deber de información recogido en el artículo 10 de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y del Comercio Electrónico, a continuación se detallan los siguientes datos:
                        </p>
                        <ul className="space-y-3 bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
                            <li className="flex items-center gap-3">
                                <User size={18} className="text-indigo-400" />
                                <strong>Titular:</strong> Marta Espinosa García
                            </li>
                            <li className="flex items-center gap-3">
                                <Mail size={18} className="text-indigo-400" />
                                <strong>Email:</strong> martaespinosagarcia@gmail.com
                            </li>
                            <li className="flex items-center gap-3">
                                <MapPin size={18} className="text-indigo-400" />
                                <strong>Actividad:</strong> Enseñanza de español online
                            </li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-black text-indigo-600 mb-4 uppercase tracking-widest">2. Usuarios</h2>
                        <p>
                            El acceso y/o uso de este portal atribuye la condición de USUARIO, que acepta, desde dicho acceso y/o uso, las Condiciones Generales de Uso aquí reflejadas.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-black text-indigo-600 mb-4 uppercase tracking-widest">3. Uso del Portal</h2>
                        <p>
                            Este sitio web proporciona el acceso a multitud de informaciones, servicios, programas o datos en Internet pertenecientes a Marta Espinosa García, a los que el USUARIO pueda tener acceso. El USUARIO asume la responsabilidad del uso del portal adecuadamente.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-black text-indigo-600 mb-4 uppercase tracking-widest">4. Propiedad Intelectual</h2>
                        <p>
                            Marta Espinosa García es titular de todos los derechos de propiedad intelectual e industrial de su página web, así como de los elementos contenidos en la misma. Todos los derechos reservados.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-black text-indigo-600 mb-4 uppercase tracking-widest">5. Legislación Aplicable</h2>
                        <p>
                            La relación entre Marta Espinosa García y el USUARIO se regirá por la normativa española vigente y cualquier controversia se someterá a los Juzgados y tribunales pertinentes.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default LegalNotice;
