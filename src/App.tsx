import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { Gift, Heart } from 'lucide-react';

const YellowRose = ({ className, style }: { className?: string, style?: React.CSSProperties }) => (
  <svg className={className} style={style} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="rose-shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="4" stdDeviation="3" floodOpacity="0.15"/>
      </filter>
    </defs>
    <g filter="url(#rose-shadow)">
      {/* Stem */}
      <path d="M50 60 Q45 80 50 95" stroke="#16a34a" strokeWidth="4" fill="none" strokeLinecap="round"/>
      {/* Leaves */}
      <path d="M48 75 Q30 70 35 60 Q45 65 48 75" fill="#22c55e" />
      <path d="M51 85 Q70 80 65 70 Q55 75 51 85" fill="#22c55e" />
      {/* Rose Petals - Base */}
      <path d="M50 65 C25 65 20 35 35 25 C30 15 50 10 50 25 C50 10 70 15 65 25 C80 35 75 65 50 65 Z" fill="#facc15" />
      {/* Inner Petals */}
      <path d="M50 60 C35 60 30 40 40 30 C45 25 55 25 60 30 C70 40 65 60 50 60 Z" fill="#eab308" />
      <path d="M50 55 C40 55 38 42 45 35 C48 32 52 32 55 35 C62 42 60 55 50 55 Z" fill="#fef08a" />
      <path d="M50 48 C45 48 43 40 48 36 C52 40 55 48 50 48 Z" fill="#ca8a04" />
    </g>
  </svg>
);

interface RoseData {
  id: number;
  x: number;
  y: number;
  rot: number;
  scale: number;
  delay: number;
}

interface FlyingRose {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vRot: number;
}

interface TrailPoint {
  x: number;
  y: number;
  time: number;
}

