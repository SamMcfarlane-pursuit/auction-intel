import React, { useRef, useMemo, Component } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Float } from '@react-three/drei';
import * as THREE from 'three';

/**
 * Market3DMap - High-fidelity 3D bar chart map of the US
 * Represents liquidity (height) and score (color) per state
 */
const STATE_DATA = [
    { name: 'WA', x: -4.5, z: -2.0, liquidity: 0.8, score: 88 },
    { name: 'OR', x: -4.4, z: -1.2, liquidity: 0.6, score: 75 },
    { name: 'CA', x: -4.2, z: 0.5, liquidity: 1.0, score: 72 },
    { name: 'NV', x: -3.5, z: -0.5, liquidity: 0.7, score: 82 },
    { name: 'ID', x: -3.5, z: -1.8, liquidity: 0.4, score: 65 },
    { name: 'UT', x: -3.0, z: -0.8, liquidity: 0.5, score: 78 },
    { name: 'AZ', x: -3.0, z: 0.5, liquidity: 0.9, score: 85 },
    { name: 'MT', x: -2.5, z: -2.2, liquidity: 0.3, score: 60 },
    { name: 'WY', x: -2.2, z: -1.5, liquidity: 0.3, score: 58 },
    { name: 'CO', x: -2.0, z: -0.5, liquidity: 0.7, score: 84 },
    { name: 'NM', x: -1.8, z: 0.8, liquidity: 0.4, score: 62 },
    { name: 'TX', x: -0.5, z: 1.5, liquidity: 1.1, score: 92 },
    { name: 'FL', x: 3.5, z: 1.8, liquidity: 1.0, score: 95 },
    { name: 'GA', x: 3.0, z: 1.2, liquidity: 0.9, score: 89 },
    { name: 'NY', x: 4.2, z: -1.5, liquidity: 1.0, score: 81 },
    { name: 'IL', x: 1.5, z: -0.5, liquidity: 0.8, score: 78 },
    { name: 'OH', x: 2.8, z: -0.5, liquidity: 0.7, score: 72 },
    { name: 'MI', x: 2.5, z: -1.2, liquidity: 0.6, score: 68 },
];

function Bar({ position, height, score, label }) {
    const meshRef = useRef();
    const color = useMemo(() => {
        if (score >= 90) return '#22c55e'; // Emerald
        if (score >= 80) return '#3b82f6'; // Blue
        if (score >= 70) return '#f59e0b'; // Amber
        return '#ef4444'; // Red
    }, [score]);

    useFrame((state) => {
        if (meshRef.current) {
            // Subtle wave animation
            meshRef.current.position.y = (height / 2) + Math.sin(state.clock.elapsedTime * 2 + position[0]) * 0.05;
        }
    });

    return (
        <group position={position}>
            <mesh ref={meshRef}>
                <boxGeometry args={[0.3, height, 0.3]} />
                <meshStandardMaterial 
                    color={color} 
                    emissive={color}
                    emissiveIntensity={0.2}
                    metalness={0.8}
                    roughness={0.2}
                    transparent
                    opacity={0.9}
                />
            </mesh>
            <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
                <Text
                    position={[0, height + 0.3, 0]}
                    fontSize={0.12}
                    color="white"
                    font="/fonts/Inter-Bold.ttf" // Fallback to default if not found
                    anchorX="center"
                    anchorY="middle"
                >
                    {label}
                </Text>
            </Float>
        </group>
    );
}

function Market3DMap({ height = "500px" }) {
    return (
        <div style={{ width: '100%', height, background: '#020617', borderRadius: '1.5rem', overflow: 'hidden', position: 'relative', border: '1px solid rgba(255,255,255,0.05)' }}>
            <Canvas camera={{ position: [5, 5, 5], fov: 45 }}>
                <color attach="background" args={['#020617']} />
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1} />
                <gridHelper args={[20, 20, '#1e293b', '#0f172a']} position={[0, -0.01, 0]} />
                
                <Suspense fallback={null}>
                    <group scale={[1.2, 1.2, 1.2]}>
                        {STATE_DATA.map((state, i) => (
                            <Bar 
                                key={i}
                                position={[state.x, 0, state.z]}
                                height={state.liquidity * 2}
                                score={state.score}
                                label={state.name}
                            />
                        ))}
                    </group>
                </Suspense>

                <OrbitControls 
                    enableZoom={true} 
                    autoRotate={true} 
                    autoRotateSpeed={0.5}
                    maxPolarAngle={Math.PI / 2.5}
                />
            </Canvas>

            {/* Premium UI Overlay */}
            <div className="absolute top-6 left-6 pointer-events-none">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                        <span className="text-xl">📊</span>
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-white tracking-tight">Market High-Density Map</h2>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Real-time Liquidity (Y-Axis) vs Quality (Color)</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="absolute bottom-6 left-6 right-6 flex justify-between items-center pointer-events-none">
                <div className="flex gap-4">
                    <LegendItem color="#22c55e" label="Institutional" />
                    <LegendItem color="#3b82f6" label="Strong" />
                    <LegendItem color="#f59e0b" label="Opportunistic" />
                </div>
                <div className="text-[10px] text-slate-600 font-mono font-bold uppercase tracking-widest">
                    V3_ENGINE_PROJECTION_ACTIVE
                </div>
            </div>
        </div>
    );
}

function LegendItem({ color, label }) {
    return (
        <div className="flex items-center gap-2">
            <div className="w-2 h-8 rounded-full" style={{ background: color, opacity: 0.6 }} />
            <span className="text-[10px] text-slate-400 font-black uppercase">{label}</span>
        </div>
    );
}

// ErrorBoundary for Three.js WebGL in Market3DMap
class Map3DErrorBoundary extends Component {
    constructor(props) { super(props); this.state = { hasError: false }; }
    static getDerivedStateFromError() { return { hasError: true }; }
    componentDidCatch(error) { console.warn('[Map3D] WebGL Error:', error.message); }
    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    width: '100%', height: this.props.height || '500px',
                    background: '#020617', borderRadius: '1.5rem',
                    border: '1px solid rgba(255,255,255,0.05)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px'
                }}>
                    <div style={{ fontSize: '2.5rem' }}>📊</div>
                    <div style={{ color: '#94a3b8', fontSize: '0.7rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
                        3D Market Map Unavailable
                    </div>
                    <div style={{ color: '#475569', fontSize: '0.65rem' }}>WebGL context not supported in this environment</div>
                </div>
            );
        }
        return this.props.children;
    }
}

const Market3DMapSafe = (props) => (
    <Map3DErrorBoundary height={props.height}>
        <Market3DMap {...props} />
    </Map3DErrorBoundary>
);

export { Market3DMapSafe as default };
