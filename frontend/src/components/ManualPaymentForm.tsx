import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Banknote, Shield, CheckCircle, Loader2, Sparkles } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../config';

const GOOGLE_MEET_LINK = "https://meet.google.com/pyv-dxwi-mxc";

const TEACHER_EMAIL = "martaespinosagarcia@gmail.com";

interface ManualPaymentFormProps {
    type: 'lesson' | 'package';
    lessonId: string;
    price: number;
    duration: number;
    onSuccess: () => void;
    onCancel: () => void;
}

const ManualPaymentForm = ({ type, lessonId, price, duration, onSuccess, onCancel }: ManualPaymentFormProps) => {
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [enteredAmount, setEnteredAmount] = useState<string>('');
    const [amountError, setAmountError] = useState<string | null>(null);

    const expectedPrice = price;

    const handleAmountChange = (value: string) => {
        // Allow only numbers and one decimal point
        const sanitized = value.replace(/[^0-9.]/g, '');
        // Prevent multiple decimal points
        const parts = sanitized.split('.');
        const cleaned = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : sanitized;
        setEnteredAmount(cleaned);

        const numVal = parseFloat(cleaned);
        if (cleaned === '' || isNaN(numVal)) {
            setAmountError(null);
        } else if (Math.abs(numVal - expectedPrice) > 0.01) {
            setAmountError(`Incorrect amount. The expected amount is $${expectedPrice.toFixed(2)}. Please enter the exact amount you transferred.`);
        } else {
            setAmountError(null);
        }
    };

    const isAmountValid = enteredAmount !== '' && !isNaN(parseFloat(enteredAmount)) && Math.abs(parseFloat(enteredAmount) - expectedPrice) <= 0.01;

    const handleConfirm = async () => {
        setProcessing(true);
        setError(null);
        try {
            if (type === 'lesson') {
                await axios.post(`${API_URL}/lessons/confirm-payment`, {
                    lesson_id: lessonId,
                });
            } else {
                await axios.post(`${API_URL}/packages/confirm`, {
                    package_id: lessonId,
                });
            }
            onSuccess();
        } catch (err) {
            console.error('Confirm error:', err);
            setError('Failed to confirm booking. Please try again.');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-indigo-50 rounded-2xl p-4 flex items-center justify-between">
                <div>
                    <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">{type === 'lesson' ? 'Lesson' : 'Package'} Total</p>
                    <p className="text-3xl font-black text-indigo-600">${price.toFixed(2)}</p>
                </div>
                <div className="text-right">
                    <p className="text-sm text-gray-500">{duration} min {type === 'lesson' ? 'lesson' : 'classes'}</p>
                    <div className="flex items-center gap-1 text-green-600 text-xs font-bold mt-1">
                        <Shield size={12} />
                        Manual payment
                    </div>
                </div>
            </div>

            <div className="bg-amber-50 rounded-2xl border border-amber-200 p-5 space-y-3">
                <div className="flex items-center gap-2 text-amber-700 font-bold">
                    <Banknote size={20} />
                    <span>Manual Payment Instructions</span>
                </div>
                <p className="text-sm text-amber-800 leading-relaxed">
                    Please send the payment of <strong>${price.toFixed(2)}</strong> via bank transfer or Payoneer to:
                </p>
                <div className="bg-white rounded-xl p-3 border border-amber-100 text-sm font-mono text-gray-700">
                    📧 {TEACHER_EMAIL}
                </div>
                <p className="text-xs text-amber-600">
                    Your booking will be confirmed once the teacher approves the payment. You will receive a confirmation email.
                </p>
            </div>

            <div className="space-y-2">
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest ml-1">
                    Amount You Transferred
                </label>
                <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg">$</span>
                    <input
                        type="text"
                        inputMode="decimal"
                        placeholder={expectedPrice.toFixed(2)}
                        value={enteredAmount}
                        onChange={(e) => handleAmountChange(e.target.value)}
                        className="w-full pl-8 pr-4 py-3 sm:py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-indigo-600 focus:bg-white transition-all outline-none font-bold text-gray-700 text-sm sm:text-base"
                    />
                </div>
                {amountError && (
                    <p className="text-xs sm:text-sm font-bold text-red-600 bg-red-50 px-3 py-2 rounded-xl border border-red-100">
                        {amountError}
                    </p>
                )}
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold text-center">
                    {error}
                </div>
            )}

            <div className="flex gap-3">
                <button
                    type="button"
                    onClick={onCancel}
                    className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200 transition-all"
                >
                    Cancel
                </button>
                <div className="flex-[2]">
                    <button
                        onClick={handleConfirm}
                        disabled={processing || !isAmountValid}
                        className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-xl hover:bg-indigo-700 hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                    >
                        {processing ? (
                            <>
                                <Loader2 size={20} className="animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <Banknote size={20} />
                                Confirm Booking (${price.toFixed(2)})
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

interface PaymentSuccessInlineProps {
    type: 'lesson' | 'package';
    onNavigate?: () => void;
}

const PaymentSuccessInline = ({ type, onNavigate }: PaymentSuccessInlineProps) => (
    <div className="text-center py-8 space-y-6">
        <CheckCircle size={64} className="text-green-500 mx-auto animate-bounce" />
        <div>
            <h3 className="text-2xl font-black text-gray-900 mb-2">{type === 'lesson' ? '¡Reserva Confirmada!' : '¡Paquete Adquirido!'}</h3>
            <p className="text-gray-500 font-medium">{type === 'lesson' ? 'Your lesson has been booked successfully. The teacher will confirm it shortly.' : 'Your 5-lesson package is ready to use.'}</p>
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

interface EmbeddedCheckoutProps {
    type?: 'lesson' | 'package';
    clientSecret: string | null;
    lessonId: string;
    price: number;
    duration: number;
    onCancel: () => void;
    onPaymentSuccess?: () => void;
}

export const EmbeddedCheckout = ({ type = 'lesson', clientSecret: _clientSecret, lessonId, price, duration, onCancel, onPaymentSuccess }: EmbeddedCheckoutProps) => {
    const navigate = useNavigate();
    const [success, setSuccess] = useState(false);

    const handleSuccess = () => {
        setSuccess(true);
        if (onPaymentSuccess) onPaymentSuccess();
    };

    if (success) {
        return <PaymentSuccessInline type={type} onNavigate={() => navigate('/dashboard')} />;
    }

    return (
        <ManualPaymentForm
            type={type}
            lessonId={lessonId}
            price={price}
            duration={duration}
            onSuccess={handleSuccess}
            onCancel={onCancel}
        />
    );
};
