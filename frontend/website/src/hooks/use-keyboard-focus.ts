'use client';

import { useState, useEffect } from 'react';

export function useKeyboardFocus() {
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    let focused = false;
    let initialViewportHeight = window.innerHeight;
    let resizeTimeout: NodeJS.Timeout;
    let transitionTimeout: NodeJS.Timeout;

    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
        focused = true;
        checkKeyboard();
      }
    };

    const handleFocusOut = () => {
      focused = false;
      setTimeout(checkKeyboard, 50);
    };

    const setKeyboardState = (newState: boolean) => {
      setIsKeyboardOpen((prev) => {
        if (prev !== newState) {
          setIsTransitioning(true);
          clearTimeout(transitionTimeout);
          // Disable transitions for 300ms during layout shift to prevent stutter
          transitionTimeout = setTimeout(() => setIsTransitioning(false), 300);
        }
        return newState;
      });
    };

    const checkKeyboard = () => {
      if (!window.visualViewport) {
        setKeyboardState(focused);
        return;
      }
      const currentHeight = window.visualViewport.height;
      const isShrunk = initialViewportHeight - currentHeight > 120;
      setKeyboardState(focused || isShrunk);
    };

    const handleResize = () => {
      if (!window.visualViewport) return;
      
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (!focused && window.visualViewport!.height >= window.innerHeight - 50) {
          initialViewportHeight = window.visualViewport!.height;
        }
        checkKeyboard();
      }, 50); // Debounce resize events
    };

    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);
    
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
      initialViewportHeight = window.visualViewport.height;
    }

    return () => {
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
      }
      clearTimeout(resizeTimeout);
      clearTimeout(transitionTimeout);
    };
  }, []);

  return { isKeyboardOpen, isTransitioning };
}
