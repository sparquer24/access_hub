import React from 'react';

/**
 * A reusable statistic card with glassmorphism and hover effects.
 * 
 * @param {string} title - The title of the card
 * @param {string|number} value - The main statistic value
 * @param {string} icon - The primary emoji or icon
 * @param {string} secondaryIcon - The secondary small icon inside the circle
 * @param {string} color - The theme color (indigo, purple, blue, green, etc.)
 * @param {string} subtitle - Secondary text string or a React node
 * @param {function} onClick - Click handler
 * @param {boolean} loading - Loading state
 */
const StatCard = ({
    title,
    value,
    icon,
    secondaryIcon,
    color = 'indigo',
    subtitle,
    onClick,
    loading = false
}) => {
    // Map color names to Tailwind classes
    const colorMap = {
        indigo: {
            borderHover: 'hover:border-teal-400/50',
            bgGradient: 'from-teal-500/5 to-teal-500/5',
            iconBg: 'bg-teal-100 group-hover:bg-teal-200',
            textGradient: 'from-teal-600 to-teal-600',
        },
        purple: {
            borderHover: 'hover:border-purple-400/50',
            bgGradient: 'from-cyan-500/5 to-pink-500/5',
            iconBg: 'bg-teal-100 group-hover:bg-teal-200',
            textGradient: 'from-cyan-600 to-pink-600',
        },
        blue: {
            borderHover: 'hover:border-blue-400/50',
            bgGradient: 'from-blue-500/5 to-cyan-500/5',
            iconBg: 'bg-blue-100 group-hover:bg-blue-200',
            textGradient: 'from-blue-600 to-cyan-600',
        },
        green: {
            borderHover: 'hover:border-emerald-400/50',
            bgGradient: 'from-emerald-500/5 to-green-500/5',
            iconBg: 'bg-green-100 group-hover:bg-green-200',
            textGradient: 'from-green-600 to-emerald-600',
        },
        orange: {
            borderHover: 'hover:border-orange-400/50',
            bgGradient: 'from-orange-500/5 to-amber-500/5',
            iconBg: 'bg-orange-100 group-hover:bg-orange-200',
            textGradient: 'from-orange-600 to-amber-600',
        },
        red: {
            borderHover: 'hover:border-red-400/50',
            bgGradient: 'from-red-500/5 to-orange-500/5',
            iconBg: 'bg-red-100 group-hover:bg-red-200',
            textGradient: 'from-red-600 to-orange-600',
        },
        pink: {
            borderHover: 'hover:border-pink-400/50',
            bgGradient: 'from-pink-500/5 to-rose-500/5',
            iconBg: 'bg-pink-100 group-hover:bg-pink-200',
            textGradient: 'from-pink-600 to-rose-600',
        },
        teal: {
            borderHover: 'hover:border-teal-400/50',
            bgGradient: 'from-teal-500/5 to-emerald-500/5',
            iconBg: 'bg-teal-100 group-hover:bg-teal-200',
            textGradient: 'from-teal-600 to-emerald-600',
        }
    };

    const theme = colorMap[color] || colorMap.indigo;

    return (
        <div
            onClick={onClick}
            className={`group bg-white backdrop-blur-xl p-8 rounded-2xl border border-slate-200/50 shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden relative ${onClick ? 'cursor-pointer hover:translate-y-[-8px]' : ''} ${theme.borderHover}`}
        >
            {/* Background Gradient Animation */}
            <div className={`absolute inset-0 bg-gradient-to-br ${theme.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>

            <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                    <div className="text-6xl group-hover:scale-125 transition-transform duration-300">
                        {icon}
                    </div>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${theme.iconBg}`}>
                        <span className="text-lg">{secondaryIcon || '→'}</span>
                    </div>
                </div>

                <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>

                <div className={`text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r ${theme.textGradient} mb-3`}>
                    {loading ? (
                        <div className="h-12 w-24 bg-slate-200 animate-pulse rounded"></div>
                    ) : (
                        value
                    )}
                </div>

                {subtitle && (
                    <div className="text-sm text-slate-600 font-medium">
                        {subtitle}
                    </div>
                )}
            </div>
        </div>
    );
};

export default StatCard;
