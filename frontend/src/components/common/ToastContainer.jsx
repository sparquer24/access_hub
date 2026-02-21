import React, { useEffect } from 'react';
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react';

const Toast = ({ id, message, type, duration, removeToast }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            removeToast(id);
        }, duration);

        return () => clearTimeout(timer);
    }, [id, duration, removeToast]);

    const icons = {
        success: <CheckCircle className="w-5 h-5 text-white" />,
        error: <AlertCircle className="w-5 h-5 text-white" />,
        warning: <AlertTriangle className="w-5 h-5 text-white" />,
        info: <Info className="w-5 h-5 text-white" />,
    };

    const bgColors = {
        success: 'bg-teal-600 border-teal-500',
        error: 'bg-red-600 border-red-500',
        warning: 'bg-orange-600 border-orange-500',
        info: 'bg-blue-600 border-blue-500',
    };

    return (
        <div
            className={`flex items-center w-full max-w-xs p-4 space-x-3 text-white rounded-xl shadow-2xl border ${bgColors[type]} transition-all duration-300 transform translate-x-0 opacity-100 animate-slide-in-right mb-3`}
            role="alert"
        >
            <div className="flex-shrink-0">{icons[type]}</div>
            <div className="ml-3 text-sm font-medium">{message}</div>
            <button
                type="button"
                className="ml-auto -mx-1.5 -my-1.5 text-white/70 hover:text-white rounded-lg p-1.5 hover:bg-white/20 inline-flex items-center justify-center h-8 w-8 transition-colors"
                aria-label="Close"
                onClick={() => removeToast(id)}
            >
                <span className="sr-only">Close</span>
                <X className="w-4 h-4" />
            </button>
        </div>
    );
};

const ToastContainer = ({ toasts, removeToast }) => {
    return (
        <div className="fixed top-5 right-5 z-50 flex flex-col items-end">
            {toasts.map((toast) => (
                <Toast key={toast.id} {...toast} removeToast={removeToast} />
            ))}
        </div>
    );
};

export default ToastContainer;
