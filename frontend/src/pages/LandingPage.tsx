import { Link } from 'react-router-dom';
import { Sparkles, Calendar, Zap, Rocket } from 'lucide-react';

const LandingPage = () => {
    return (
        <div className="bg-[#f0f2f5] min-h-screen">
            <header className="fixed top-0 left-0 w-full bg-white/80 backdrop-blur-md shadow-sm z-50 transition-all border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="text-2xl font-black text-indigo-600 tracking-tighter uppercase flex items-center gap-2">
                        <Rocket size={24} className="fill-indigo-600" />
                        HolaLingo
                    </div>
                    <div className="flex gap-4">
                        <Link to="/profile" className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-full hover:bg-indigo-700 transition shadow-lg hover:shadow-indigo-500/30">
                            Get Started
                        </Link>
                    </div>
                </div>
            </header>

            <main className="pt-32 pb-20 px-6">
                <section className="text-center mb-24 max-w-4xl mx-auto">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 text-indigo-600 text-sm font-bold uppercase tracking-wider rounded-full border border-indigo-100 mb-6 animate-pulse">
                        <Sparkles size={16} />
                        Level Up Your Spanish
                    </div>
                    <h1 className="text-6xl md:text-8xl font-black text-gray-900 tracking-tight leading-[0.9] mb-10">
                        Learn Spanish with a <span className="text-indigo-600 underline decoration-indigo-200">Personal Tutor</span>
                    </h1>
                    <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed font-medium">
                        Discover expert teachers, book lessons in under 60 seconds, and start speaking from day one.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <Link to="/profile" className="px-10 py-5 bg-indigo-600 text-white text-xl font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-xl hover:shadow-indigo-500/40 hover:-translate-y-1 active:scale-95 flex items-center gap-3">
                            <Calendar size={24} />
                            Book My Free Intro
                        </Link>
                        <div className="text-gray-500 font-semibold flex items-center gap-2">
                            <Zap size={20} className="text-yellow-500" />
                            Trusted by 500+ Students
                        </div>
                    </div>
                </section>

                <section className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-32">
                    {[
                        { title: "Simplicity First", desc: "No complex dashboards. Book, pay, and learn in minutes.", icon: <Zap size={40} /> },
                        { title: "Teacher-First", desc: "Empowering educators to focus on your progress.", icon: <Sparkles size={40} /> },
                        { title: "Artifact-Based", desc: "Receive summaries and vocab after every lesson.", icon: <Rocket size={40} /> }
                    ].map((feature, i) => (
                        <div key={i} className="bg-white p-10 rounded-3xl shadow-lg border border-gray-100 hover:border-indigo-100 transition-colors">
                            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-6 shadow-inner ring-1 ring-white/10">
                                {feature.icon}
                            </div>
                            <h3 className="text-2xl font-black text-gray-800 mb-4">{feature.title}</h3>
                            <p className="text-gray-600 font-medium leading-relaxed">{feature.desc}</p>
                        </div>
                    ))}
                </section>
            </main>
        </div>
    );
};

export default LandingPage;
