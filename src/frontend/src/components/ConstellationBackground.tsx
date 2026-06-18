import React, { useEffect, useRef, useState } from 'react';

interface Star {
  x: number;
  y: number;
  size: number;
  brightness: number;
  baseBrightness: number;
  pulseSpeed: number;
  pulseOffset: number;
}

interface ShootingStar {
  x: number;
  y: number;
  vx: number;
  vy: number;
  length: number;
  opacity: number;
  active: boolean;
}

interface Position {
  x: number;
  y: number;
}

const ConstellationBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const starsRef = useRef<Star[]>([]);
  const shootingStarsRef = useRef<ShootingStar[]>([]);
  const cursorPosRef = useRef<Position>({ x: -1000, y: -1000 });
  const [isActive, setIsActive] = useState(false);

  const STAR_COUNT = 65; // 50-80 stars
  const CONNECTION_DISTANCE = 150; // 150px connection radius
  const LINE_FADE_DISTANCE = 150;
  const SHOOTING_STAR_INTERVAL = 8000; // Spawn shooting star every 8 seconds
  const SHOOTING_STAR_SPEED = 3;
  
  // Dimming factors for better content visibility
  const STAR_BRIGHTNESS_FACTOR = 0.4; // Reduce star brightness to 40%
  const LINE_OPACITY_FACTOR = 0.3; // Reduce line opacity to 30%
  const SHOOTING_STAR_OPACITY_FACTOR = 0.4; // Reduce shooting star opacity to 40%

  // Initialize stars
  useEffect(() => {
    const stars: Star[] = [];
    for (let i = 0; i < STAR_COUNT; i++) {
      const baseBrightness = (0.3 + Math.random() * 0.7) * STAR_BRIGHTNESS_FACTOR; // Dimmed brightness
      stars.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: 1 + Math.random() * 2.5, // Varying sizes
        brightness: baseBrightness,
        baseBrightness: baseBrightness,
        pulseSpeed: 0.5 + Math.random() * 1.5, // Varying pulse rates
        pulseOffset: Math.random() * Math.PI * 2,
      });
    }
    starsRef.current = stars;

    // Initialize shooting stars array
    shootingStarsRef.current = [];
  }, []);

  // Spawn shooting stars periodically
  useEffect(() => {
    const spawnShootingStar = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Random starting position at the edge of the screen
      const side = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
      let x = 0, y = 0, vx = 0, vy = 0;

      switch (side) {
        case 0: // top
          x = Math.random() * canvas.width;
          y = -10;
          vx = (Math.random() - 0.5) * SHOOTING_STAR_SPEED;
          vy = SHOOTING_STAR_SPEED;
          break;
        case 1: // right
          x = canvas.width + 10;
          y = Math.random() * canvas.height;
          vx = -SHOOTING_STAR_SPEED;
          vy = (Math.random() - 0.5) * SHOOTING_STAR_SPEED;
          break;
        case 2: // bottom
          x = Math.random() * canvas.width;
          y = canvas.height + 10;
          vx = (Math.random() - 0.5) * SHOOTING_STAR_SPEED;
          vy = -SHOOTING_STAR_SPEED;
          break;
        case 3: // left
          x = -10;
          y = Math.random() * canvas.height;
          vx = SHOOTING_STAR_SPEED;
          vy = (Math.random() - 0.5) * SHOOTING_STAR_SPEED;
          break;
      }

      shootingStarsRef.current.push({
        x,
        y,
        vx,
        vy,
        length: 40 + Math.random() * 30,
        opacity: (0.6 + Math.random() * 0.3) * SHOOTING_STAR_OPACITY_FACTOR, // Dimmed opacity
        active: true,
      });
    };

    const interval = setInterval(spawnShootingStar, SHOOTING_STAR_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  // Handle mouse and touch events
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      cursorPosRef.current = { x: e.clientX, y: e.clientY };
      if (!isActive) setIsActive(true);
    };

    const handleMouseLeave = () => {
      cursorPosRef.current = { x: -1000, y: -1000 };
      setIsActive(false);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        cursorPosRef.current = { x: touch.clientX, y: touch.clientY };
        if (!isActive) setIsActive(true);
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        cursorPosRef.current = { x: touch.clientX, y: touch.clientY };
        setIsActive(true);
      }
    };

    const handleTouchEnd = () => {
      cursorPosRef.current = { x: -1000, y: -1000 };
      setIsActive(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isActive]);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      // Redistribute stars on resize
      starsRef.current.forEach(star => {
        if (star.x > canvas.width) star.x = Math.random() * canvas.width;
        if (star.y > canvas.height) star.y = Math.random() * canvas.height;
      });
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const drawStar = (star: Star, time: number, isConnected: boolean) => {
      // Pulsing animation
      const pulse = Math.sin(time * star.pulseSpeed + star.pulseOffset) * 0.3 + 0.7;
      let brightness = star.baseBrightness * pulse;
      
      // Brighten when connected (but still dimmed overall)
      if (isConnected) {
        brightness = Math.min(1, brightness * 1.5);
      }

      // Glow effect - dimmed
      const gradient = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, star.size * 3);
      gradient.addColorStop(0, `rgba(255, 255, 255, ${brightness})`);
      gradient.addColorStop(0.3, `rgba(200, 220, 255, ${brightness * 0.6})`);
      gradient.addColorStop(1, `rgba(150, 180, 255, 0)`);

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size * 3, 0, Math.PI * 2);
      ctx.fill();

      // Core star
      ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
    };

    const drawLine = (x1: number, y1: number, x2: number, y2: number, distance: number) => {
      // Calculate opacity based on distance from cursor - dimmed
      const opacity = Math.max(0, 1 - distance / LINE_FADE_DISTANCE) * 0.4 * LINE_OPACITY_FACTOR;
      
      // Smooth anti-aliased line
      ctx.strokeStyle = `rgba(150, 180, 255, ${opacity})`;
      ctx.lineWidth = 1;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    };

    const drawShootingStar = (shootingStar: ShootingStar) => {
      if (!shootingStar.active) return;

      const gradient = ctx.createLinearGradient(
        shootingStar.x,
        shootingStar.y,
        shootingStar.x - shootingStar.vx * shootingStar.length / SHOOTING_STAR_SPEED,
        shootingStar.y - shootingStar.vy * shootingStar.length / SHOOTING_STAR_SPEED
      );
      
      gradient.addColorStop(0, `rgba(255, 255, 255, ${shootingStar.opacity})`);
      gradient.addColorStop(0.3, `rgba(200, 220, 255, ${shootingStar.opacity * 0.6})`);
      gradient.addColorStop(1, 'rgba(150, 180, 255, 0)');

      ctx.strokeStyle = gradient;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(shootingStar.x, shootingStar.y);
      ctx.lineTo(
        shootingStar.x - shootingStar.vx * shootingStar.length / SHOOTING_STAR_SPEED,
        shootingStar.y - shootingStar.vy * shootingStar.length / SHOOTING_STAR_SPEED
      );
      ctx.stroke();

      // Draw bright head - dimmed
      const headGradient = ctx.createRadialGradient(
        shootingStar.x,
        shootingStar.y,
        0,
        shootingStar.x,
        shootingStar.y,
        4
      );
      headGradient.addColorStop(0, `rgba(255, 255, 255, ${shootingStar.opacity})`);
      headGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      
      ctx.fillStyle = headGradient;
      ctx.beginPath();
      ctx.arc(shootingStar.x, shootingStar.y, 4, 0, Math.PI * 2);
      ctx.fill();
    };

    const updateShootingStars = () => {
      shootingStarsRef.current = shootingStarsRef.current.filter(shootingStar => {
        if (!shootingStar.active) return false;

        // Update position
        shootingStar.x += shootingStar.vx;
        shootingStar.y += shootingStar.vy;

        // Fade out gradually
        shootingStar.opacity -= 0.003;

        // Check if out of bounds or faded
        if (
          shootingStar.opacity <= 0 ||
          shootingStar.x < -100 ||
          shootingStar.x > canvas.width + 100 ||
          shootingStar.y < -100 ||
          shootingStar.y > canvas.height + 100
        ) {
          shootingStar.active = false;
          return false;
        }

        return true;
      });
    };

    const animate = (timestamp: number) => {
      const time = timestamp * 0.001; // Convert to seconds

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const cursorX = cursorPosRef.current.x;
      const cursorY = cursorPosRef.current.y;

      // Track which stars are connected
      const connectedStars = new Set<number>();

      // Draw constellation lines
      if (isActive) {
        starsRef.current.forEach((star, index) => {
          const dx = star.x - cursorX;
          const dy = star.y - cursorY;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < CONNECTION_DISTANCE) {
            connectedStars.add(index);
            
            // Draw line from cursor to star
            drawLine(cursorX, cursorY, star.x, star.y, distance);

            // Draw lines between nearby stars
            starsRef.current.forEach((otherStar, otherIndex) => {
              if (otherIndex <= index) return;

              const odx = otherStar.x - cursorX;
              const ody = otherStar.y - cursorY;
              const otherDistance = Math.sqrt(odx * odx + ody * ody);

              if (otherDistance < CONNECTION_DISTANCE) {
                connectedStars.add(otherIndex);
                
                // Draw line between connected stars
                const starDx = star.x - otherStar.x;
                const starDy = star.y - otherStar.y;
                const starDistance = Math.sqrt(starDx * starDx + starDy * starDy);
                
                if (starDistance < CONNECTION_DISTANCE * 0.8) {
                  const avgDistance = (distance + otherDistance) / 2;
                  drawLine(star.x, star.y, otherStar.x, otherStar.y, avgDistance);
                }
              }
            });
          }
        });
      }

      // Draw stars
      starsRef.current.forEach((star, index) => {
        drawStar(star, time, connectedStars.has(index));
      });

      // Update and draw shooting stars
      updateShootingStars();
      shootingStarsRef.current.forEach(drawShootingStar);

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [isActive]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ 
        background: 'linear-gradient(to bottom, #0a0e1a 0%, #050810 100%)'
      }}
    />
  );
};

export default ConstellationBackground;
