import { useEffect, useRef, useState } from 'react';

const EXIT_WINDOW_MS = 2000;

export function useExitOnDoubleBack(): boolean {
  const [showHint, setShowHint] = useState(false);
  const lastBackPress = useRef(0);

  useEffect(() => {
    window.history.pushState(null, '', window.location.href);

    function handlePopState() {
      const now = Date.now();
      if (now - lastBackPress.current < EXIT_WINDOW_MS) {
        return;
      }
      lastBackPress.current = now;
      window.history.pushState(null, '', window.location.href);
      setShowHint(true);
      window.setTimeout(() => setShowHint(false), EXIT_WINDOW_MS);
    }

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return showHint;
}