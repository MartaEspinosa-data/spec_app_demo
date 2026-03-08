import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { teacherService } from '../services/teacherService';
import type { Teacher } from '../services/teacherService';
import BookingCalendar from '../components/BookingCalendar';
import { ChevronLeft, Info, HelpCircle } from 'lucide-react';

const BookingPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [teacher, setTeacher] = useState<Teacher | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTeacher = async () => {
            if (!id) return;
            try {
                const t = await teacherService.getTeacher(id);
                setTeacher(t);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchTeacher();
    }, [id]);

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen bg-white">
            <div className="text-2xl font-black text-indigo-600 animate-pulse uppercase tracking-widest">Opening Calendar...</div>
        </div>
    );

    if (!teacher) return null;

    return (
        <div className="bg-[#f0f2f5] min-h-screen pb-20">
            <header className="bg-white/80 backdrop-blur-md shadow-sm fixed top-0 w-full z-50 border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-indigo-600 transition flex items-center gap-1 font-bold tracking-tight">
                        <ChevronLeft size={20} />
                        Cancel Booking
                    </button>
                    <div className="flex items-center gap-4">
                        <span className="px-4 py-1.5 bg-green-50 text-green-700 text-sm font-bold uppercase tracking-wider rounded-full border border-green-100 shadow-sm animate-pulse">
                            Price locked: ${teacher.price_per_hour}/hr
                        </span>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 pt-32 grid grid-cols-1 lg:grid-cols-12 gap-12">
                <div className="lg:col-span-4 flex flex-col gap-8 order-2 lg:order-1">
                    <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100">
                        <h2 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-3">
                            <Info size={24} className="text-indigo-600" />
                            Next Steps
                        </h2>
                        <ol className="flex flex-col gap-6 list-none p-0">
                            {[
                                "Select a time slot that works best for you.",
                                "Confirm your details and continue to payment.",
                                "Securely pay via Stripe to guarantee your slot.",
                                "Get an email with the link to your virtual classroom."
                            ].map((step, i) => (
                                <li key={i} className="flex gap-4 items-start">
                                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-black border border-indigo-100 shadow-inner">
                                        {i + 1}
                                    </span>
                                    <span className="text-gray-600 font-medium leading-normal pt-0.5">{step}</span>
                                </li>
                            ))}
                        </ol>
                    </div>

                    <div className="bg-indigo-600 p-8 rounded-3xl shadow-xl text-white relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                            <HelpCircle size={100} />
                        </div>
                        <h3 className="text-xl font-black mb-3 text-indigo-100 uppercase tracking-wider">Need Help?</h3>
                        <p className="font-medium text-white/80 leading-relaxed mb-6">Contact support if you have questions about lesson types or durations.</p>
                        <button className="w-full py-3 bg-white text-indigo-600 font-bold rounded-xl shadow-lg hover:shadow-white/20 hover:-translate-y-1 transition-all active:scale-95">Chat Support</button>
                    </div>
                </div>

                <div className="lg:col-span-8 order-1 lg:order-2">
                    <div className="mb-8 pl-4">
                        <h1 className="text-4xl font-black text-gray-900 mb-2">Schedule with {teacher.name}</h1>
                        <p className="text-lg text-gray-500 font-medium">All times are shown in your local timezone.</p>
                    </div>
                    <BookingCalendar url={teacher.calendly_url || ""} />
                </div>
            </main>
        </div>
    );
};

export default BookingPage;
