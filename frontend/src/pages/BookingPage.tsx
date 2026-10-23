import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { API_URL } from '../config';
import { teacherService } from '../services/teacherService';
import type { Teacher } from '../services/teacherService';
import { useToast } from '../components/Toast';
import { StudentBookingCalendar } from '../components/calendar/StudentBookingCalendar';
import { ChevronLeft, Info, Gift, Sparkles, CheckCircle2, ShieldCheck, Tag, Calendar as CalendarIcon } from 'lucide-react';
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
    const [bookingMode, setBookingMode] = useState<'single' | 'package'>('single');
    const [packageLoading, setPackageLoading] = useState(false);
    const { t } = useLanguage();

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: 'Conversación'
    });

    // Populate name and email if student is already logged in
    useEffect(() => {
        try {
            const auth = JSON.parse(localStorage.getItem('student_auth') || 'null');
            if (auth) {
                setFormData(prev => ({
                    ...prev,
                    name: auth.name || prev.name,
                    email: auth.email || prev.email,
                }));
            }
        } catch { /* ignore */ }
    }, []);

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

    const packagePricing = dynamicPrice !== null ? {
        subtotal: Number((dynamicPrice * 5).toFixed(2)),
        discount: Number((dynamicPrice * 5 * 0.03).toFixed(2)),
        total: Number(((dynamicPrice * 5) * 0.97).toFixed(2)),
        perLesson: Number((((dynamicPrice * 5) * 0.97) / 5).toFixed(2)),
    } : null;

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

    const handlePackagePurchase = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!teacher || packageLoading) return;

        const studentAuth = JSON.parse(localStorage.getItem('student_auth') || 'null');
        if (!studentAuth) {
            // Save intention and navigate to login/register
            localStorage.setItem('pending_package_purchase', JSON.stringify({
                teacher_id: teacher.id,
                lesson_type: formData.subject,
                duration: selectedDuration,
            }));
            addToast('info', t('booking.packageLoginPrompt') || 'Por favor, inicia sesión o crea una cuenta para asociar tu bono de clases.');
            navigate(`/student/login?redirect=/book/${teacher.id}`);
            return;
        }

        setPackageLoading(true);
        try {
            const res = await axios.post(
                `${API_URL}/packages/purchase`,
                {
                    teacher_id: teacher.id,
                    lesson_type: formData.subject,
                    duration: selectedDuration,
                },
                {
                    headers: {
                        Authorization: `Bearer ${studentAuth.access_token}`,
                    },
                }
            );

            const stripeUrl = res.data.stripe_checkout_url;
            if (stripeUrl) {
                window.location.href = stripeUrl;
                return;
            }

            // In demo mode without Stripe configured
            addToast('success', t('booking.packageSuccess') || '¡Paquete adquirido con éxito!');
            navigate('/dashboard');
        } catch (err: any) {
            const msg = err?.response?.data?.detail || err?.message || t('booking.packageError');
            addToast('error', msg);
        } finally {
            setPackageLoading(false);
        }
    };

    const handleBooking = async (e: React.FormEvent) => {
        if (bookingMode === 'package') {
            return handlePackagePurchase(e);
        }
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
                if (response.data.lesson_id) {
                    localStorage.setItem('pending_payment_lesson_id', response.data.lesson_id);
                }
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
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-indigo-600 transition flex items-center gap-1 font-bold tracking-tight text-sm sm:text-base mr-2">
                            <ChevronLeft size={18} />
                            <span className="hidden sm:inline">{t('booking.cancel')}</span>
                        </button>
                        <Link to="/" className="flex items-center gap-2 group">
                            <img src="/icon.png" alt="Marta Spanish Teacher" className="h-8 sm:h-9 w-auto object-contain transition-transform group-hover:scale-105" />
                            <span className="font-black text-[#233b5d] tracking-tight hidden md:inline">Marta <span className="text-xs text-[#cb7561] font-bold">Spanish Teacher</span></span>
                        </Link>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-4">
                        <span className="px-3 sm:px-5 py-1.5 sm:py-2 bg-indigo-50 text-indigo-600 text-xs sm:text-sm font-black uppercase tracking-widest rounded-full border border-indigo-100 shadow-sm">
                            {t('booking.priceLocked', { price: String(teacher.price_per_hour) })}
                        </span>
                        <LanguageSelector />
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-32 sm:pt-40">
                <div className="text-center mb-8 sm:mb-12">
                    <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-gray-900 mb-4 tracking-tight">
                        {t('booking.bookWithTeacher')} <span className="text-indigo-600">{teacher.name}</span>
                    </h1>
                    <p className="text-base sm:text-xl text-gray-500 font-medium max-w-2xl mx-auto leading-relaxed px-2">
                        {t('booking.pageSubtitle')}
                    </p>

                    {/* Mode Switcher Tabs */}
                    <div className="inline-flex p-1.5 bg-gray-200/80 rounded-2xl gap-2 mt-6 shadow-inner max-w-full">
                        <button
                            type="button"
                            onClick={() => setBookingMode('single')}
                            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-black text-xs sm:text-sm transition-all cursor-pointer ${
                                bookingMode === 'single'
                                    ? 'bg-white text-indigo-600 shadow-md scale-[1.02]'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            <CalendarIcon size={16} />
                            <span>{t('booking.modeSingle')}</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setBookingMode('package')}
                            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-black text-xs sm:text-sm transition-all cursor-pointer relative ${
                                bookingMode === 'package'
                                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/20 scale-[1.02]'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            <Gift size={16} className={bookingMode === 'package' ? 'text-amber-300' : 'text-indigo-500'} />
                            <span>{t('booking.modePackage')}</span>
                            <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-full tracking-wider ${
                                bookingMode === 'package' ? 'bg-amber-400 text-amber-950' : 'bg-amber-100 text-amber-800'
                            }`}>
                                {t('booking.discountBadge')}
                            </span>
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 items-start">
                    {/* Left Column */}
                    <div className="lg:col-span-8 space-y-6">
                        {bookingMode === 'package' ? (
                            <div className="space-y-6">
                                {/* Package Hero Card */}
                                <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-10 shadow-xl border border-indigo-800/40 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
                                    <div className="relative z-10 space-y-4">
                                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-400/20 border border-amber-300/30 text-amber-300 text-xs font-black uppercase tracking-wider">
                                            <Sparkles size={14} />
                                            <span>{t('booking.packageBadgeDiscount')}</span>
                                        </div>
                                        <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
                                            {t('booking.packageHeroTitle', { duration: String(selectedDuration) })}
                                        </h2>
                                        <p className="text-sm sm:text-base text-indigo-200 leading-relaxed max-w-2xl">
                                            {t('booking.packageHeroDesc')}
                                        </p>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
                                            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex items-start gap-3">
                                                <CheckCircle2 size={20} className="text-emerald-400 shrink-0 mt-0.5" />
                                                <div>
                                                    <p className="font-bold text-xs uppercase text-indigo-200 tracking-wider">{t('booking.package5Lessons')}</p>
                                                    <p className="text-sm font-semibold text-white mt-0.5">{selectedDuration} min · {formData.subject}</p>
                                                </div>
                                            </div>
                                            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex items-start gap-3">
                                                <ShieldCheck size={20} className="text-emerald-400 shrink-0 mt-0.5" />
                                                <div>
                                                    <p className="font-bold text-xs uppercase text-indigo-200 tracking-wider">{t('booking.packageTotalFlexibility')}</p>
                                                    <p className="text-sm font-semibold text-white mt-0.5">{t('booking.packageNoExpiry')}</p>
                                                </div>
                                            </div>
                                            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex items-start gap-3">
                                                <Tag size={20} className="text-emerald-400 shrink-0 mt-0.5" />
                                                <div>
                                                    <p className="font-bold text-xs uppercase text-indigo-200 tracking-wider">{t('booking.packageSave3')}</p>
                                                    <p className="text-sm font-semibold text-white mt-0.5">{t('booking.packageDiscountedPerLesson')}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Calendar availability preview */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 px-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                        <CalendarIcon size={14} className="text-indigo-600" />
                                        <span>{t('booking.calendarAvailabilityPreview', { name: teacher.name })}</span>
                                    </div>
                                    <StudentBookingCalendar
                                        teacherId={teacher.id}
                                        onSlotSelect={setSelectedSlot}
                                        selectedSlot={selectedSlot}
                                        durationMinutes={selectedDuration}
                                        onDurationChange={(mins) => {
                                            setSelectedDuration(mins);
                                            setSelectedSlot(null);
                                        }}
                                    />
                                </div>
                            </div>
                        ) : (
                            <StudentBookingCalendar
                                teacherId={teacher.id}
                                onSlotSelect={setSelectedSlot}
                                selectedSlot={selectedSlot}
                                durationMinutes={selectedDuration}
                                onDurationChange={(mins) => {
                                    setSelectedDuration(mins);
                                    setSelectedSlot(null);
                                }}
                            />
                        )}
                    </div>

                    {/* Right: Booking / Package Form */}
                    <div className="lg:col-span-4 lg:sticky lg:top-32">
                        <div className="bg-white p-6 sm:p-10 rounded-2xl sm:rounded-[2.5rem] shadow-2xl border border-gray-100 relative overflow-hidden">
                            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-6 sm:mb-8 relative z-10 flex items-center gap-3">
                                {bookingMode === 'package' ? (
                                    <>
                                        <Gift size={26} className="text-indigo-600" />
                                        <span>{t('booking.modePackage')}</span>
                                    </>
                                ) : (
                                    <>
                                        <Info size={24} className="text-indigo-600" />
                                        <span>{t('booking.confirmTitle')}</span>
                                    </>
                                )}
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
                                        <option value="Grammar">📝 {t('booking.subjects.grammar')}</option>
                                        <option value="Examen DELE">🎓 {t('booking.subjects.dele')}</option>
                                        <option value="Entrevista de Trabajo">💼 {t('booking.subjects.interview')}</option>
                                    </select>
                                </div>

                                {/* Dynamic price / package breakdown display */}
                                {bookingMode === 'package' ? (
                                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-5 border border-indigo-100 text-left space-y-3">
                                        <div className="flex items-center justify-between text-xs text-gray-600 font-bold">
                                            <span>{t('booking.packageSubtotal', { price: dynamicPrice?.toFixed(2) || '...' })}</span>
                                            <span>€{packagePricing?.subtotal.toFixed(2) || '...'}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs font-black text-emerald-700">
                                            <span className="flex items-center gap-1">
                                                <Tag size={13} />
                                                <span>{t('booking.packageSpecialDiscount')}</span>
                                            </span>
                                            <span>-€{packagePricing?.discount.toFixed(2) || '...'}</span>
                                        </div>
                                        <div className="pt-2 border-t border-indigo-200/60 flex items-baseline justify-between">
                                            <div>
                                                <span className="text-2xl sm:text-3xl font-black text-indigo-700">
                                                    €{packagePricing?.total.toFixed(2) || '...'}
                                                </span>
                                                <p className="text-[11px] text-indigo-500 font-bold mt-0.5">
                                                    {t('booking.packagePerLesson', { price: packagePricing?.perLesson.toFixed(2) || '...' })}
                                                </p>
                                            </div>
                                            <span className="text-xs uppercase font-black bg-indigo-600 text-white px-2.5 py-1 rounded-full shadow-xs">
                                                {t('booking.package5Lessons')}
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-indigo-50 rounded-2xl p-4 border border-indigo-100 text-center">
                                        {priceLoading ? (
                                            <span className="text-indigo-400 font-bold text-sm animate-pulse">{t('booking.calculatingPrice')}</span>
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
                                )}

                                <div className="pt-2 sm:pt-4">
                                    {bookingMode === 'package' ? (
                                        <button
                                            disabled={packageLoading || dynamicPrice === null}
                                            type="submit"
                                            className="w-full py-4 sm:py-5 rounded-2xl font-black text-lg shadow-xl bg-gradient-to-r from-indigo-600 via-indigo-600 to-purple-600 text-white hover:from-indigo-500 hover:to-purple-500 hover:shadow-indigo-500/40 hover:-translate-y-1 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                                        >
                                            {packageLoading ? t('booking.processingPackage') : t('booking.buyPackageBtn', { total: packagePricing?.total.toFixed(2) || '' })}
                                        </button>
                                    ) : (
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
                                                    ? t('booking.payAndConfirm', { price: dynamicPrice.toFixed(2) })
                                                    : (selectedSlot ? t('booking.confirmPayment') : t('booking.selectSlot'))
                                            )}
                                        </button>
                                    )}
                                </div>
                                <p className="text-center text-xs font-bold text-gray-400 mt-1 sm:mt-2">
                                    {t('booking.manualPaymentNote')}
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
