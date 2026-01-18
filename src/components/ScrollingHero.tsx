import React, { useEffect, useRef, useState } from 'react';

interface ScrollingHeroProps {
  children?: React.ReactNode;
  frameCount?: number;
}

const ScrollingHero: React.FC<ScrollingHeroProps> = ({ 
  children, 
  frameCount = 192 
}) => {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);

  // Preload images
  useEffect(() => {
    let loadedCount = 0;
    const imageUrls = Array.from({ length: frameCount }, (_, i) => {
      const frameNumber = (i + 1).toString().padStart(3, '0');
      return `/ezgif-frame-${frameNumber}.jpg`;
    });

    const loadImage = (url: string) => {
      return new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.src = url;
        img.onload = () => resolve(img);
        img.onerror = reject;
      });
    };

    Promise.all(imageUrls.map(loadImage))
      .then((loadedImages) => {
        imagesRef.current = loadedImages;
        setImagesLoaded(true);
        // Draw first frame immediately
        drawFrame(0);
      })
      .catch((err) => console.error("Failed to load frames", err));
  }, [frameCount]);

  const drawFrame = (index: number) => {
    const canvas = canvasRef.current;
    const img = imagesRef.current[index];
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Crop details to hide watermark (bottom-right)
    // We'll crop the bottom 12% and right 2% to be safe, while maintaining aspect ratio
    const sourceWidth = img.width; // Keeping full width for now, usually watermark is low enough
    const sourceHeight = img.height * 0.88; // Crop bottom 12%

    // Calculate aspect ratios for "object-fit: cover" with the CROPPED dimensions
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const imgRatio = sourceWidth / sourceHeight;
    const canvasRatio = canvasWidth / canvasHeight;

    let drawWidth, drawHeight, offsetX, offsetY;

    if (imgRatio > canvasRatio) {
      drawHeight = canvasHeight;
      drawWidth = canvasHeight * imgRatio;
      offsetX = (canvasWidth - drawWidth) / 2;
      offsetY = 0;
    } else {
      drawWidth = canvasWidth;
      drawHeight = canvasWidth / imgRatio;
      offsetX = 0;
      offsetY = (canvasHeight - drawHeight) / 2;
    }

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    // Source rectangle uses 0,0 to sourceWidth, sourceHeight (effectively cropping bottom)
    ctx.drawImage(img, 0, 0, sourceWidth, sourceHeight, offsetX, offsetY, drawWidth, drawHeight);
  };

  // Resize handler
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current && containerRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
        drawFrame(currentFrame);
      }
    };
    
    window.addEventListener('resize', handleResize);
    handleResize(); // Initial size

    return () => window.removeEventListener('resize', handleResize);
  }, [currentFrame, imagesLoaded]);

  // Scroll handler
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;

      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      const scrollHeight = container.scrollHeight - window.innerHeight;
      
      // Calculate progress based on how far the container has moved up
      // When rect.top is 0, start. When rect.bottom is window.innerHeight, end.
      // But we are sticky. 
      // Actually, with sticky positioning:
      // The container is tall (e.g. 400vh). The sticky inner part stays fixed.
      // We want to map the scroll position within the container to the frames.
      
      // Distance scrolled from top of container
      const scrollTop = -rect.top;
      
      // Total scrollable distance (height of container - height of viewport)
      // Since user scrolls the window, and this element is in the flow.
      const maxScroll = rect.height - window.innerHeight;
      
      if (maxScroll <= 0) return;

      const progress = Math.max(0, Math.min(1, scrollTop / maxScroll));
      const frameIndex = Math.floor(progress * (frameCount - 1));

      if (frameIndex !== currentFrame) {
        setCurrentFrame(frameIndex);
        drawFrame(frameIndex);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [frameCount, currentFrame, imagesLoaded]); 
  // Dependency on currentFrame might cause re-attach, but it's needed for the check? 
  // Actually no, `currentFrame` in the closure will be stale if we don't include it, 
  // but better to use a ref for currentFrame to avoid re-attaching event listener constantly.

  return (
    <div 
      ref={containerRef} 
      className="relative w-full" 
      style={{ height: '400vh' }} // Make the scroll track long
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-black">
        <canvas 
          ref={canvasRef} 
          className="absolute inset-0 w-full h-full object-cover"
        />
        
        <div className="relative z-10 w-full h-full flex items-center justify-center">
          {children}
        </div>
      </div>
    </div>
  );
};

export default ScrollingHero;
