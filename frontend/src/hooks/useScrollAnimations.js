import { useState, useEffect, useRef } from 'react';

// Custom hook for scroll animations with intersection observer
export const useScrollAnimation = (threshold = 0.1, rootMargin = '0px') => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const elementRef = useRef(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setIsVisible(true);
          setHasAnimated(true);
        }
      },
      {
        threshold,
        rootMargin
      }
    );

    observer.observe(element);

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [threshold, rootMargin, hasAnimated]);

  return [elementRef, isVisible];
};

// Custom hook for staggered animations
export const useStaggeredAnimation = (delay = 0) => {
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const elementRef = useRef(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            setShouldAnimate(true);
          }, delay);
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px'
      }
    );

    observer.observe(element);

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [delay]);

  return [elementRef, shouldAnimate];
};

// Custom hook for parallax scrolling
export const useParallax = (speed = 0.5) => {
  const [offset, setOffset] = useState(0);
  const elementRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      const element = elementRef.current;
      if (!element) return;

      const rect = element.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const elementTop = rect.top + scrollTop;
      const windowHeight = window.innerHeight;
      
      // Calculate offset based on scroll position
      const scrollProgress = (scrollTop - elementTop + windowHeight) / (windowHeight + rect.height);
      setOffset(scrollProgress * speed * 100);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial call

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [speed]);

  return [elementRef, offset];
};

// Get random animation direction
export const getRandomDirection = () => {
  const directions = ['left', 'right'];
  return directions[Math.floor(Math.random() * directions.length)];
};

// Generate animation styles for cards
export const getAnimationStyle = (index, direction, isVisible, delay = 0) => {
  const baseDelay = delay + (index * 150); // Stagger timing
  
  if (!isVisible) {
    return {
      opacity: 0,
      transform: direction === 'left' ? 'translateX(-100px)' : 'translateX(100px)',
      transition: 'none'
    };
  }

  return {
    opacity: 1,
    transform: 'translateX(0)',
    transition: `all 0.8s cubic-bezier(0.4, 0, 0.2, 1) ${baseDelay}ms`,
    transitionProperty: 'opacity, transform'
  };
};

export default {
  useScrollAnimation,
  useStaggeredAnimation,
  useParallax,
  getRandomDirection,
  getAnimationStyle
};