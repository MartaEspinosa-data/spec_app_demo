import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { API_URL } from '../config';
import { teacherService } from '../services/teacherService';
import type { Teacher } from '../services/teacherService';
import { useToast } from '../components/Toast';
import { StudentBookingCalendar } from '../components/calendar/StudentBookingCalendar';
import { DurationSelector } from '../components/calendar/DurationSelector';
import { ChevronLeft, Info } from 'lucide-react';
import { useLanguage } from '../i18n';
import LanguageSelector from '../components/LanguageSelector';

const BookingPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [teacher, setTeacher] = useState<Teacher | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
    const [selectedDuration, setSelectedDuration] = useState<number>(60);
    const [submitting, setSubmitting] = useState(false);
    const [dynamicPrice, setDynamicPrice] = useState<number | null>(null);
    const [priceLoading, setPriceLoading] = useState(false);
    const { t } = useLanguage();

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: 'Conversación'
    });

    // ── Fetch price when lesson_type or duration changes ──────────────────
    useEffect(() => {
        if (!teacher) return;
        let cancelled = false;
        const fetchPrice = async () => {
            setPriceLoading(true);
            try {
                const res = await axios.get(`${API_URL}/lessons/price`, {
                    params: {
                        lesson_type: formData.subject,
                        duration: selectedDuration,
                        teacher_id: teacher.id,
                    },
                });
                if (!cancelled) setDynamicPrice(res.data.price);
            } catch {
                if (!cancelled) setDynamicPrice(null);
            } finally {
                if (!cancelled) setPriceLoading(false);
            }
        };
        fetchPrice();
        return () => { cancelled = true; };
    }, [formData.subject, selectedDuration, teacher?.id]);

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
        if (!selectedSlot || !teacher || submitting) return;

        setSubmitting(true);
        try {
            const response = await axios.post(`${API_URL}/lessons/`, {
                student_name: formData.name,
                student_email: formData.email,
                teacher_id: teacher.id,
                lesson_type: formData.subject,
                start_time: selectedSlot,
                duration: selectedDuration,
                student_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
            });

            const stripeUrl = response.data.stripe_payment_link_url as string | null;

            // Redirect to Stripe's hosted payment page
            if (stripeUrl) {
                window.location.href = stripeUrl;
                return;
            }

            addToast('error', 'Payment system is not available. Please try again later.');
        } catch (err: any) {
            const msg = err?.response?.data?.detail || err?.message || 'Error creating booking. Please try again.';
            addToast('error', msg);
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
        <div className="bg-[#f8faff] min-h-screen pb-24 sm:pb-32">
            <header className="bg-white/80 backdrop-blur-md shadow-sm fixed top-0 w-full z-50 border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-5 flex items-center justify-between">
                    <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-indigo-600 transition flex items-center gap-1 font-bold tracking-tight text-sm sm:text-base">
                        <ChevronLeft size={18} />
                        <span className="hidden sm:inline">{t('booking.cancel')}</span>
                    </button>
                    <div className="flex items-center gap-2 sm:gap-4">
                        <span className="px-3 sm:px-5 py-1.5 sm:py-2 bg-indigo-50 text-indigo-600 text-xs sm:text-sm font-black uppercase tracking-widest rounded-full border border-indigo-100 shadow-sm">
                            {t('booking.priceLocked', { price: String(teacher.price_per_hour) })}
                        </span>
                        <LanguageSelector />
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-32 sm:pt-40">
                <div className="text-center mb-10 sm:mb-16">
                    <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-gray-900 mb-4 sm:mb-6 tracking-tight">
                        Reserva tu Sesión con <span className="text-indigo-600">{teacher.name}</span>
                    </h1>
                    <p className="text-base sm:text-xl text-gray-500 font-medium max-w-2xl mx-auto leading-relaxed px-2">
                        Selecciona un horario que te convenga y completa tus detalles para confirmar la clase.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 items-start">
                    {/* Left: Custom Calendar */}
                    <div className="lg:col-span-8">
                        <DurationSelector
                            selected={selectedDuration}
                            onChange={(mins) => {
                                setSelectedDuration(mins);
                                setSelectedSlot(null);
                            }}
                        />
                        <StudentBookingCalendar
                            teacherId={teacher.id}
                            onSlotSelect={setSelectedSlot}
                            durationMinutes={selectedDuration}
                        />
                    </div>

                    {/* Right: Booking Form */}
                    <div className="lg:col-span-4 lg:sticky lg:top-32">
                        <div className="bg-white p-6 sm:p-10 rounded-2xl sm:rounded-[2.5rem] shadow-2xl border border-gray-100 relative overflow-hidden">
                            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-6 sm:mb-8 relative z-10 flex items-center gap-3">
                                <Info size={24} className="text-indigo-600" />
                                {t('booking.confirmTitle')}
                            </h2>

                            <form onSubmit={handleBooking} className="flex flex-col gap-4 sm:gap-6 relative z-10">
                                <div className="space-y-2">
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest ml-1">{t('booking.form.name')}</label>
                                    <input
                                        required
                                        type="text"
                                        className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-indigo-600 focus:bg-white transition-all outline-none font-bold text-gray-700 text-sm sm:text-base"
                                        placeholder={t('booking.form.namePlaceholder')}
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest ml-1">{t('booking.form.email')}</label>
                                    <input
                                        required
                                        type="email"
                                        className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-indigo-600 focus:bg-white transition-all outline-none font-bold text-gray-700 text-sm sm:text-base"
                                        placeholder={t('booking.form.emailPlaceholder')}
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest ml-1">{t('booking.form.subject')}</label>
                                        <select
                                            className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-indigo-600 focus:bg-white transition-all outline-none font-bold text-gray-700 appearance-none text-sm sm:text-base"
                                            value={formData.subject}
                                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                        >
                                            <option value="Conversación">🗣️ {t('booking.subjects.conversation')}</option>
                                            <option value="Curso Básico">📚 {t('booking.subjects.basic_course')}</option>
                                            <option value="Grammar">📝 Grammar</option>
                                            <option value="Examen DELE">🎓 Examen DELE</option>
                                            <option value="Entrevista de Trabajo">💼 Entrevista de Trabajo</option>
                                        </select>
                                </div>

                                {/* Dynamic price display */}
                                <div className="bg-indigo-50 rounded-2xl p-4 border border-indigo-100 text-center">
                                    {priceLoading ? (
                                        <span className="text-indigo-400 font-bold text-sm animate-pulse">Calculating price...</span>
                                    ) : dynamicPrice !== null ? (
                                        <div>
                                            <span className="text-2xl sm:text-3xl font-black text-indigo-600">€{dynamicPrice.toFixed(2)}</span>
                                            <p className="text-xs text-indigo-400 font-medium mt-1">
                                                {selectedDuration} min · {formData.subject}
                                            </p>
                                        </div>
                                    ) : (
                                        <span className="text-indigo-400 font-bold text-sm">—</span>
                                    )}
                                </div>

                                <div className="pt-2 sm:pt-4">
                                    <button
                                        disabled={!selectedSlot || submitting}
                                        type="submit"
                                        className={`w-full py-4 sm:py-5 rounded-2xl font-black text-lg sm:text-xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 ${selectedSlot
                                            ? 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-indigo-500/40 hover:-translate-y-1'
                                            : 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                                            }`}
                                    >
                                        {submitting ? t('booking.processing') : (
                                            selectedSlot && dynamicPrice !== null
                                                ? `Pay €${dynamicPrice.toFixed(2)} · Confirm Booking`
                                                : (selectedSlot ? t('booking.confirmPayment') : t('booking.selectSlot'))
                                        )}
                                    </button>
                                </div>
                                <p className="text-center text-xs font-bold text-gray-400 mt-1 sm:mt-2">
                                    Secure payment via Stripe 💳
                                </p>
                            </form>

                            {/* Decorative background shape */}
                            <div className="absolute -bottom-20 -right-20 w-48 sm:w-64 h-48 sm:h-64 bg-indigo-50 rounded-full blur-3xl opacity-50 -z-0"></div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default BookingPage;
