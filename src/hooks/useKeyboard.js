import { useEffect, useCallback } from 'react';

export const useKeyboard = (shortcuts, enabled = true) => {
  const handleKeyDown = useCallback((event) => {
    if (!enabled) return;
    
    // Don't trigger shortcuts when typing in input fields
    const { tagName, isContentEditable } = event.target;
    if (tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT' || isContentEditable) {
      if (event.key === 'a' && event.ctrlKey) return;
      return;
    }
    
    const ctrl = event.ctrlKey || event.metaKey;
    const shift = event.shiftKey;
    const alt = event.altKey;
    
    for (const [key, handler] of Object.entries(shortcuts)) {
      if (typeof handler !== 'function') continue;
      
      const parts = key.split('+');
      const lastKey = parts.pop();
      
      const matchesCtrl = parts.includes('ctrl') || parts.includes('cmd');
      const matchesShift = parts.includes('shift');
      const matchesAlt = parts.includes('alt');
      
      const ctrlMatch = matchesCtrl ? ctrl : !ctrl;
      const shiftMatch = matchesShift ? shift : !shift;
      const altMatch = matchesAlt ? alt : !alt;
      const keyMatch = event.key.toLowerCase() === lastKey.toLowerCase();
      
      if (ctrlMatch && shiftMatch && altMatch && keyMatch) {
        event.preventDefault();
        event.stopPropagation();
        handler(event);
        break;
      }
    }
  }, [shortcuts, enabled]);
  
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
};

export const formatShortcut = (shortcut) => {
  const parts = shortcut.split('+');
  const display = {
    ctrl: '⌘',
    cmd: '⌘',
    shift: '⇧',
    alt: '⌥',
  };
  
  return parts.map(p => display[p] || p.toUpperCase()).join(' + ');
};