import type { Teacher } from '../services/teacherService';
import { Globe, Play, User as UserIcon } from 'lucide-react';
import { useLanguage } from '../i18n';

interface Props {
    teacher: Teacher;
}

const TeacherProfile = ({ teacher }: Props) => {
    const { t } = useLanguage();

    return (
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-8 max-w-4xl mx-auto my-8 sm:my-12 border border-gray-100 transition-all hover:shadow-xl">
            <div className="flex flex-col md:flex-row gap-6 sm:gap-8 items-start">
                <div className="w-full md:w-1/3 flex flex-col items-center gap-3 sm:gap-4">
                    <div className="w-32 h-32 sm:w-48 sm:h-48 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md">
                        <UserIcon size={60} strokeWidth={1.5} />
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 text-center">{teacher.name}</h2>
                    <div className="flex flex-wrap justify-center gap-2 mt-2">
                        {teacher.languages.map((lang, idx) => (
                            <span key={idx} className="px-3 py-1 bg-indigo-50 text-indigo-700 text-sm font-medium rounded-full border border-indigo-100 flex items-center gap-1.5">
                                <Globe size={14} />
                                {lang}
                            </span>
                        ))}
                    </div>
                    <div className="mt-4 px-6 py-2 bg-green-50 text-green-700 font-bold text-xl rounded-lg border border-green-100">
                        ${teacher.price_per_hour}{t('teacher.pricePerHour')}
                    </div>
                </div>

                <div className="w-full md:w-2/3 flex flex-col gap-8">
                    <div className="prose prose-indigo max-w-none">
                        <h3 className="text-xl font-semibold text-gray-800 mb-3 flex items-center gap-2">
                            <span className="w-1.5 h-6 bg-indigo-600 rounded-full"></span>
                            {t('teacher.aboutMe')}
                        </h3>
                        <p className="text-gray-600 leading-relaxed text-lg whitespace-pre-line">
                            {teacher.bio || t('teacher.noBio')}
                        </p>
                    </div>

                    {teacher.video_url && (
                        <div className="mt-4">
                            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                <span className="w-1.5 h-6 bg-purple-600 rounded-full"></span>
                                {t('teacher.introVideo')}
                            </h3>
                            <div className="relative aspect-video rounded-2xl overflow-hidden bg-gray-900 shadow-inner ring-1 ring-white/10">
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Play size={48} className="text-white/60 drop-shadow-lg" />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TeacherProfile;
