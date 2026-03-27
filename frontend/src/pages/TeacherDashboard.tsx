import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Settings, Calendar, LogOut, Home, BookOpen, User, Clock, DollarSign } from 'lucide-react';
import LanguageSelector from '../components/LanguageSelector';
import { TeacherAvailabilityGrid } from '../components/calendar/TeacherAvailabilityGrid';
import axios from 'axios';

interface LessonInfo {
    id: string;
    student_name: string;
    student_email: string;
    lesson_type: string;
    start_time: string;
    duration: number;
    price: number;
    status: string;
}

const TEACHER_ID = "dc92ef71-d458-4e75-92d9-69b64fc1c964";

const TeacherDashboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'availability' | 'lessons'>('availability');
    const [lessons, setLessons] = useState<LessonInfo[]>([]);
    const [loadingLessons, setLoadingLessons] = useState(false);

    useEffect(() => {
        if (!localStorage.getItem('teacher_auth')) {
            navigate('/teacher/login');
        }
    }, [navigate]);

    useEffect(() => {
        if (activeTab === 'lessons') {
            fetchLessons();
        }
    }, [activeTab]);

    const fetchLessons = async () => {
        setLoadingLessons(true);
        try {
            const res = await axios.get(`http://localhost:8000/api/lessons/teacher/${TEACHER_ID}`);
            setLessons(res.data.lessons);
        } catch (err) {
            console.error('Error fetching lessons:', err);
        } finally {
            setLoadingLessons(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('teacher_auth');
        navigate('/teacher/login');
    };

    const formatDate = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleDateString('en-GB', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            timeZone: 'Europe/Madrid',
        });
    };

    const formatTime = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Europe/Madrid',
        });
    };

    const statusColor = (status: string) => {
        switch (status) {
            case 'scheduled': return 'bg-green-100 text-green-700';
            case 'pending': return 'bg-yellow-100 text-yellow-700';
            case 'completed': return 'bg-blue-100 text-blue-700';
            case 'cancelled': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

    const navItems = [
        { name: 'Availability', icon: <Calendar size={20} />, key: 'availability' as const },
        { name: 'Lessons', icon: <BookOpen size={20} />, key: 'lessons' as const },
    ];

    return (
        <div className="flex min-h-screen bg-gray-50">
            <aside className="w-64 bg-white border-r border-gray-200 p-6 flex flex-col gap-8">
                <div className="flex items-center justify-between">
                    <div className="text-xl font-black text-indigo-600 tracking-tighter uppercase">TEACHER PRO</div>
                    <div className="flex items-center gap-4">
                        <LanguageSelector />
                        <Link to="/" className="text-gray-400 hover:text-indigo-600 transition flex items-center gap-1 font-bold text-sm" title="Return to Site">
                            <Home size={18} />
                        </Link>
                        <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 transition" title="Logout">
                            <LogOut size={20} />
                        </button>
                    </div>
                </div>
                <nav className="flex flex-col gap-2">
                    {navItems.map((item, i) => (
                        <button
                            key={i}
                            onClick={() => setActiveTab(item.key)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === item.key ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                            {item.icon}
                            {item.name}
                        </button>
                    ))}
                </nav>
            </aside>

            <main className="flex-1 p-12">
                <header className="mb-12">
                    <h1 className="text-4xl font-black text-gray-900 mb-2">
                        {activeTab === 'availability' ? 'Manage Availability' : 'Scheduled Lessons'}
                    </h1>
                    <p className="text-gray-500 font-medium">
                        {activeTab === 'availability'
                            ? 'Set your weekly availability for students to book.'
                            : 'View all lessons that students have booked.'}
                    </p>
                </header>

                {activeTab === 'availability' ? (
                    <div className="flex justify-center">
                        <TeacherAvailabilityGrid teacherId={TEACHER_ID} />
                    </div>
                ) : (
                    <div className="max-w-5xl">
                        {loadingLessons ? (
                            <div className="text-center py-20 text-gray-400 font-bold text-lg">Loading lessons...</div>
                        ) : lessons.length === 0 ? (
                            <div className="text-center py-20">
                                <BookOpen size={48} className="text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-400 font-bold text-lg">No lessons booked yet</p>
                                <p className="text-gray-300 text-sm mt-2">When students book lessons, they will appear here.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between mb-6">
                                    <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">
                                        {lessons.length} lesson{lessons.length !== 1 ? 's' : ''} total
                                    </p>
                                    <p className="text-xs text-gray-400">Times shown in Europe/Madrid</p>
                                </div>
                                {lessons.map((lesson) => (
                                    <div key={lesson.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all p-6">
                                        <div className="flex items-start justify-between flex-wrap gap-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center">
                                                    <User size={22} className="text-indigo-500" />
                                                </div>
                                                <div>
                                                    <h3 className="font-black text-gray-900 text-lg">{lesson.student_name}</h3>
                                                    <p className="text-gray-400 text-sm font-medium">{lesson.student_email}</p>
                                                </div>
                                            </div>
                                            <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider ${statusColor(lesson.status)}`}>
                                                {lesson.status}
                                            </span>
                                        </div>
                                        <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div className="flex items-center gap-2 text-sm">
                                                <Calendar size={16} className="text-gray-400" />
                                                <span className="font-bold text-gray-700">{formatDate(lesson.start_time)}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm">
                                                <Clock size={16} className="text-gray-400" />
                                                <span className="font-bold text-gray-700">{formatTime(lesson.start_time)} · {lesson.duration} min</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm">
                                                <BookOpen size={16} className="text-gray-400" />
                                                <span className="font-bold text-gray-700">{lesson.lesson_type}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm">
                                                <DollarSign size={16} className="text-gray-400" />
                                                <span className="font-bold text-gray-700">${lesson.price.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

export default TeacherDashboard;
