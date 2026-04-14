import React, { useRef, useMemo, Suspense, useState, useEffect, Component } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, Html, Float, Stars, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

// US state coordinates (lat/lng) for baseline visibility
const US_HOTSPOTS = [
    { name: 'TX', lat: 31.0, lng: -100.0, grade: 'A', color: '#10b981' },
    { name: 'FL', lat: 27.6, lng: -81.5, grade: 'A', color: '#10b981' },
    { name: 'CA', lat: 36.8, lng: -119.4, grade: 'B', color: '#3b82f6' },
    { name: 'GA', lat: 32.2, lng: -83.4, grade: 'A+', color: '#10b981' },
    { name: 'AZ', lat: 34.0, lng: -111.1, grade: 'A', color: '#10b981' },
    { name: 'NY', lat: 42.2, lng: -74.9, grade: 'B', color: '#3b82f6' },
    { name: 'IL', lat: 40.6, lng: -89.0, grade: 'B', color: '#3b82f6' },
];

const STATE_COORDS = {
    'NV': { lat: 38.8, lng: -116.4 },
    'WA': { lat: 47.7, lng: -120.7 },
    'IA': { lat: 41.9, lng: -93.1 },
    'CO': { lat: 39.0, lng: -105.5 },
    'NC': { lat: 35.7, lng: -79.0 },
    'OH': { lat: 40.4, lng: -82.7 },
    'AL': { lat: 32.3, lng: -86.9 },
    'MI': { lat: 44.3, lng: -85.6 },
    'PA': { lat: 41.2, lng: -77.2 },
    'MD': { lat: 39.0, lng: -76.6 },
    'SC': { lat: 33.8, lng: -81.2 },
    'VA': { lat: 37.4, lng: -78.6 },
};

function latLngToSphere(lat, lng, radius) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);
    return new THREE.Vector3(
        -(radius * Math.sin(phi) * Math.cos(theta)),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta)
    );
}

function DataArc({ start, end, radius = 2, color = '#6366f1' }) {
    const curve = useMemo(() => {
        const startVec = latLngToSphere(start.lat, start.lng, radius);
        const endVec = latLngToSphere(end.lat, end.lng, radius);
        
        // Calculate mid-point with altitude
        const midVec = new THREE.Vector3().addVectors(startVec, endVec).normalize().multiplyScalar(radius * 1.5);
        
        return new THREE.QuadraticBezierCurve3(startVec, midVec, endVec);
    }, [start, end, radius]);

    const lineRef = useRef();
    useFrame((state) => {
        if (lineRef.current) {
            lineRef.current.material.dashOffset = -state.clock.elapsedTime * 2;
        }
    });

    return (
        <mesh ref={lineRef}>
            <tubeGeometry args={[curve, 20, 0.005, 8, false]} />
            <meshBasicMaterial 
                color={color} 
                transparent 
                opacity={0.3} 
                dashSize={0.2} 
                gapSize={0.1}
            />
        </mesh>
    );
}

function Atmosphere({ radius = 2 }) {
    const meshRef = useRef();
    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.rotation.y = state.clock.elapsedTime * 0.1;
        }
    });

    return (
        <mesh ref={meshRef}>
            <sphereGeometry args={[radius * 1.15, 64, 64]} />
            <meshPhongMaterial
                color="#4f46e5"
                transparent
                opacity={0.05}
                side={THREE.BackSide}
                blending={THREE.AdditiveBlending}
            />
        </mesh>
    );
}

