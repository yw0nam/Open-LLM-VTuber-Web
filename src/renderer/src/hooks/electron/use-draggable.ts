import { useState, useRef } from 'react';

interface Position {
  x: number
  y: number
}

interface UseDraggableProps {
  isPet?: boolean
  componentId: string
}

export function useDraggable({ isPet = false, componentId }: UseDraggableProps) {
  const [isDragging, setIsDragging] = useState(false);
  const positionRef = useRef<Position>({ x: 0, y: 0 });
  const dragStartRef = useRef<Position>({ x: 0, y: 0 });
  const elementRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    if (isPet) {
      (window.api as any)?.updateComponentHover(componentId, true);
    }
  };

  const handleMouseLeave = () => {
    if (isPet && !isDragging) {
      (window.api as any)?.updateComponentHover(componentId, false);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - positionRef.current.x,
      y: e.clientY - positionRef.current.y,
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!elementRef.current) return;

      positionRef.current = {
        x: moveEvent.clientX - dragStartRef.current.x,
        y: moveEvent.clientY - dragStartRef.current.y,
      };

      elementRef.current.style.transform = `translateX(-50%) translate(${positionRef.current.x}px, ${positionRef.current.y}px)`;
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      if (isPet && !elementRef.current?.matches(':hover')) {
        // (window.api as any)?.updateComponentHover(componentId, false)
      }
      document.removeEventListener('mousemove', handleMouseMove, true);
      document.removeEventListener('mouseup', handleMouseUp, true);
    };

    document.addEventListener('mousemove', handleMouseMove, true);
    document.addEventListener('mouseup', handleMouseUp, true);
  };

  return {
    elementRef,
    isDragging,
    handleMouseDown,
    handleMouseEnter,
    handleMouseLeave,
  };
}
