import { useEffect } from 'react';
import { useLocation } from 'wouter';

export function useScrollTop() {
  const [location] = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location]);
}
