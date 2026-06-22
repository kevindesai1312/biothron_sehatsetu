import React, { useEffect, useState } from 'react';
import { Type } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function FontSizeToggler() {
  // 'normal' or 'large'
  const [fontSize, setFontSize] = useState<'normal' | 'large'>('normal');

  useEffect(() => {
    // Check if user has a saved preference
    const saved = localStorage.getItem('elderly-font-size');
    if (saved === 'large') {
      setFontSize('large');
      document.documentElement.classList.add('font-large');
    }
  }, []);

  const toggleFontSize = () => {
    if (fontSize === 'normal') {
      setFontSize('large');
      localStorage.setItem('elderly-font-size', 'large');
      document.documentElement.classList.add('font-large');
    } else {
      setFontSize('normal');
      localStorage.setItem('elderly-font-size', 'normal');
      document.documentElement.classList.remove('font-large');
    }
  };

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={toggleFontSize}
      className={`flex items-center gap-2 ${fontSize === 'large' ? 'bg-primary/10 border-primary' : ''}`}
      aria-label="Toggle Large Text"
      title="Toggle Large Text"
    >
      <Type className={fontSize === 'large' ? 'w-5 h-5 font-bold' : 'w-4 h-4'} />
      <span className="hidden xl:inline-block text-xs font-medium">
        {fontSize === 'large' ? 'Normal Text' : 'Large Text'}
      </span>
    </Button>
  );
}
