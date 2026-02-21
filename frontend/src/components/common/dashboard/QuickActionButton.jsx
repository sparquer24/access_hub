import React from 'react';

const QuickActionButton = ({ title, icon, color = 'indigo', onClick }) => {
    const colorMap = {
        indigo: 'from-teal-600 to-teal-600',
        purple: 'from-cyan-600 to-pink-600',
        blue: 'from-blue-600 to-cyan-600',
        green: 'from-green-600 to-emerald-600',
        orange: 'from-orange-600 to-amber-600',
        red: 'from-red-600 to-rose-600',
        teal: 'from-teal-600 to-emerald-600'
    };

    const gradient = colorMap[color] || colorMap.indigo;

    return (
        <button
            onClick={onClick}
            className={`relative overflow-hidden w-full group px-6 py-4 bg-gradient-to-r ${gradient} text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:translate-y-[-2px] transition-all duration-300 text-left`}
        >
            <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 group-hover:animate-shine" />
            <div className="relative z-10 flex items-center gap-3">
                <span className="text-xl">{icon}</span>
                <span>{title}</span>
            </div>
        </button>
    );
};

export default QuickActionButton;
