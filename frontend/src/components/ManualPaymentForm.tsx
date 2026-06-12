import { CheckCircle, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const GOOGLE_MEET_LINK = "https://meet.google.com/pyv-dxwi-mxc";

interface PaymentSuccessInlineProps {
    type: 'lesson' | 'package';
    onNavigate?: () => void;
}

export const PaymentSuccessInline = ({ type, onNavigate }: PaymentSuccessInlineProps) => (
    <div className="text-center py-8 space-y-6">
        <CheckCircle size={64} className="text-green-500 mx-auto animate-bounce" />
        <div>
            <h3 className="text-2xl font-black text-gray-900 mb-2">{type === 'lesson' ? '¡Reserva Confirmada!' : '¡Paquete Adquirido!'}</h3>
            <p className="text-gray-500 font-medium">{type === 'lesson' ? 'Your lesson has been booked successfully. You will receive a confirmation email shortly.' : 'Your 5-lesson package is ready to use.'}</p>
        </div>

        {type === 'lesson' ? (
            <>
                <a
                    href={GOOGLE_MEET_LINK}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-3 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg shadow-xl hover:bg-indigo-700 hover:shadow-indigo-500/40 hover:-translate-y-1 transition-all"
                >
                    📹 Join Google Meet
                </a>
                <p className="text-xs text-gray-400 font-mono">{GOOGLE_MEET_LINK}</p>
                <p className="text-sm text-gray-500">
                    📧 A confirmation email with the lesson link has been sent to your inbox.
                </p>
            </>
        ) : (
            <div className="bg-green-50 p-6 rounded-2xl border border-green-100 flex items-center gap-4">
                <Sparkles size={32} className="text-green-600" />
                <div className="text-left">
                    <p className="font-bold text-green-800">5 Lesson Credits Added</p>
                    <p className="text-sm text-green-600">You can now schedule your classes from your dashboard.</p>
                </div>
            </div>
        )}

        <button
            onClick={() => {
                if (onNavigate) onNavigate();
            }}
            className="px-8 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition"
        >
            Go to Dashboard
        </button>
    </div>
);
