import React, { useRef, useMemo, Suspense, useState, useEffect, Component } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, Html } from '@react-three/drei';
import * as THREE from 'three';

// US state coordinates (lat/lng) for baseline visibility
const US_HOTSPOTS = [
    { name: 'TX', lat: 31.0, lng: -100.0, grade: 'A', color: '#22c55e' },
    { name: 'FL', lat: 27.6, lng: -81.5, grade: 'A', color: '#22c55e' },
    { name: 'CA', lat: 36.8, lng: -119.4, grade: 'B', color: '#3b82f6' },
    { name: 'GA', lat: 32.2, lng: -83.4, grade: 'A+', color: '#22c55e' },
    { name: 'AZ', lat: 34.0, lng: -111.1, grade: 'A', color: '#22c55e' },
    { name: 'NY', lat: 42.2, lng: -74.9, grade: 'B', color: '#3b82f6' },
    { name: 'IL', lat: 40.6, lng: -89.0, grade: 'B', color: '#3b82f6' },
];

// Mapper for state centroids (approximate) to fetch deal coordinates
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

// Particle field for ambient atmosphere
function ParticleField({ count = 2000 }) {
    const mesh = useRef();
    const positions = useMemo(() => {
        const pos = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            const r = 2.8 + Math.random() * 1.5;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            pos[i * 3 + 1] = r * Math.cos(phi);
            pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
        }
        return pos;
    }, [count]);

    useFrame((state) => {
        if (mesh.current) {
            mesh.current.rotation.y = state.clock.elapsedTime * 0.02;
        }
    });

    return (
        <points ref={mesh}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={count}
                    array={positions}
                    itemSize={3}
                />
            </bufferGeometry>
            <pointsMaterial size={0.008} color="#818cf8" transparent opacity={0.4} sizeAttenuation />
        </points>
    );
}

// Glowing data points on the globe
function DealPins({ radius = 2.02, deals = [] }) {
    const groupRef = useRef();

    useFrame((state) => {
        if (groupRef.current) {
            groupRef.current.children.forEach((child, i) => {
                if (child.material) {
                    const pulse = 0.5 + Math.sin(state.clock.elapsedTime * 4 + i) * 0.5;
                    child.material.opacity = 0.4 + pulse * 0.6;
                    child.scale.setScalar(1 + pulse * 0.5);
                }
            });
        }
    });

    return (
        <group ref={groupRef}>
            {deals.slice(0, 30).map((deal, i) => {
                // Approximate coordinate if exact not available
                const coords = STATE_COORDS[deal.state] || { lat: 39 + Math.random() * 5, lng: -98 + Math.random() * 5 };
                // Jitter slightly to separate multiple deals in same state
                const lat = coords.lat + (Math.random() - 0.5) * 2;
                const lng = coords.lng + (Math.random() - 0.5) * 2;
                const pos = latLngToSphere(lat, lng, radius);
                
                return (
                    <mesh key={i} position={pos}>
                        <sphereGeometry args={[0.04, 12, 12]} />
                        <meshBasicMaterial color="#fbbf24" transparent opacity={0.8} />
                    </mesh>
                );
            })}
        </group>
    );
}

// The main globe mesh
function GlobeMesh({ deals = [] }) {
    const meshRef = useRef();

    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.rotation.y = state.clock.elapsedTime * 0.05;
        }
    });

    return (
        <group ref={meshRef}>
            {/* Wireframe globe */}
            <Sphere args={[2, 48, 48]}>
                <meshBasicMaterial
                    color="#1e293b"
                    wireframe
                    transparent
                    opacity={0.15}
                />
            </Sphere>

            {/* Solid inner sphere */}
            <Sphere args={[1.98, 48, 48]}>
                <meshStandardMaterial
                    color="#0f172a"
                    metalness={0.3}
                    roughness={0.8}
                />
            </Sphere>

            {/* Glow ring */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
                <ringGeometry args={[2.05, 2.12, 64]} />
                <meshBasicMaterial color="#6366f1" transparent opacity={0.2} side={THREE.DoubleSide} />
            </mesh>

            <DealPins deals={deals} />
            
            {/* Baseline States */}
            {US_HOTSPOTS.map((spot, i) => {
                const pos = latLngToSphere(spot.lat, spot.lng, 2.01);
                return (
                    <mesh key={`state-${i}`} position={pos}>
                        <sphereGeometry args={[0.02, 8, 8]} />
                        <meshBasicMaterial color={spot.color} transparent opacity={0.4} />
                    </mesh>
                );
            })}
        </group>
    );
}

