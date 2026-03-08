import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center">
                    <div className="w-24 h-24 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-8 shadow-inner">
                        <AlertTriangle size={48} />
                    </div>
                    <h1 className="text-4xl font-black text-gray-900 mb-4 px-4 py-2 bg-red-50 rounded-2xl border border-red-100 shadow-sm inline-block">System Interruption</h1>
                    <p className="text-gray-500 max-w-md mx-auto mb-10 font-medium">Something went wrong. Don't worry, your progress is safe. Try refreshing the page to reconnect.</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="flex items-center gap-3 px-10 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition shadow-xl hover:shadow-indigo-500/30 active:scale-95 group"
                    >
                        <RotateCcw size={20} className="group-hover:rotate-45 transition-transform" />
                        Refresh App
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
