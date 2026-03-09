import { useState } from 'react';
import { Sparkles, Calendar, Zap, MessageCircleQuestion, HelpCircle, CheckCircle2, Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n';
import LanguageSelector from '../components/LanguageSelector';

const LandingPage = () => {
    const { t } = useLanguage();
    const [showVideo, setShowVideo] = useState(false);
    const martaId = "dc92ef71-d458-4e75-92d9-69b64fc1c964";

    const packages = [
        {
            title: t('landing.packages.starter.title'),
            desc: t('landing.packages.starter.desc'),
            price: t('landing.packages.starter.price'),
            icon: <Zap size={24} className="text-yellow-500" />
        },
        {
            title: t('landing.packages.frequent.title'),
            desc: t('landing.packages.frequent.desc'),
            price: t('landing.packages.frequent.price'),
            icon: <Sparkles size={24} className="text-indigo-500" />,
            popular: true
        },
        {
            title: t('landing.packages.dedicated.title'),
            desc: t('landing.packages.dedicated.desc'),
            price: t('landing.packages.dedicated.price'),
            icon: <CheckCircle2 size={24} className="text-green-500" />
        }
    ];

    const faqs = [
        { q: t('landing.faq.q1'), a: t('landing.faq.a1') },
        { q: t('landing.faq.q2'), a: t('landing.faq.a2') },
        { q: t('landing.faq.q3'), a: t('landing.faq.a3') }
    ];

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
                                src="/presentation-cover.png"
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
                        <div className="w-24 h-1.5 bg-indigo-600 mx-auto rounded-full"></div>
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
                                    <Link to={`/book/${martaId}`} className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${pkg.popular ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg hover:shadow-indigo-500/30' : 'bg-white text-indigo-600 border-2 border-indigo-100 hover:border-indigo-600'}`}>
                                        <Calendar size={20} />
                                        Book Now
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* FAQ Section */}
                <section className="max-w-4xl mx-auto mb-32 bg-white rounded-3xl p-8 md:p-12 shadow-lg border border-gray-100">
                    <div className="text-center mb-12 flex flex-col items-center">
                        <HelpCircle size={48} className="text-indigo-600 mb-6 opacity-20" />
                        <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">{t('landing.faq.title')}</h2>
                    </div>
                    <div className="space-y-8">
                        {faqs.map((faq, i) => (
                            <div key={i} className="group">
                                <h3 className="text-xl font-bold text-gray-800 mb-3 flex items-start gap-4">
                                    <span className="text-indigo-400 mt-1">Q.</span>
                                    {faq.q}
                                </h3>
                                <p className="text-gray-600 leading-relaxed text-lg pl-8 border-l-2 border-transparent group-hover:border-indigo-100 transition-colors">
                                    {faq.a}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
};

export default LandingPage;