// Main component (not exported directly — use the safe default export below)
function GlobeVisualizer({ height = '450px' }) {
    const [deals, setDeals] = useState([]);

    useEffect(() => {
        const apiBase = import.meta.env.VITE_API_URL || 'https://auction-intel-api-sm.fly.dev/api';
        fetch(`${apiBase}/deals/top?limit=40`)
            .then(res => res.json())
            .then(data => setDeals(data))
            .catch(err => console.error("Globe deals fetch failed", err));
    }, []);

    return (
        <div
            style={{
                width: '100%',
                height,
                position: 'relative',
                borderRadius: '2rem',
                overflow: 'hidden',
                background: 'radial-gradient(circle at center, rgba(30, 41, 59, 1) 0%, rgba(15, 23, 42, 1) 100%)',
                border: '1px solid rgba(255,255,255,0.05)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}
        >
            <Canvas
                camera={{ position: [0, 0, 5.5], fov: 40 }}
                gl={{ antialias: true, alpha: true }}
                style={{ background: 'transparent' }}
            >
                <ambientLight intensity={0.4} />
                <pointLight position={[10, 10, 10]} intensity={1.2} />
                <pointLight position={[-10, -10, -5]} intensity={0.5} color="#818cf8" />

                <Suspense fallback={null}>
                    <GlobeMesh deals={deals} />
                    <ParticleField />
                </Suspense>

                <OrbitControls
                    enableZoom={false}
                    enablePan={false}
                    autoRotate
                    autoRotateSpeed={0.5}
                    minPolarAngle={Math.PI / 3}
                    maxPolarAngle={Math.PI / 1.5}
                />
            </Canvas>

            {/* Overlay info */}
            <div className="absolute inset-0 pointer-events-none p-8 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="text-amber-400 text-[10px] font-black uppercase tracking-[0.3em] mb-1">
                            Live Deal Feed
                        </div>
                        <h2 className="text-2xl font-black text-white">Global Command Center</h2>
                    </div>
                    <div className="bg-white/5 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 flex items-center gap-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-white text-[10px] font-black uppercase tracking-wider">{deals.length} active deals mapped</span>
                    </div>
                </div>

                <div className="flex justify-between items-end">
                    <div className="space-y-1">
                        <div className="text-slate-500 text-[9px] font-bold uppercase tracking-widest">Projection Model</div>
                        <div className="text-slate-300 text-xs font-mono">GRID::PHI_PHI_ALPHA_V2</div>
                    </div>
                    
                    <div className="flex gap-6">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_#fbbf24]" />
                            <span className="text-slate-400 text-[10px] font-bold">Top Deals</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 opacity-50" />
                            <span className="text-slate-400 text-[10px] font-bold">Stable Markets</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ErrorBoundary to safely catch WebGL/Three.js crashes in headless / low-GPU environments
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
                    <div style={{ color: '#475569', fontSize: '0.65rem' }}>WebGL context not supported in this environment</div>
                </div>
            );
        }
        return this.props.children;
    }
}

// Safe default export — wraps Globe in an error boundary
const GlobeVisualizerSafe = (props) => (
    <GlobeErrorBoundary height={props.height}>
        <GlobeVisualizer {...props} />
    </GlobeErrorBoundary>
);

export { GlobeVisualizerSafe as default };
