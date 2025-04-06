import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

interface ScrollableContainerProps {
  children: React.ReactNode;
  className?: string;
  maxHeight?: string;
}

export function ScrollableContainer({ 
  children, 
  className,
  maxHeight = "300px" 
}: ScrollableContainerProps) {
  const [showTopGradient, setShowTopGradient] = useState(false);
  const [showBottomGradient, setShowBottomGradient] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (!containerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    setShowTopGradient(scrollTop > 0);
    setShowBottomGradient(scrollTop + clientHeight < scrollHeight);
  };

  // Check initial scroll position
  useEffect(() => {
    handleScroll();
  }, [children]);

  return (
    <div className="relative">
      {/* Top gradient mask */}
      {showTopGradient && (
        <div 
          className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-background to-transparent z-10 pointer-events-none"
          style={{ opacity: 0.8 }}
        />
      )}
      
      {/* Scrollable content */}
      <div
        ref={containerRef}
        className={cn(
          "overflow-y-auto no-scrollbar h-[250px] md:h-[300px]",
          className
        )}
        onScroll={handleScroll}
      >
        {children}
      </div>
      
      {/* Bottom gradient mask */}
      {showBottomGradient && (
        <div 
          className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-background to-transparent z-10 pointer-events-none"
          style={{ opacity: 0.8 }}
        />
      )}
    </div>
  );
} 