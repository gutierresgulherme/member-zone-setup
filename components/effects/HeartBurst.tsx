
import React, { useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart } from 'lucide-react';

interface HeartParticle {
    id: number;
    x: number;
    y: number;
    size: number;
    color: string;
    rotation: number;
    side: 'left' | 'right';
}

export interface HeartBurstRef {
    burst: () => void;
}

const HeartBurst = forwardRef<HeartBurstRef>((_, ref) => {
    const [hearts, setHearts] = useState<HeartParticle[]>([]);

    const burst = useCallback(() => {
        const newHearts: HeartParticle[] = [];
        const count = 20; // Hearts per side

        for (let i = 0; i < count; i++) {
            // Left Side
            newHearts.push({
                id: Math.random(),
                x: -100, // Starts off-screen left
                y: 20 + Math.random() * 60, // Randomized vertical position
                size: 15 + Math.random() * 25,
                color: ['#ff4d4d', '#ff0066', '#ff99cc', '#ff1a75'][Math.floor(Math.random() * 4)],
                rotation: Math.random() * 360,
                side: 'left'
            });

            // Right Side
            newHearts.push({
                id: Math.random(),
                x: 100, // Starts off-screen right (percentage based in css)
                y: 20 + Math.random() * 60,
                size: 15 + Math.random() * 25,
                color: ['#ff4d4d', '#ff0066', '#ff99cc', '#ff1a75'][Math.floor(Math.random() * 4)],
                rotation: Math.random() * 360,
                side: 'right'
            });
        }

        setHearts(prev => [...prev, ...newHearts]);

        // Cleanup after animation completes (approx 2s)
        setTimeout(() => {
            setHearts(prev => prev.filter(h => !newHearts.find(nh => nh.id === h.id)));
        }, 2000);
    }, []);

    useImperativeHandle(ref, () => ({
        burst
    }));

    return (
        <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
            <AnimatePresence>
                {hearts.map((heart) => (
                    <motion.div
                        key={heart.id}
                        initial={{
                            x: heart.side === 'left' ? '-10vw' : '110vw',
                            y: `${heart.y}vh`,
                            opacity: 0,
                            scale: 0,
                            rotate: heart.rotation
                        }}
                        animate={{
                            x: heart.side === 'left' ? `${30 + Math.random() * 40}vw` : `${30 + Math.random() * 40}vw`,
                            y: `${heart.y - 40 - Math.random() * 20}vh`, // Fly upwards
                            opacity: [0, 1, 1, 0],
                            scale: [0, 1, 1.2, 0.5],
                            rotate: heart.rotation + 360
                        }}
                        transition={{
                            duration: 1.5 + Math.random() * 0.5,
                            ease: "easeOut"
                        }}
                        className="absolute"
                        style={{ color: heart.color }}
                    >
                        <Heart
                            size={heart.size}
                            fill="currentColor"
                            className="drop-shadow-[0_0_10px_rgba(255,50,150,0.5)]"
                        />
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
});

HeartBurst.displayName = 'HeartBurst';

export default HeartBurst;
