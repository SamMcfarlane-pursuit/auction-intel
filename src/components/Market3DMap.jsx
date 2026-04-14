import React, { useRef, useMemo, useState, Suspense, Component } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Float, Html, ContactShadows, PresentationControls } from '@react-three/drei';
import * as THREE from 'three';

/**
 * Market3DMap - High-fidelity 3D bar chart map of the US
 * Represents liquidity (height) and score (color) per state
 */
const STATE_DATA = [
    { name: 'WA', x: -4.5, z: -2.0, liquidity: 0.8, score: 88, capRate: '5.2%', deals: 124 },
    { name: 'OR', x: -4.4, z: -1.2, liquidity: 0.6, score: 75, capRate: '5.8%', deals: 82 },
    { name: 'CA', x: -4.2, z: 0.5, liquidity: 1.2, score: 72, capRate: '4.9%', deals: 452 },
    { name: 'NV', x: -3.5, z: -0.5, liquidity: 0.7, score: 82, capRate: '6.1%', deals: 115 },
    { name: 'ID', x: -3.5, z: -1.8, liquidity: 0.4, score: 65, capRate: '6.4%', deals: 42 },
    { name: 'UT', x: -3.0, z: -0.8, liquidity: 0.5, score: 78, capRate: '5.9%', deals: 67 },
    { name: 'AZ', x: -3.0, z: 0.5, liquidity: 0.9, score: 85, capRate: '6.2%', deals: 189 },
    { name: 'MT', x: -2.5, z: -2.2, liquidity: 0.3, score: 60, capRate: '6.8%', deals: 24 },
    { name: 'WY', x: -2.2, z: -1.5, liquidity: 0.3, score: 58, capRate: '7.1%', deals: 18 },
    { name: 'CO', x: -2.0, z: -0.5, liquidity: 0.7, score: 84, capRate: '5.5%', deals: 156 },
    { name: 'NM', x: -1.8, z: 0.8, liquidity: 0.4, score: 62, capRate: '6.7%', deals: 31 },
    { name: 'TX', x: -0.5, z: 1.5, liquidity: 1.4, score: 92, capRate: '6.5%', deals: 890 },
    { name: 'FL', x: 3.5, z: 1.8, liquidity: 1.3, score: 95, capRate: '6.3%', deals: 742 },
    { name: 'GA', x: 3.0, z: 1.2, liquidity: 0.9, score: 89, capRate: '6.0%', deals: 312 },
    { name: 'NY', x: 4.2, z: -1.5, liquidity: 1.1, score: 81, capRate: '4.8%', deals: 521 },
    { name: 'IL', x: 1.5, z: -0.5, liquidity: 0.8, score: 78, capRate: '6.8%', deals: 284 },
    { name: 'OH', x: 2.8, z: -0.5, liquidity: 0.7, score: 72, capRate: '7.2%', deals: 198 },
    { name: 'MI', x: 2.5, z: -1.2, liquidity: 0.6, score: 68, capRate: '7.4%', deals: 145 },
    { name: 'NC', x: 3.8, z: 0.5, liquidity: 0.85, score: 87, capRate: '5.9%', deals: 215 },
    { name: 'TN', x: 2.2, z: 0.8, liquidity: 0.75, score: 83, capRate: '6.1%', deals: 167 },
];

function Bar({ position, height, score, label, capRate, deals, onHover }) {
    const meshRef = useRef();
    const [hovered, setHovered] = useState(false);
    
    const color = useMemo(() => {
        if (score >= 90) return '#10b981'; // Emerald
        if (score >= 80) return '#3b82f6'; // Blue
        if (score >= 70) return '#f59e0b'; // Amber
        return '#ef4444'; // Red
    }, [score]);

    useFrame((state) => {
        if (meshRef.current) {
            // Subtle wave animation when not hovered
            const speed = hovered ? 0.5 : 2;
            const amp = hovered ? 0.02 : 0.05;
            meshRef.current.position.y = (height / 2) + Math.sin(state.clock.elapsedTime * speed + position[0]) * amp;
            
            // Interaction scale
            const targetScale = hovered ? 1.2 : 1;
            meshRef.current.scale.lerp(new THREE.Vector3(targetScale, 1, targetScale), 0.1);
        }
    });

    return (
        <group position={position}>
            <mesh 
                ref={meshRef}
                onPointerOver={(e) => { e.stopPropagation(); setHovered(true); onHover(label); }}
                onPointerOut={() => { setHovered(false); onHover(null); }}
            >
                <boxGeometry args={[0.3, height, 0.3]} />
                <meshStandardMaterial 
                    color={color} 
                    emissive={color}
                    emissiveIntensity={hovered ? 0.8 : 0.3}
                    metalness={0.9}
                    roughness={0.1}
                    transparent
                    opacity={0.8}
                />
                
                {/* Visual "Glow" Core */}
                <mesh scale={[0.8, 1.01, 0.8]}>
                    <boxGeometry args={[0.3, height, 0.3]} />
                    <meshBasicMaterial color="white" transparent opacity={hovered ? 0.2 : 0} />
                </mesh>
            </mesh>

            {/* Floating Label */}
            <Float speed={hovered ? 4 : 2} rotationIntensity={0.2} floatIntensity={0.5}>
                <Text
                    position={[0, height + 0.4, 0]}
                    fontSize={0.15}
                    color={hovered ? "white" : "#94a3b8"}
                    anchorX="center"
                    anchorY="middle"
                    font="/fonts/Inter-Bold.ttf"
                >
                    {label}
                </Text>
            </Float>

            {/* Interactive Data Card */}
            {hovered && (
                <Html distanceFactor={10} position={[0.5, height, 0]} zIndexRange={[100, 0]}>
                    <div className="bg-slate-900/90 backdrop-blur-xl border border-white/20 p-4 rounded-md shadow-none w-48 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-white font-semibold text-lg">{label}</span>
                            <span className="text-[10px] bg-slate-950/10 px-2 py-0.5 rounded-sm text-slate-300 font-bold">STATE_{label}</span>
                        </div>
                        <div className="space-y-1.5">
                            <div className="flex justify-between items-center">
                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Liquidity</span>
                                <span className="text-xs text-emerald-400 font-semibold">{(height * 100).toFixed(0)}%</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Avg Cap Rate</span>
                                <span className="text-xs text-blue-400 font-semibold">{capRate}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Active Deals</span>
                                <span className="text-xs text-white font-semibold">{deals}</span>
                            </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-white/5 flex gap-2">
                            <div className={`h-1 flex-1 rounded-sm ${score >= 80 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${score}%` }} />
                            <div className="h-1 flex-1 bg-slate-950/10 rounded-sm" />
                        </div>
                    </div>
                </Html>
            )}
        </group>
    );
}

