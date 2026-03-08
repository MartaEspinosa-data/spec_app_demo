import { Link } from 'react-router-dom';
import { Calendar, BookOpen, Clock, Settings } from 'lucide-react';

const DashboardPage = () => {
    return (
        <div className="flex min-h-screen bg-gray-50">
            <aside className="w-64 bg-white border-r border-gray-200 p-6 flex flex-col gap-8">
                <div className="text-xl font-black text-indigo-600 tracking-tighter uppercase">HolaLingo</div>
                <nav className="flex flex-col gap-2">
                    {[
                        { name: 'Lessons', icon: <Calendar size={20} />, active: true },
                        { name: 'Materials', icon: <BookOpen size={20} /> },
                        { name: 'Progress', icon: <Clock size={20} /> },
                        { name: 'Settings', icon: <Settings size={20} /> }
                    ].map((item, i) => (
                        <button key={i} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${item.active ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500 hover:bg-gray-50'}`}>
                            {item.icon}
                            {item.name}
                        </button>
                    ))}
                </nav>
            </aside>

            <main className="flex-1 p-12">
                <header className="mb-12">
                    <h1 className="text-4xl font-black text-gray-900 mb-2">My Lessons</h1>
                    <p className="text-gray-500 font-medium">Keep track of your upcoming Spanish sessions.</p>
                </header>

                <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-20 text-center">
                    <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-8 text-gray-300">
                        <Calendar size={48} />
                    </div>
                    <h2 className="text-2xl font-black text-gray-800 mb-4">No Upcoming Lessons</h2>
                    <p className="text-gray-500 max-w-sm mx-auto mb-10 font-medium">You haven't booked any lessons yet. Start your journey with a professional teacher today.</p>
                    <Link to="/" className="px-10 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition shadow-xl">
                        Browse Teachers
                    </Link>
                </div>
            </main>
        </div>
    );
};

export default DashboardPage;
