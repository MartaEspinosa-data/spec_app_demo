import { useState } from 'react';
import { Sparkles, Calendar, Zap, MessageCircleQuestion, CheckCircle2, Play, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useLanguage, LANGUAGES } from '../i18n';
import LanguageSelector from '../components/LanguageSelector';
import { StudentBookingCalendar } from '../components/calendar/StudentBookingCalendar';
import { DurationSelector } from '../components/calendar/DurationSelector';
import { EmbeddedCheckout } from '../components/EmbeddedCheckout';
import { ReviewsCarousel } from '../components/ReviewsCarousel';

const LandingPage = () => {
    const { t, language, setLanguage } = useLanguage();
    const [showVideo, setShowVideo] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
    const [selectedDuration, setSelectedDuration] = useState<number>(60);
    const [submitting, setSubmitting] = useState(false);
    const [currency, setCurrency] = useState<'USD' | 'EUR' | 'GBP'>('USD');
    const [checkoutData, setCheckoutData] = useState<{clientSecret: string | null; lessonId: string; price: number; studentData?: any} | null>(null);
    const [checkoutType, setCheckoutType] = useState<'lesson' | 'package'>('lesson');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: 'Conversación'
    });

    const studentAuth = JSON.parse(localStorage.getItem('student_auth') || 'null');

    const martaId = "dc92ef71-d458-4e75-92d9-69b64fc1c964";

    const handleBooking = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSlot || !martaId) return;

        setSubmitting(true);
        try {
            const response = await axios.post('http://localhost:8000/api/lessons/', {
                student_name: formData.name,
                student_email: formData.email,
                teacher_id: martaId,
                lesson_type: formData.subject,
                start_time: selectedSlot,
                duration: selectedDuration,
                student_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
            });
            
            setCheckoutType('lesson');
            setCheckoutData({
                clientSecret: response.data.client_secret,
                lessonId: response.data.lesson_id,
                price: response.data.price,
                studentData: {
                    student_id: response.data.student_id,
                    name: response.data.student_name,
                    email: response.data.student_email
                }
            });
        } catch (err) {
            console.error('Booking error:', err);
            alert('Error creating booking. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const handlePackagePurchase = async (duration: number) => {
        if (!studentAuth) {
            alert('Please login as a student to purchase packages.');
            window.location.href = '/student/login';
            return;
        }

        setSubmitting(true);
        try {
            const response = await axios.post('http://localhost:8000/api/packages/purchase', {
                student_id: studentAuth.student_id,
                duration: duration
            });

            setCheckoutType('package');
            setCheckoutData({
                clientSecret: response.data.client_secret,
                lessonId: response.data.package_id, // Reuse lessonId field for packageId
                price: response.data.price,
            });
        } catch (err) {
            console.error('Package purchase error:', err);
            alert('Error initializing package purchase.');
        } finally {
            setSubmitting(false);
        }
    };

    // Base prices in USD
    const basePricesUSD = { 30: 16.33, 45: 23.55, 60: 30.94 };
    const exchangeRates = { USD: 1, EUR: 0.92, GBP: 0.79 };
    const currencySymbols = { USD: '$', EUR: '€', GBP: '£' };
    const rate = exchangeRates[currency];
    const sym = currencySymbols[currency];

    const formatPkg = (minutes: 30 | 45 | 60) => {
        const base = basePricesUSD[minutes];
        const discounted = base * 0.97; // 3% off
        const perLesson = (discounted * rate).toFixed(2);
        const total = (discounted * 5 * rate).toFixed(2);
        const wasPer = (base * rate).toFixed(2);
        const wasTotal = (base * 5 * rate).toFixed(2);
        return { perLesson, total, wasPer, wasTotal };
    };

    const p30 = formatPkg(30), p45 = formatPkg(45), p60 = formatPkg(60);

    const packages = [
        {
            title: t('landing.packages.30min.title'),
            desc: t('landing.packages.30min.desc'),
            price: `5 x ${sym}${p30.perLesson} = ${sym}${p30.total} (${t('landing.packages.was')} ${sym}${p30.wasTotal})`,
            icon: <Zap size={24} className="text-yellow-500" />
        },
        {
            title: t('landing.packages.45min.title'),
            desc: t('landing.packages.45min.desc'),
            price: `5 x ${sym}${p45.perLesson} = ${sym}${p45.total} (${t('landing.packages.was')} ${sym}${p45.wasTotal})`,
            icon: <Sparkles size={24} className="text-indigo-500" />,
            popular: true
        },
        {
            title: t('landing.packages.60min.title'),
            desc: t('landing.packages.60min.desc'),
            price: `5 x ${sym}${p60.perLesson} = ${sym}${p60.total} (${t('landing.packages.was')} ${sym}${p60.wasTotal})`,
            icon: <CheckCircle2 size={24} className="text-green-500" />
        }
    ];

    const packageDurations = [30, 45, 60] as const;
    return (
        <div className="bg-[#f0f2f5] min-h-screen">
            <header className="fixed top-0 left-0 w-full bg-white/80 backdrop-blur-md shadow-sm z-50 transition-all border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="text-2xl font-black text-indigo-600 tracking-tighter uppercase flex items-center gap-2">
                        <MessageCircleQuestion size={24} className="text-indigo-600" />
                        {t('nav.brand')}
                    </div>
                    <div className="flex gap-4 items-center">
                        <LanguageSelector />
                        <div className="flex items-center gap-2">
                            <Link to="/teacher/dashboard" className="px-4 py-2 text-indigo-400 hover:text-indigo-600 font-bold transition flex items-center gap-2 border border-transparent hover:border-indigo-100 rounded-full" title={t('nav.teacherDashboard') || 'Teacher Dashboard'}>
                                <Calendar size={18} />
                                <span className="hidden md:inline">{t('nav.teacherDashboard') || 'Teacher Dashboard'}</span>
                            </Link>

                            {studentAuth ? (
                                <Link to="/dashboard" className="px-6 py-2.5 bg-indigo-50 text-indigo-600 font-bold rounded-full hover:bg-indigo-100 transition border border-indigo-100 flex items-center gap-2">
                                    <Sparkles size={18} />
                                    {t('dashboard.studentTitle') || 'Student Dashboard'}
                                </Link>
                            ) : (
                                <Link to="/student/login" className="px-6 py-2.5 bg-indigo-50 text-indigo-600 font-bold rounded-full hover:bg-indigo-100 transition border border-indigo-100">
                                    Student Login
                                </Link>
                            )}
                        </div>
                        <Link to={`/book/${martaId}`} className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-full hover:bg-indigo-700 transition shadow-lg hover:shadow-indigo-500/30">
                            {t('nav.getStarted')}
                        </Link>
                    </div>
                </div>
            </header>

            <main className="pt-32 pb-20 px-4 md:px-8">
                {/* Hero Section */}
                <section className="mb-32 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
                    <div className="w-full lg:w-3/5 text-center lg:text-left">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 text-indigo-600 text-sm font-bold uppercase tracking-wider rounded-full border border-indigo-100 mb-8 animate-pulse">
                            <Sparkles size={16} />
                            {t('landing.badge')}
                        </div>
                        <h1 className="text-5xl md:text-7xl xl:text-8xl font-black text-gray-900 tracking-tight leading-[1] mb-8">
                            {t('landing.hero.title')}<span className="text-indigo-600 underline decoration-indigo-200">{t('landing.hero.highlight')}</span>
                        </h1>
                        <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-2xl lg:mx-0 mx-auto leading-relaxed font-medium">
                            {t('landing.hero.subtitle')}
                        </p>
                        <div className="flex flex-col sm:flex-row gap-6 justify-center lg:justify-start items-center">
                            <Link to={`/book/${martaId}`} className="px-10 py-5 bg-indigo-600 text-white text-xl font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-xl hover:shadow-indigo-500/40 hover:-translate-y-1 active:scale-95 flex items-center gap-3">
                                <Calendar size={24} />
                                {t('landing.cta')}
                            </Link>
                            <div className="text-gray-500 font-semibold flex items-center gap-2">
                                <CheckCircle2 size={24} className="text-green-500" />
                                {t('landing.trust')}
                            </div>
                        </div>
                    </div>

                    <div className="w-full lg:w-2/5 relative">
                        <div className="relative z-10 rounded-[3rem] overflow-hidden shadow-2xl border-8 border-white transform lg:rotate-2 hover:rotate-0 transition-transform duration-500 hover:scale-[1.02]">
                            <img
                                src="/marta-photo.jpg"
                                alt="Aprende Español con Marta"
                                className="w-full h-auto object-cover"
                            />
                        </div>
                        {/* Decorative elements */}
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-100 rounded-full blur-3xl opacity-60 mix-blend-multiply animate-blob"></div>
                        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-yellow-100 rounded-full blur-3xl opacity-60 mix-blend-multiply animate-blob animation-delay-2000"></div>
                    </div>
                </section>

                {/* About Section */}
                <section className="max-w-6xl mx-auto mb-32 bg-white rounded-[2.5rem] p-8 md:p-16 shadow-xl border border-gray-100 flex flex-col md:flex-row gap-12 items-center">
                    <div className="w-full md:w-1/2">
                        <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-6 leading-tight">
                            {t('landing.about.title')}
                        </h2>
                        <p className="text-xl text-gray-600 mb-6 leading-relaxed">
                            {t('landing.about.desc1')}
                        </p>
                        <p className="text-lg text-gray-600 leading-relaxed bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
                            {t('landing.about.desc2')}
                        </p>
                    </div>
                    <div className="w-full md:w-1/2 relative aspect-square md:aspect-[16/9] rounded-3xl overflow-hidden shadow-2xl bg-slate-900 border-4 border-white group cursor-pointer">
                        {!showVideo ? (
                            <>
                                <img
                                    src="/presentation-cover.png"
                                    alt="Marta Spanish Tutor"
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                    onClick={() => setShowVideo(true)}
                                />
                                <div
                                    className="absolute inset-0 z-20 flex items-center justify-center bg-black/10 group-hover:bg-black/20 transition-colors"
                                    onClick={() => setShowVideo(true)}
                                >
                                    <div className="w-20 h-20 bg-indigo-600/90 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 shadow-2xl transition-transform duration-300 group-hover:scale-110">
                                        <Play size={36} className="text-white fill-white ml-1" />
                                    </div>
                                </div>
                            </>
                        ) : (
                            <iframe
                                className="w-full h-full"
                                src="https://www.youtube.com/embed/kz7xjaNxqr8?autoplay=1"
                                title="Spanish con Marta Presentation"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                allowFullScreen
                            ></iframe>
                        )}
                    </div>
                </section>

                {/* Packages Section */}
                <section className="max-w-6xl mx-auto mb-32">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">{t('landing.packages.title')}</h2>
                        <div className="w-24 h-1.5 bg-indigo-600 mx-auto rounded-full mb-8"></div>
                        <div className="flex justify-center gap-2 mt-4">
                            {(['USD', 'EUR', 'GBP'] as const).map((c) => (
                                <button
                                    key={c}
                                    onClick={() => setCurrency(c)}
                                    className={`px-5 py-2.5 rounded-full font-bold text-sm transition-all ${
                                        currency === c
                                            ? 'bg-indigo-600 text-white shadow-lg'
                                            : 'bg-white text-gray-600 border border-gray-200 hover:border-indigo-300'
                                    }`}
                                >
                                    {c === 'USD' ? '$ USD' : c === 'EUR' ? '€ EUR' : '£ GBP'}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {packages.map((pkg, i) => (
                            <div key={i} className={`bg-white p-10 rounded-3xl border transition-all duration-300 flex flex-col h-full ${pkg.popular ? 'border-indigo-500 shadow-2xl scale-105 relative' : 'border-gray-100 shadow-lg hover:border-indigo-200'}`}>
                                {pkg.popular && (
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-indigo-600 text-white font-bold px-6 py-2 rounded-full text-sm shadow-md">
                                        Most Popular
                                    </div>
                                )}
                                <div className="flex items-center gap-4 mb-6">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${pkg.popular ? 'bg-indigo-50' : 'bg-gray-50'}`}>
                                        {pkg.icon}
                                    </div>
                                    <h3 className="text-2xl font-black text-gray-800">{pkg.title}</h3>
                                </div>
                                <p className="text-gray-600 font-medium leading-relaxed mb-8 flex-grow">{pkg.desc}</p>
                                <div className="mt-auto">
                                    <div className="text-lg font-bold text-gray-900 mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100 text-center">
                                        {pkg.price}
                                    </div>
                                    <button
                                        onClick={() => handlePackagePurchase(packageDurations[i])}
                                        className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${pkg.popular ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg hover:shadow-indigo-500/30' : 'bg-white text-indigo-600 border-2 border-indigo-100 hover:border-indigo-600'}`}
                                    >
                                        <Zap size={20} />
                                        Buy 5 Classes
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Booking Section */}
                <section id="book" className="max-w-7xl mx-auto mb-32">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">{t('landing.booking.title')}</h2>
                        <div className="w-24 h-1.5 bg-indigo-600 mx-auto rounded-full mb-6"></div>
                        <p className="text-xl text-gray-500 font-medium max-w-2xl mx-auto leading-relaxed">
                            {t('landing.booking.subtitle')}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
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
                                teacherId={martaId}
                                onSlotSelect={setSelectedSlot}
                                durationMinutes={selectedDuration}
                            />
                        </div>

                        {/* Right: Booking Form / Payment */}
                        <div className="lg:col-span-4 lg:sticky lg:top-32">
                            <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl border border-gray-100 relative overflow-hidden">
                                {checkoutData ? (
                                    /* Embedded Stripe Payment Form */
                                    <div className="relative z-10">
                                        <h2 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-3">
                                            💳 {t('booking.payWithStripe')}
                                        </h2>
                                        <EmbeddedCheckout
                                            type={checkoutType}
                                            clientSecret={checkoutData.clientSecret}
                                            lessonId={checkoutData.lessonId}
                                            price={checkoutData.price}
                                            duration={selectedDuration}
                                            onCancel={() => {
                                                setCheckoutData(null);
                                                setSelectedSlot(null);
                                            }}
                                            onPaymentSuccess={() => {
                                                if (checkoutData.studentData && !studentAuth) {
                                                    localStorage.setItem('student_auth', JSON.stringify(checkoutData.studentData));
                                                }
                                            }}
                                        />
                                    </div>
                                ) : (
                                    /* Booking Details Form */
                                    <>
                                        <h2 className="text-3xl font-black text-gray-900 mb-8 relative z-10 flex items-center gap-3">
                                            <Info size={28} className="text-indigo-600" />
                                            {t('booking.confirmTitle')}
                                        </h2>

                                        <form onSubmit={handleBooking} className="flex flex-col gap-6 relative z-10">
                                            <div className="space-y-2">
                                                <label className="block text-sm font-black text-gray-400 uppercase tracking-widest ml-1">{t('booking.form.name')}</label>
                                                <input
                                                    required
                                                    type="text"
                                                    className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-indigo-600 focus:bg-white transition-all outline-none font-bold text-gray-700"
                                                    placeholder={t('booking.form.namePlaceholder')}
                                                    value={formData.name}
                                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="block text-sm font-black text-gray-400 uppercase tracking-widest ml-1">{t('booking.form.email')}</label>
                                                <input
                                                    required
                                                    type="email"
                                                    className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-indigo-600 focus:bg-white transition-all outline-none font-bold text-gray-700"
                                                    placeholder={t('booking.form.emailPlaceholder')}
                                                    value={formData.email}
                                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="block text-sm font-black text-gray-400 uppercase tracking-widest ml-1">{t('booking.form.subject')}</label>
                                                <select
                                                    className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-indigo-600 focus:bg-white transition-all outline-none font-bold text-gray-700 appearance-none"
                                                    value={formData.subject}
                                                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                                >
                                                    <option>{t('booking.subjects.conversation')}</option>
                                                    <option>{t('booking.subjects.basic_course')}</option>
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
                                                    {submitting ? t('booking.processing') : (selectedSlot ? t('booking.payWithStripe') : t('booking.selectSlot'))}
                                                </button>
                                            </div>
                                            <p className="text-center text-xs font-bold text-gray-400 mt-2">
                                                {t('booking.stripeSecure')}
                                            </p>
                                        </form>
                                    </>
                                )}

                                {/* Decorative background shape */}
                                <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-50 -z-0"></div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Reviews Carousel */}
                <ReviewsCarousel />

                {/* Footer / Language Selector at the end */}
                <footer className="max-w-7xl mx-auto pt-20 pb-10 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-3 text-2xl font-black text-gray-900">
                        <MessageCircleQuestion size={32} className="text-indigo-600" />
                        {t('nav.brand')}
                    </div>
                    
                    <div className="flex flex-col md:flex-row items-center gap-8">
                        <div className="flex gap-6 text-sm font-bold text-gray-400">
                            <Link to="/legal" className="hover:text-indigo-600 transition">Aviso Legal</Link>
                            <Link to="/privacy" className="hover:text-indigo-600 transition">Privacidad</Link>
                            <Link to="/cookies" className="hover:text-indigo-600 transition">Cookies</Link>
                        </div>
                        <Link to={`/book/${martaId}`} className="px-8 py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition shadow-xl hover:shadow-indigo-500/30 flex items-center gap-2">
                            <Calendar size={20} />
                            {t('nav.getStarted')}
                        </Link>
                    </div>
                </footer>
            </main>
        </div>
    );
};

export default LandingPage;
