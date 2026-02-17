import React from 'react';
import ModernLoader from './ModernLoader';

const Loader = ({ type = 'ai', size = 'medium', color = 'teal', className = '', text = '' }) => {
    // Map existing sizes to ModernLoader sizes
    const sizeMap = {
        small: 'sm',
        medium: 'md',
        large: 'lg',
        xl: 'xl'
    };

    // Map existing colors to ModernLoader colors
    const colorMap = {
        teal: 'teal',
        blue: 'blue',
        white: 'white',
        gray: 'teal' // Fallback
    };

    return (
        <ModernLoader
            type={type === 'dots' ? 'pulse' : type}
            size={sizeMap[size] || 'md'}
            color={colorMap[color] || 'teal'}
            text={text}
            className={className}
        />
    );
};

export default Loader;
