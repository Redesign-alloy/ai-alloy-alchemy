import { useState, useEffect } from 'react';

interface TypingAnimationProps {
  text: string;
  speed?: number;
  className?: string;
  onComplete?: () => void;
}

export const TypingAnimation = ({ 
  text, 
  speed = 15, 
  className = "",
  onComplete 
}: TypingAnimationProps) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    // Reset when text changes
    setDisplayedText('');
    setCurrentIndex(0);
    setIsComplete(false);
  }, [text]);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);
      
      return () => clearTimeout(timeout);
    } else if (currentIndex === text.length && text.length > 0 && !isComplete) {
      setIsComplete(true);
      onComplete?.();
    }
  }, [currentIndex, text, speed, onComplete, isComplete]);

  // Parse text for superscript citations [^1], [^2], etc.
  const renderTextWithCitations = (content: string) => {
    const parts = content.split(/(\[\^\d+\])/g);
    
    return parts.map((part, index) => {
      const citationMatch = part.match(/\[\^(\d+)\]/);
      if (citationMatch) {
        return (
          <sup 
            key={index} 
            className="text-primary font-semibold text-xs ml-0.5 cursor-pointer hover:text-accent transition-colors"
          >
            [{citationMatch[1]}]
          </sup>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className={className}>
      <span className="whitespace-pre-wrap">
        {renderTextWithCitations(displayedText)}
      </span>
      {!isComplete && (
        <span className="inline-block w-0.5 h-5 bg-primary ml-1 animate-pulse" />
      )}
    </div>
  );
};
