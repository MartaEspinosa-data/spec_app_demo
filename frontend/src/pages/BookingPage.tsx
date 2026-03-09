import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { teacherService } from '../services/teacherService';
import type { Teacher } from '../services/teacherService';
import BookingCalendar from '../components/BookingCalendar';
import { ChevronLeft, Info } from 'lucide-react';
import { useLanguage } from '../i18n';
import LanguageSelector from '../components/LanguageSelector';

const BookingPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [teacher, setTeacher] = useState<Teacher | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const { t } = useLanguage();

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: 'General Spanish'
    });

    useEffect(() => {
        const fetchTeacher = async () => {
            if (!id) return;
            try {
                const found = await teacherService.getTeacher(id);
                setTeacher(found);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchTeacher();
    }, [id]);

    const handleBooking = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSlot || !teacher) return;

        setSubmitting(true);
        try {
            const response = await axios.post('http://localhost:8000/api/lessons/', {
                student_name: formData.name,
                student_email: formData.email,
                teacher_id: teacher.id,
                lesson_type: formData.subject,
                start_time: selectedSlot,
                duration: 60
            });

            if (response.data.stripe_checkout_url) {
                window.location.href = response.data.stripe_checkout_url;
            }
        } catch (err) {
            console.error('Booking error:', err);
            alert('Error creating booking. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen bg-white">
            <div className="text-2xl font-black text-indigo-600 animate-pulse uppercase tracking-widest">{t('profile.loading')}</div>
        </div>
    );

    if (!teacher) return null;

    return (
        <div className="bg-[#f8faff] min-h-screen pb-32">
            <header className="bg-white/80 backdrop-blur-md shadow-sm fixed top-0 w-full z-50 border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
                    <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-indigo-600 transition flex items-center gap-1 font-bold tracking-tight">
                        <ChevronLeft size={20} />
                        {t('booking.cancel')}
                    </button>
                    <div className="flex items-center gap-4">
                        <span className="px-5 py-2 bg-indigo-50 text-indigo-600 text-sm font-black uppercase tracking-widest rounded-full border border-indigo-100 shadow-sm">
                            {t('booking.priceLocked', { price: String(teacher.price_per_hour) })}
                        </span>
                        <LanguageSelector />
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 pt-40">
                <div className="text-center mb-16">
                    <h1 className="text-5xl md:text-6xl font-black text-gray-900 mb-6 tracking-tight">
                        Reserva tu Sesión con <span className="text-indigo-600">{teacher.name}</span>
                    </h1>
                    <p className="text-xl text-gray-500 font-medium max-w-2xl mx-auto leading-relaxed">
                        Selecciona un horario que te convenga y completa tus detalles para confirmar la clase.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                    {/* Left: Custom Calendar */}
                    <div className="lg:col-span-8">
                        <BookingCalendar
                            teacherId={teacher.id}
                            onSlotSelect={setSelectedSlot}
                            selectedSlot={selectedSlot}
                        />
                    </div>

                    {/* Right: Booking Form */}
                    <div className="lg:col-span-4 sticky top-40">
                        <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl border border-gray-100 relative overflow-hidden">
                            <h2 className="text-3xl font-black text-gray-900 mb-8 relative z-10 flex items-center gap-3">
                                <Info size={28} className="text-indigo-600" />
                                Confirmar Reserva
                            </h2>

                            <form onSubmit={handleBooking} className="flex flex-col gap-6 relative z-10">
                                <div className="space-y-2">
                                    <label className="block text-sm font-black text-gray-400 uppercase tracking-widest ml-1">Nombre Completo</label>
                                    <input
                                        required
                                        type="text"
                                        className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-indigo-600 focus:bg-white transition-all outline-none font-bold text-gray-700"
                                        placeholder="Tu nombre aquí"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-black text-gray-400 uppercase tracking-widest ml-1">Correo Electrónico</label>
                                    <input
                                        required
                                        type="email"
                                        className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-indigo-600 focus:bg-white transition-all outline-none font-bold text-gray-700"
                                        placeholder="tu@email.com"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-black text-gray-400 uppercase tracking-widest ml-1">Asunto de la Clase</label>
                                    <select
                                        className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-indigo-600 focus:bg-white transition-all outline-none font-bold text-gray-700 appearance-none"
                                        value={formData.subject}
                                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                    >
                                        <option>Español General</option>
                                        <option>Preparación DELE</option>
                                        <option>Conversación</option>
                                        <option>Español de Negocios</option>
                                    </select>
                                </div>

                                <div className="pt-4">
                                    <button
                                        disabled={!selectedSlot || submitting}
                                        type="submit"
                                        className={`w-full py-5 rounded-2xl font-black text-xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 ${selectedSlot
                                            ? 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-indigo-500/40 hover:-translate-y-1'
                                            : 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                                            }`}
                                    >
                                        {submitting ? 'Procesando...' : (selectedSlot ? 'Ir al Pago con Stripe' : 'Selecciona una Hora')}
                                    </button>
                                </div>
                                <p className="text-center text-xs font-bold text-gray-400 mt-2">
                                    Pago seguro procesado por Stripe
                                </p>
                            </form>

                            {/* Decorative background shape */}
                            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-50 -z-0"></div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default BookingPage;
