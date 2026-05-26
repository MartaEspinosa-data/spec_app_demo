import { createContext, useContext, useState, useCallback, createElement } from 'react';
import type { ReactNode } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

// --- Types ---
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
    id: string;
    type: ToastType;
    message: string;
}

interface ToastContextValue {
    addToast: (type: ToastType, message: string) => void;
    removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

// --- Helpers ---
let toastId = 0;
function nextId(): string {
    return `toast-${++toastId}-${Date.now()}`;
}

const TOAST_ICONS: Record<ToastType, typeof CheckCircle2> = {
    success: CheckCircle2,
    error: XCircle,
    warning: AlertTriangle,
    info: Info,
};

const TOAST_STYLES: Record<ToastType, string> = {
    success: 'border-green-200 bg-green-50 text-green-800',
    error: 'border-red-200 bg-red-50 text-red-800',
    warning: 'border-amber-200 bg-amber-50 text-amber-800',
    info: 'border-blue-200 bg-blue-50 text-blue-800',
};

const TOAST_ICON_COLORS: Record<ToastType, string> = {
    success: 'text-green-500',
    error: 'text-red-500',
    warning: 'text-amber-500',
    info: 'text-blue-500',
};

const AUTO_DISMISS: Partial<Record<ToastType, number>> = {
    success: 5000,
    info: 5000,
    // errors and warnings persist until dismissed
};

// --- Provider ---
export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const addToast = useCallback(
        (type: ToastType, message: string) => {
            const id = nextId();
            setToasts((prev) => [...prev.slice(-4), { id, type, message }]); // max 5 visible

            // Auto-dismiss for success/info
            const delay = AUTO_DISMISS[type];
            if (delay) {
                setTimeout(() => removeToast(id), delay);
            }
        },
        [removeToast]
    );

    return createElement(
        ToastContext.Provider,
        { value: { addToast, removeToast } },
        children,
        // Toast container — fixed at bottom-right
        createElement(
            'div',
            {
                className:
                    'fixed bottom-6 right-6 z-[9999] flex flex-col-reverse gap-3 pointer-events-none',
                'aria-live': 'polite',
            },
            toasts.map((toast) => {
                const Icon = TOAST_ICONS[toast.type];
                return createElement(
                    'div',
                    {
                        key: toast.id,
                        className: `pointer-events-auto flex items-start gap-3 px-5 py-4 rounded-2xl border shadow-lg backdrop-blur-sm max-w-sm animate-slide-in ${TOAST_STYLES[toast.type]}`,
                        role: 'alert',
                    },
                    createElement(Icon, {
                        size: 20,
                        className: `shrink-0 mt-0.5 ${TOAST_ICON_COLORS[toast.type]}`,
                    }),
                    createElement(
                        'span',
                        { className: 'text-sm font-semibold flex-1' },
                        toast.message
                    ),
                    createElement(
                        'button',
                        {
                            onClick: () => removeToast(toast.id),
                            className: 'shrink-0 opacity-50 hover:opacity-100 transition ml-2',
                            'aria-label': 'Dismiss',
                        },
                        createElement(X, { size: 16 })
                    )
                );
            })
        )
    );
}

// --- Hook ---
export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used within a ToastProvider');
    return ctx;
}