function GridBackground() {
    return (
        <group position={[0, -0.01, 0]}>
            <gridHelper args={[24, 24, '#1e293b', '#0f172a']} />
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[24, 24]} />
                <meshStandardMaterial 
                    color="#020617" 
                    transparent 
                    opacity={0.8} 
                    metalness={0.8}
                    roughness={0.2}
                />
            </mesh>
        </group>
    );
}

function Market3DMap({ height = "500px" }) {
    const [hoveredState, setHoveredState] = useState(null);

    return (
        <div style={{ width: '100%', height, background: '#020617', position: 'relative', overflow: 'hidden' }}>
            <Canvas camera={{ position: [8, 8, 8], fov: 35 }} shadows dpr={[1, 2]}>
                <color attach="background" args={['#020617']} />
                
                <fog attach="fog" args={['#020617', 5, 25]} />
                
                <ambientLight intensity={0.4} />
                <pointLight position={[10, 10, 10]} intensity={1.5} color="#3b82f6" />
                <pointLight position={[-10, -10, -5]} intensity={1} color="#818cf8" />
                <spotLight position={[0, 15, 0]} angle={0.3} penumbra={1} intensity={2} castShadow />

                <Suspense fallback={null}>
                    <PresentationControls 
                        global 
                        zoom={1} 
                        rotation={[0, -Math.PI / 4, 0]} 
                        polar={[-Math.PI / 6, Math.PI / 6]} 
                        azimuth={[-Math.PI / 2, Math.PI / 2]}
                    >
                        <group scale={[0.8, 0.8, 0.8]}>
                            <GridBackground />
                            {STATE_DATA.map((state, i) => (
                                <Bar 
                                    key={i}
                                    position={[state.x, 0, state.z]}
                                    height={state.liquidity * 2.5}
                                    score={state.score}
                                    label={state.name}
                                    capRate={state.capRate}
                                    deals={state.deals}
                                    onHover={setHoveredState}
                                />
                            ))}
                        </group>
                    </PresentationControls>
                    
                    <ContactShadows 
                        position={[0, -0.02, 0]} 
                        opacity={0.4} 
                        scale={20} 
                        blur={2} 
                        far={4.5} 
                    />
                </Suspense>

                <OrbitControls 
                    enableZoom={true} 
                    autoRotate={!hoveredState} 
                    autoRotateSpeed={0.3}
                    maxPolarAngle={Math.PI / 2.2}
                    minDistance={5}
                    maxDistance={15}
                />
            </Canvas>

            {/* Pro-Refined HUD Overlay */}
            <div className="absolute top-10 left-10 pointer-events-none">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-1 h-1 rounded-sm bg-blue-500 shadow-[0_0_8px_#3b82f6]" />
                    <span className="text-[8px] text-slate-500 font-semibold uppercase tracking-[0.4em]">Visual Projection System</span>
                </div>
                <h2 className="text-lg font-mono font-semibold text-white/90 tracking-tight leading-none">Liquidity Matrix</h2>
            </div>

            <div className="absolute bottom-10 right-10 pointer-events-none">
                <div className="bg-slate-950/40 backdrop-blur-2xl border border-white/5 p-5 rounded-[2rem]">
                    <div className="text-[8px] text-slate-500 font-bold uppercase tracking-[0.25em] mb-4 border-b border-white/5 pb-2">Institutional Tiering</div>
                    <div className="flex flex-col gap-3">
                        <LegendItem color="#10b981" label="Tier 1 Elite" />
                        <LegendItem color="#3b82f6" label="Standard Growth" />
                        <LegendItem color="#475569" label="Opportunistic" />
                    </div>
                </div>
            </div>
            
            {/* Scanline Effect */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
        </div>
    );
}

function LegendItem({ color, label }) {
    return (
        <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-sm shadow-none" style={{ background: color, boxShadow: `0 0 10px ${color}66` }} />
            <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">{label}</span>
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