export default function App() {
  const TOTAL_ROSES = 35;
  const [caughtRoses, setCaughtRoses] = useState<RoseData[]>([]);
  const [score, setScore] = useState(0);
  const [isOpened, setIsOpened] = useState(false);
  const [cardState, setCardState] = useState<'hidden' | 'center' | 'bottom'>('hidden');
  const [_, setFrame] = useState(0); // Used to force re-renders for the game loop

  const containerRef = useRef<HTMLDivElement>(null);
  const flyingRosesRef = useRef<FlyingRose[]>([]);
  const trailRef = useRef<TrailPoint[]>([]);
  const isSwipingRef = useRef(false);

  // Trigger fanfare when score reaches TOTAL_ROSES
  useEffect(() => {
    if (score >= TOTAL_ROSES && !isOpened) {
      triggerFanfare();
    }
  }, [score, isOpened]);

  // Game Loop
  useEffect(() => {
    if (isOpened) return;

    let animationFrameId: number;
    let lastSpawn = Date.now();

    const loop = () => {
      const now = Date.now();
      const width = containerRef.current?.clientWidth || window.innerWidth;
      const height = containerRef.current?.clientHeight || window.innerHeight;

      // Spawn new roses periodically
      if (now - lastSpawn > 700 && score + flyingRosesRef.current.length < TOTAL_ROSES + 5) {
        if (score < TOTAL_ROSES) {
          flyingRosesRef.current.push({
            id: Math.random(),
            x: Math.random() * (width - 100) + 50,
            y: height + 50,
            vx: (Math.random() - 0.5) * 10, // Horizontal speed
            vy: -(Math.random() * 8 + 18),  // Vertical speed (upwards)
            rot: Math.random() * 360,
            vRot: (Math.random() - 0.5) * 15,
          });
          lastSpawn = now;
        }
      }

      // Update physics for flying roses
      flyingRosesRef.current = flyingRosesRef.current.filter(rose => {
        rose.vy += 0.5; // Gravity
        rose.x += rose.vx;
        rose.y += rose.vy;
        rose.rot += rose.vRot;

        // Keep if it hasn't fallen way off the bottom
        return rose.y < height + 200;
      });

      // Update swipe trail (fade out old points)
      trailRef.current = trailRef.current.filter(p => now - p.time < 150);

      setFrame(f => f + 1);
      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isOpened, score]);

  const addCaughtRose = useCallback(() => {
    setCaughtRoses(prev => {
      if (prev.length >= TOTAL_ROSES) return prev;
      
      // Box-Muller transform for a clustered bouquet distribution
      const u = 1 - Math.random();
      const v = Math.random();
      const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
      let bx = 50 + z * 15;
      bx = Math.max(10, Math.min(90, bx));
      
      const z2 = Math.sqrt(-2.0 * Math.log(u)) * Math.sin(2.0 * Math.PI * v);
      let by = 50 + z2 * 15;
      by = Math.max(10, Math.min(90, by));

      return [...prev, {
        id: Math.random(),
        x: bx,
        y: by,
        rot: Math.random() * 60 - 30,
        scale: Math.random() * 0.4 + 0.8,
        delay: Math.random() * 2
      }];
    });
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    isSwipingRef.current = true;
    trailRef.current = [{ x: e.clientX, y: e.clientY, time: Date.now() }];
  };

  const handlePointerUp = () => {
    isSwipingRef.current = false;
    trailRef.current = [];
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isSwipingRef.current || isOpened) return;

    const x = e.clientX;
    const y = e.clientY;
    const now = Date.now();

    trailRef.current.push({ x, y, time: now });

    let caughtThisFrame = 0;

    // Check collisions
    flyingRosesRef.current = flyingRosesRef.current.filter(rose => {
      const dx = rose.x - x;
      const dy = rose.y - y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 75) { // Catch radius
        caughtThisFrame++;
        addCaughtRose();
        
        // Small confetti burst at catch location
        confetti({
          particleCount: 15,
          spread: 60,
          origin: { 
            x: rose.x / window.innerWidth, 
            y: rose.y / window.innerHeight 
          },
          colors: ['#facc15', '#ca8a04', '#22c55e'],
          zIndex: 100,
          ticks: 40,
          startVelocity: 15
        });

        return false; // Remove from flying array
      }
      return true;
    });

    if (caughtThisFrame > 0) {
      setScore(s => Math.min(s + caughtThisFrame, TOTAL_ROSES));
    }
  };

  const triggerFanfare = () => {
    setIsOpened(true);
    setCardState('center');
    setTimeout(() => {
      setCardState('bottom');
    }, 4000);
    flyingRosesRef.current = []; // Clear flying roses
    trailRef.current = []; // Clear trail
    
    try {
      const audio = new Audio('https://actions.google.com/sounds/v1/cartoon/cartoon_success_fanfare.ogg');
      audio.volume = 0.6;
      audio.play().catch(e => console.log('Audio play failed:', e));
    } catch (e) {}

    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) {
        return clearInterval(interval);
      }
      const particleCount = 50 * (timeLeft / duration);
      confetti({
        ...defaults, particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      confetti({
        ...defaults, particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);
  };

  return (
    <div 
      ref={containerRef}
      className="min-h-screen bg-gradient-to-br from-sky-100 via-green-100 to-yellow-100 flex flex-col overflow-hidden select-none touch-none relative"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {/* Panning Background Image */}
      <AnimatePresence>
        {isOpened && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2 }}
            className="absolute inset-0 z-0 pointer-events-none"
          >
            <motion.div
              className="absolute inset-0 w-[200%] h-full bg-[length:auto_100%] bg-repeat-x bg-center"
              style={{ 
                backgroundImage: 'url("/images/background.jpg")',
              }}
              animate={{ x: ['0%', '-50%', '0%'] }}
              transition={{ repeat: Infinity, duration: 30, ease: "linear" }}
            />
            <div className="absolute inset-0 bg-white/20 backdrop-blur-[1px]" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* SVG Trail */}
      <svg className="absolute inset-0 pointer-events-none z-50 w-full h-full">
        <polyline
          points={trailRef.current.map(p => `${p.x},${p.y}`).join(' ')}
          fill="none"
          stroke="rgba(37, 99, 235, 0.8)"
          strokeWidth="12"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ filter: 'drop-shadow(0 0 6px rgba(29, 78, 216, 0.6))' }}
        />
      </svg>

      {/* Flying Roses */}
      {flyingRosesRef.current.map(rose => (
        <div
          key={rose.id}
          className="absolute w-24 h-24 pointer-events-none z-40"
          style={{
            left: rose.x - 48, // Center offset (half of w-24 which is 96px)
            top: rose.y - 48,
            transform: `rotate(${rose.rot}deg)`
          }}
        >
          <YellowRose className="w-full h-full drop-shadow-xl" />
        </div>
      ))}

      {/* Header Area */}
      <div className="min-h-[8rem] md:min-h-[10rem] py-4 flex-shrink-0 flex items-center justify-center text-center z-50 mt-4 px-4">
        <AnimatePresence mode="wait">
          {!isOpened ? (
            <motion.div
              key="intro-text"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-2 max-w-md bg-white/50 backdrop-blur-sm p-4 rounded-2xl shadow-sm border border-white/40"
            >
              <h1 className="text-2xl md:text-3xl font-serif text-emerald-800 leading-snug">
                Swipe or tap to catch 35 yellow roses I'm sending your way!
              </h1>
            </motion.div>
          ) : (
            <motion.div
              key="outro-text"
              initial={{ opacity: 0, scale: 0.8, x: '-50%', y: '-30%', top: '50%' }}
              animate={
                cardState === 'bottom'
                  ? { opacity: 1, scale: 1, x: '-50%', y: '-100%', top: 'calc(100% - 24px)' }
                  : { opacity: 1, scale: 1, x: '-50%', y: '-50%', top: '50%' }
              }
              transition={{ type: 'spring', bounce: 0.4, duration: 1.2 }}
              className="absolute left-1/2 w-[90%] max-w-md bg-white/60 backdrop-blur-md py-5 px-6 rounded-3xl shadow-2xl border border-white/50 z-50 overflow-hidden"
            >
              <div className="relative z-10 space-y-3">
                <h1 className="text-3xl md:text-4xl font-serif text-blue-800 font-bold drop-shadow-md flex flex-col items-center gap-1">
                  <span>Happy</span>
                  <span className="relative inline-block text-5xl md:text-6xl font-black py-1">
                    <span className="absolute inset-0 text-amber-900/60 translate-y-1 blur-[1px]">35th</span>
                    <span className="relative text-transparent bg-clip-text bg-gradient-to-tr from-amber-700 via-yellow-500 to-amber-900">35th</span>
                  </span>
                  <span>Birthday</span>
                  <span>Little Bro!</span>
                </h1>
                <div className="flex justify-center space-x-3 text-blue-700">
                  <Heart className="w-6 h-6 fill-current animate-bounce" />
                  <Gift className="w-6 h-6 animate-bounce" style={{ animationDelay: '0.2s' }} />
                  <Heart className="w-6 h-6 fill-current animate-bounce" style={{ animationDelay: '0.4s' }} />
                </div>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 2.5, duration: 0.8 }}
                  className="text-base md:text-lg font-medium text-blue-900 pt-1 text-center"
                >
                  Your gift is on your way via email!
                </motion.p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Counter */}
      <AnimatePresence>
        {!isOpened && (
          <motion.div 
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-sm px-6 py-3 rounded-full shadow-md z-30 border border-emerald-200"
          >
            <motion.div 
              key={score}
              initial={{ scale: 1.4, rotate: -3, color: '#10b981' }}
              animate={{ scale: 1, rotate: 0, color: '#065f46' }}
              transition={{ type: 'spring', stiffness: 500, damping: 15 }}
              className="font-bold text-xl whitespace-nowrap origin-center"
            >
              Caught: {score} / {TOTAL_ROSES}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bouquet Area (Bottom) */}
      <div className="flex-1 relative w-full max-w-md mx-auto z-10 mt-auto max-h-[50vh]">
        <AnimatePresence>
          {caughtRoses.map(rose => (
            <motion.div
              key={rose.id}
              initial={{ scale: 0, opacity: 0, y: -100 }}
              animate={
                isOpened 
                ? { 
                    scale: rose.scale, 
                    opacity: 1, 
                    rotate: [rose.rot - 8, rose.rot + 8, rose.rot - 8],
                    x: '-50%', y: '-50%'
                  }
                : { 
                    scale: rose.scale, 
                    opacity: 1, 
                    rotate: rose.rot, 
                    x: '-50%', y: '-50%' 
                  }
              }
              transition={
                isOpened 
                ? { 
                    rotate: { repeat: Infinity, duration: 3 + rose.delay, ease: "easeInOut" },
                    scale: { type: 'spring' }
                  }
                : { type: 'spring', bounce: 0.5 }
              }
              className="absolute w-24 h-24 md:w-32 md:h-32 origin-center"
              style={{ left: `${rose.x}%`, top: `${rose.y}%` }}
            >
              <YellowRose className="w-full h-full" />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

    </div>
  );
}
