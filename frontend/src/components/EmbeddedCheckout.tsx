import { useState } from 'react';
import { useStripe, useElements, PaymentElement, Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { CreditCard, Shield, CheckCircle, Loader2, Sparkles } from 'lucide-react';
import axios from 'axios';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const GOOGLE_MEET_LINK = "https://meet.google.com/pyv-dxwi-mxc";

interface CheckoutFormProps {
    type: 'lesson' | 'package';
    lessonId: string; // for packages this is packageId
    price: number;
    duration: number;
    onSuccess: () => void;
    onCancel: () => void;
}

const CheckoutForm = ({ type, lessonId, price, duration, onSuccess, onCancel }: CheckoutFormProps) => {
    const stripe = useStripe();
    const elements = useElements();
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!stripe || !elements) return;

        setProcessing(true);
        setError(null);

        const result = await stripe.confirmPayment({
            elements,
            redirect: 'if_required',
        });

        if (result.error) {
            setError(result.error.message || 'Payment failed. Please try again.');
            setProcessing(false);
        } else if (result.paymentIntent?.status === 'succeeded') {
            try {
                if (type === 'lesson') {
                    await axios.post('http://localhost:8000/api/lessons/confirm-payment', {
                        lesson_id: lessonId,
                    });
                } else {
                    await axios.post('http://localhost:8000/api/packages/confirm', {
                        package_id: lessonId,
                    });
                }
            } catch (err) {
                console.error('Confirm error:', err);
            }
            onSuccess();
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-indigo-50 rounded-2xl p-4 flex items-center justify-between">
                <div>
                    <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">{type === 'lesson' ? 'Lesson' : 'Package'} Total</p>
                    <p className="text-3xl font-black text-indigo-600">${price.toFixed(2)}</p>
                </div>
                <div className="text-right">
                    <p className="text-sm text-gray-500">{duration} min {type === 'lesson' ? 'lesson' : 'classes'}</p>
                    <div className="flex items-center gap-1 text-green-600 text-xs font-bold mt-1">
                        <Shield size={12} />
                        Secure payment
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <PaymentElement
                    options={{
                        layout: 'tabs',
                    }}
                />
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
                <div className="flex-[2] flex flex-col gap-2">
                    <button
                        type="submit"
                        disabled={!stripe || processing}
                        className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-xl hover:bg-indigo-700 hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                    >
                        {processing ? (
                            <>
                                <Loader2 size={20} className="animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <CreditCard size={20} />
                                Pay ${price.toFixed(2)}
                            </>
                        )}
                    </button>
                    {/* Simulation Button for Testing */}
                    <button
                        type="button"
                        onClick={async () => {
                            setProcessing(true);
                            try {
                                if (type === 'lesson') {
                                    await axios.post('http://localhost:8000/api/lessons/confirm-payment', { lesson_id: lessonId });
                                } else {
                                    await axios.post('http://localhost:8000/api/packages/confirm', { package_id: lessonId });
                                }
                                onSuccess();
                            } catch (err) {
                                console.error(err);
                                setError('Simulation failed.');
                            } finally {
                                setProcessing(false);
                            }
                        }}
                        className="w-full py-2 bg-yellow-50 text-yellow-700 rounded-xl font-bold text-xs hover:bg-yellow-100 transition border border-yellow-200"
                    >
                        Simulate Payment Success (Demo Only)
                    </button>
                </div>
            </div>
        </form>
    );
};

interface PaymentSuccessInlineProps {
    type: 'lesson' | 'package';
}

const PaymentSuccessInline = ({ type }: PaymentSuccessInlineProps) => (
    <div className="text-center py-8 space-y-6">
        <CheckCircle size={64} className="text-green-500 mx-auto animate-bounce" />
        <div>
            <h3 className="text-2xl font-black text-gray-900 mb-2">{type === 'lesson' ? '¡Reserva Confirmada!' : '¡Paquete Adquirido!'}</h3>
            <p className="text-gray-500 font-medium">{type === 'lesson' ? 'Your lesson has been booked successfully.' : 'Your 5-lesson package is ready to use.'}</p>
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
                window.location.href = '/dashboard';
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

export const EmbeddedCheckout = ({ type = 'lesson', clientSecret, lessonId, price, duration, onCancel, onPaymentSuccess }: EmbeddedCheckoutProps) => {
    const [success, setSuccess] = useState(false);

    const handleSuccess = () => {
        setSuccess(true);
        if (onPaymentSuccess) onPaymentSuccess();
    };

    if (success) {
        return <PaymentSuccessInline type={type} />;
    }

    if (!clientSecret) {
        // Demo fallback when Stripe isn't configured
        return (
            <div className="text-center py-8 space-y-6">
                <CreditCard size={48} className="text-indigo-400 mx-auto" />
                <p className="text-gray-500">Stripe is not configured. Demo mode.</p>
                <button
                        onClick={async () => {
                            try {
                                if (type === 'lesson') {
                                    await axios.post('http://localhost:8000/api/lessons/confirm-payment', { lesson_id: lessonId });
                                } else {
                                    await axios.post('http://localhost:8000/api/packages/confirm', { package_id: lessonId });
                                }
                            } catch (err) { console.error(err); }
                            setSuccess(true);
                        }}
                        className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-xl hover:bg-indigo-700 transition-all"
                    >
                        Simulate Payment (${price.toFixed(2)})
                    </button>
            </div>
        );
    }

    return (
        <Elements
            stripe={stripePromise}
            options={{
                clientSecret,
                appearance: {
                    theme: 'stripe',
                    variables: {
                        colorPrimary: '#4f46e5',
                        borderRadius: '12px',
                        fontFamily: 'system-ui, sans-serif',
                    },
                },
            }}
        >
            <CheckoutForm
                type={type}
                lessonId={lessonId}
                price={price}
                duration={duration}
                onSuccess={handleSuccess}
                onCancel={onCancel}
            />
        </Elements>
    );
};
