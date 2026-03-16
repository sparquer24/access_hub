import React, { useState, useEffect, useRef } from 'react';

const AnimatedAvatar = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [scrollDirection, setScrollDirection] = useState('neutral');
  const [scrollY, setScrollY] = useState(0);
  const [lastScrollY, setLastScrollY] = useState(0);
  const avatarRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!avatarRef.current) return;
      
      const rect = avatarRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      // Calculate relative position (-1 to 1)
      const relativeX = (e.clientX - centerX) / (rect.width / 2);
      const relativeY = (e.clientY - centerY) / (rect.height / 2);
      
      setMousePosition({
        x: Math.max(-1, Math.min(1, relativeX)),
        y: Math.max(-1, Math.min(1, relativeY))
      });
    };

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Update scroll position
      setScrollY(currentScrollY);
      
      if (currentScrollY > lastScrollY + 10) {
        setScrollDirection('down');
      } else if (currentScrollY < lastScrollY - 10) {
        setScrollDirection('up');
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [lastScrollY]);

  // Calculate lens movement based on mouse and scroll
  const getLensPosition = () => {
    let lensX = mousePosition.x * 3; // Following mouse (reduced movement for camera lens)
    let lensY = mousePosition.y * 3;
    
    // Override with scroll direction for camera tilt
    if (scrollDirection === 'down') {
      lensY += 2; // Slight downward tilt
    } else if (scrollDirection === 'up') {
      lensY -= 2; // Slight upward tilt
    }
    
    return { x: lensX, y: lensY };
  };

  const lensPos = getLensPosition();
  const zoomLevel = scrollDirection !== 'neutral' ? 1.05 : 1;

  return (
    <div 
      ref={avatarRef}
      className="fixed right-8 top-8 z-50 pointer-events-none"
      style={{
        animation: 'float 3s ease-in-out infinite'
      }}
    >
      {/* Camera Body Container */}
      <div className="relative">
        {/* Main Camera Body */}
        <div 
          className="w-24 h-20 bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-lg relative shadow-xl"
          style={{
            filter: 'drop-shadow(0 10px 20px rgba(0, 0, 0, 0.3))',
            transform: `perspective(300px) rotateX(${lensPos.y * 0.8}deg) rotateY(${lensPos.x * 0.8}deg)`
          }}
        >
          {/* Camera Brand/Model Text */}
          <div className="absolute top-1 left-2 text-white text-xs font-bold opacity-70">
            ACCESS
          </div>
          <div className="absolute top-2.5 left-2 text-white text-xs opacity-50">
            HUB CAM
          </div>

          {/* Main Camera Lens */}
          <div 
            className="absolute w-12 h-12 bg-gradient-to-br from-gray-600 to-gray-900 rounded-full flex items-center justify-center"
            style={{
              top: '25%',
              left: '50%',
              transform: `translate(-50%, -50%) scale(${zoomLevel}) translate(${lensPos.x}px, ${lensPos.y}px)`,
              boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.6), 0 0 0 2px rgba(100, 100, 100, 0.3)',
              transition: 'transform 0.1s ease-out'
            }}
          >
            {/* Outer Lens Ring */}
            <div className="w-10 h-10 bg-gradient-to-br from-gray-400 to-gray-700 rounded-full flex items-center justify-center">
              {/* Inner Lens Ring */}
              <div className="w-8 h-8 bg-gradient-to-br from-blue-900 via-gray-800 to-black rounded-full flex items-center justify-center">
                {/* Lens Glass with Reflection */}
                <div 
                  className="w-6 h-6 rounded-full relative overflow-hidden"
                  style={{
                    background: 'radial-gradient(circle at 30% 30%, rgba(100, 200, 255, 0.3) 0%, rgba(0, 100, 200, 0.8) 40%, rgba(0, 0, 0, 0.9) 100%)'
                  }}
                >
                  {/* Lens Reflection */}
                  <div 
                    className="absolute w-2 h-2 bg-white rounded-full opacity-40"
                    style={{
                      top: '20%',
                      left: '30%',
                      filter: 'blur(1px)'
                    }}
                  />
                  {/* Aperture Blades Effect */}
                  <div 
                    className="absolute inset-1 border border-gray-600 rounded-full opacity-20"
                    style={{
                      transform: 'rotate(45deg)'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Viewfinder */}
          <div 
            className="absolute w-3 h-2 bg-gradient-to-br from-gray-600 to-gray-800 rounded-sm"
            style={{
              top: '10%',
              left: '75%',
              boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.5)'
            }}
          />

          {/* Flash */}
          <div 
            className="absolute w-2 h-2 bg-gradient-to-br from-yellow-200 to-yellow-400 rounded-full"
            style={{
              top: '15%',
              right: '15%',
              boxShadow: scrollDirection !== 'neutral' ? '0 0 8px rgba(255, 255, 0, 0.6)' : 'none',
              transition: 'box-shadow 0.3s ease'
            }}
          />

          {/* Camera Controls/Buttons */}
          <div className="absolute bottom-2 left-2 flex space-x-1">
            <div className="w-1.5 h-1.5 bg-red-500 rounded-full opacity-70" />
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full opacity-70" />
          </div>

          {/* Mode Dial */}
          <div 
            className="absolute w-4 h-4 bg-gradient-to-br from-gray-500 to-gray-700 rounded-full"
            style={{
              top: '65%',
              right: '15%',
              transform: scrollDirection === 'down' ? 'rotate(15deg)' : scrollDirection === 'up' ? 'rotate(-15deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.5)'
            }}
          >
            {/* Dial Notches */}
            <div className="absolute inset-0.5 rounded-full border border-gray-400 opacity-50" />
            <div 
              className="absolute w-0.5 h-1 bg-white rounded-full opacity-80"
              style={{
                top: '10%',
                left: '50%',
                transform: 'translateX(-50%)'
              }}
            />
          </div>
        </div>

        {/* Camera Lens Cap (when not tracking) */}
        {mousePosition.x === 0 && mousePosition.y === 0 && (
          <div 
            className="absolute w-12 h-12 bg-gradient-to-br from-gray-700 to-gray-900 rounded-full flex items-center justify-center"
            style={{
              top: '30%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              animation: 'pulse 2s ease-in-out infinite'
            }}
          >
            <div className="text-white text-xs font-bold opacity-60">CAP</div>
          </div>
        )}

        {/* Camera Strap */}
        <div 
          className="absolute w-1 h-6 bg-gradient-to-br from-yellow-600 to-yellow-800 rounded-full"
          style={{
            top: '10%',
            left: '-2px',
            transform: scrollDirection === 'up' 
              ? 'rotate(-10deg) translateY(-2px)' 
              : scrollDirection === 'down' 
                ? 'rotate(10deg) translateY(2px)' 
                : 'rotate(0deg)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
          }}
        />

        <div 
          className="absolute w-1 h-6 bg-gradient-to-br from-yellow-600 to-yellow-800 rounded-full"
          style={{
            top: '10%',
            right: '-2px',
            transform: scrollDirection === 'up' 
              ? 'rotate(10deg) translateY(-2px)' 
              : scrollDirection === 'down' 
                ? 'rotate(-10deg) translateY(2px)' 
                : 'rotate(0deg)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
          }}
        />
      </div>

      {/* Floating animation styles */}
      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-8px);
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 0.6;
            transform: translate(-50%, -50%) scale(1);
          }
          50% {
            opacity: 0.8;
            transform: translate(-50%, -50%) scale(1.05);
          }
        }
      `}</style>
    </div>
  );
};

export default AnimatedAvatar;