function GlobeVisualizer({ height = '450px' }) {
    const [deals, setDeals] = useState([]);
    
    useEffect(() => {
        const apiBase = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8080/api';
        fetch(`${apiBase}/deals/top?limit=40`)
            .then(res => res.json())
            .then(data => setDeals(data))
            .catch(err => console.error("Globe deals fetch failed", err));
    }, []);

    return (
        <div style={{ width: '100%', height, position: 'relative', overflow: 'hidden', background: '#020617' }}>
            <Canvas dpr={[1, 2]}>
                <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={40} />
                <color attach="background" args={['#020617']} />
                <fog attach="fog" args={['#020617', 5, 10]} />
                
                <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
                
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1.5} color="#4f46e5" />
                <spotLight position={[-10, 20, 10]} angle={0.15} penumbra={1} intensity={1} color="#818cf8" />

                <Suspense fallback={null}>
                    <group rotation={[0, -Math.PI / 2, 0]}>
                        {/* Core Globe */}
                        <Sphere args={[2, 64, 64]}>
                            <meshStandardMaterial
                                color="#0f172a"
                                metalness={0.9}
                                roughness={0.1}
                                emissive="#1e1b4b"
                                emissiveIntensity={0.2}
                            />
                        </Sphere>
                        
                        {/* Wireframe Overlay */}
                        <Sphere args={[2.01, 48, 48]}>
                            <meshBasicMaterial
                                color="#4f46e5"
                                wireframe
                                transparent
                                opacity={0.1}
                            />
                        </Sphere>

                        {/* Scan Rings */}
                        <mesh rotation={[Math.PI / 2, 0, 0]}>
                            <ringGeometry args={[2.05, 2.06, 64]} />
                            <meshBasicMaterial color="#6366f1" transparent opacity={0.3} side={THREE.DoubleSide} />
                        </mesh>

                        <Atmosphere radius={2} />

                        {/* Hotspots */}
                        {US_HOTSPOTS.map((spot, i) => {
                            const pos = latLngToSphere(spot.lat, spot.lng, 2.02);
                            return (
                                <group key={i} position={pos}>
                                    <mesh>
                                        <sphereGeometry args={[0.03, 16, 16]} />
                                        <meshBasicMaterial color={spot.color} />
                                    </mesh>
                                    <mesh scale={[2.5, 2.5, 2.5]}>
                                        <sphereGeometry args={[0.03, 16, 16]} />
                                        <meshBasicMaterial color={spot.color} transparent opacity={0.2} />
                                    </mesh>
                                </group>
                            );
                        })}

                        {/* Data Arcs */}
                        <DataArc start={US_HOTSPOTS[0]} end={US_HOTSPOTS[1]} radius={2.02} color="#fbbf24" />
                        <DataArc start={US_HOTSPOTS[2]} end={US_HOTSPOTS[0]} radius={2.02} color="#3b82f6" />
                        <DataArc start={US_HOTSPOTS[3]} end={US_HOTSPOTS[5]} radius={2.02} color="#10b981" />
                    </group>
                </Suspense>

                <OrbitControls
                    enableZoom={false}
                    enablePan={false}
                    autoRotate
                    autoRotateSpeed={0.4}
                    minPolarAngle={Math.PI / 3}
                    maxPolarAngle={Math.PI / 1.5}
                />
            </Canvas>

            {/* Pro-Refined HUD */}
            <div className="absolute inset-0 pointer-events-none p-10 flex flex-col justify-between">
                <div>
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-1 h-1 rounded-sm bg-emerald-500 animate-none shadow-[0_0_8px_#10b981]" />
                        <span className="text-[8px] text-slate-400 font-bold uppercase tracking-[0.4em]">Live Intelligence Sync</span>
                    </div>
                    <h2 className="text-lg font-mono font-semibold text-white tracking-tight opacity-90">Global Command</h2>
                    <div className="h-0.5 w-12 bg-indigo-500/30 mt-3 rounded-sm" />
                </div>

                <div className="flex justify-between items-end">
                    <div className="flex gap-12">
                        <div>
                            <div className="text-[8px] text-slate-500 font-semibold uppercase tracking-widest mb-1">States</div>
                            <div className="text-lg font-semibold text-white/90">50</div>
                        </div>
                        <div>
                            <div className="text-[8px] text-slate-500 font-semibold uppercase tracking-widest mb-1">Active Pipeline</div>
                            <div className="text-lg font-semibold text-indigo-400">14.2K</div>
                        </div>
                    </div>
                    
                    <div className="flex flex-col items-end opacity-40">
                        <div className="text-[8px] text-slate-500 font-mono font-bold tracking-widest">NETWORK_NODE::ALPHA</div>
                        <div className="text-[7px] text-slate-600 font-mono uppercase">Standard Encryption Active</div>
                    </div>
                </div>
            </div>
            
            {/* Cinematic Scanlines */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
        </div>
    );
}

class GlobeErrorBoundary extends Component {
    constructor(props) { super(props); this.state = { hasError: false }; }
    static getDerivedStateFromError() { return { hasError: true }; }
    componentDidCatch(error) { console.warn('[Globe] WebGL Error caught:', error.message); }
    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    width: '100%', height: this.props.height || '450px',
                    borderRadius: '2rem',
                    background: 'radial-gradient(circle at center, #1e293b, #0f172a)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px'
                }}>
                    <div style={{ fontSize: '2.5rem' }}>🌐</div>
                    <div style={{ color: '#94a3b8', fontSize: '0.7rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
                        3D Globe Unavailable
                    </div>
                    <div style={{ color: '#475569', fontSize: '0.65rem' }}>WebGL context not supported here</div>
                </div>
            );
        }
        return this.props.children;
    }
}

const GlobeVisualizerSafe = (props) => (
    <GlobeErrorBoundary height={props.height}>
        <GlobeVisualizer {...props} />
    </GlobeErrorBoundary>
);

export { GlobeVisualizerSafe as default };
