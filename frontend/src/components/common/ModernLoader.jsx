import React from 'react';
import { Brain, Sparkles, Zap, Loader2 } from 'lucide-react';

const ModernLoader = ({
    type = 'spinner',
    size = 'md',
    color = 'teal',
    text = '',
    className = ''
}) => {
    const sizeMap = {
        xs: 'w-4 h-4',
        sm: 'w-6 h-6',
        md: 'w-10 h-10',
        lg: 'w-16 h-16',
        xl: 'w-24 h-24'
    };

    const iconSizeMap = {
        xs: 12,
        sm: 16,
        md: 24,
        lg: 32,
        xl: 48
    };

    const colorMap = {
        teal: 'border-teal-600 text-teal-600',
        blue: 'border-blue-600 text-blue-600',
        indigo: 'border-indigo-600 text-indigo-600',
        purple: 'border-purple-600 text-purple-600',
        white: 'border-white text-white',
        ai: 'border-violet-500 text-violet-500'
    };

    const textColorMap = {
        teal: 'text-teal-700',
        blue: 'text-blue-700',
        indigo: 'text-indigo-700',
        purple: 'text-purple-700',
        white: 'text-white',
        ai: 'text-violet-700'
    };

    if (type === 'ai' || type === 'ai-spinner') {
        const isSpinner = type === 'ai-spinner';
        return (
            <div className={`flex flex-col items-center justify-center gap-4 ${className}`}>
                <div className="relative flex items-center justify-center">
                    {/* Outer Rotating Ring */}
                    <div className={`${sizeMap[size]} rounded-full border-2 border-transparent border-t-cyan-500 border-r-teal-500 animate-spin`}></div>

                    {/* Inner Pulsing Ring */}
                    <div className={`absolute inset-0 ${sizeMap[size]} rounded-full border-2 border-cyan-200 opacity-50 animate-pulse`}></div>

                    {/* Central Brain Icon */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Brain
                            size={iconSizeMap[size] || 24}
                            className="text-cyan-600 animate-pulse drop-shadow-[0_0_8px_rgba(8,145,178,0.5)]"
                            strokeWidth={1.5}
                        />
                    </div>

                    {/* Orbiting Sparkle */}
                    <div className={`absolute inset-0 ${sizeMap[size]} animate-spin-slow`}>
                        <div className="absolute -top-1 left-1/2 -translate-x-1/2">
                            <Sparkles size={8} className="text-teal-400 animate-ping" />
                        </div>
                    </div>
                </div>
                {text && (
                    <div className="flex flex-col items-center gap-1">
                        <span className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-cyan-600 tracking-wider animate-pulse uppercase">
                            {text}
                        </span>
                        <div className="flex gap-1">
                            <div className="w-1 h-1 rounded-full bg-cyan-400 animate-bounce delay-0"></div>
                            <div className="w-1 h-1 rounded-full bg-teal-500 animate-bounce delay-150"></div>
                            <div className="w-1 h-1 rounded-full bg-cyan-600 animate-bounce delay-300"></div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    if (type === 'pulse') {
        return (
            <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
                <div className="relative">
                    <div className={`${sizeMap[size]} rounded-full bg-teal-600/20 animate-ping absolute inset-0`}></div>
                    <div className={`${sizeMap[size]} rounded-full bg-teal-600 shadow-lg relative z-10`}></div>
                </div>
                {text && <p className={`text-sm font-semibold animate-pulse ${textColorMap[color]}`}>{text}</p>}
            </div>
        );
    }

    if (type === 'skeleton') {
        return (
            <div className={`animate-pulse bg-gray-200 rounded-xl ${className}`}></div>
        );
    }

    // Default Premium Morphing Spinner
    const borderColorClass = colorMap[color] ? colorMap[color].split(' ')[0] : 'border-teal-600';

    return (
        <div className={`flex flex-col items-center justify-center gap-4 ${className}`}>
            <div className="relative">
                {/* Background Ring */}
                <div className={`${sizeMap[size]} border-4 border-gray-100 rounded-full`}></div>
                {/* Animated Active Ring */}
                <div className={`absolute top-0 left-0 ${sizeMap[size]} border-4 ${borderColorClass} border-t-transparent rounded-full animate-spin shadow-sm`}></div>
                {/* Inner Glow */}
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-current rounded-full blur-[2px] animate-pulse ${textColorMap[color]}`}></div>
            </div>
            {text && (
                <div className="flex flex-col items-center">
                    <p className={`text-sm font-bold tracking-wide ${textColorMap[color]} animate-pulse`}>
                        {text}
                    </p>
                    <div className="flex gap-1 mt-1">
                        <div className="w-1 h-1 bg-current rounded-full animate-[bounce_1.4s_infinite_0ms]"></div>
                        <div className="w-1 h-1 bg-current rounded-full animate-[bounce_1.4s_infinite_200ms]"></div>
                        <div className="w-1 h-1 bg-current rounded-full animate-[bounce_1.4s_infinite_400ms]"></div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ModernLoader;
