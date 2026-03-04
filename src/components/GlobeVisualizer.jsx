import React, { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, Html } from '@react-three/drei';
import * as THREE from 'three';

// US state coordinates (lat/lng) mapped to 3D sphere positions
const US_HOTSPOTS = [
    { name: 'TX', lat: 31.0, lng: -100.0, grade: 'A', color: '#22c55e' },
    { name: 'FL', lat: 27.6, lng: -81.5, grade: 'A', color: '#22c55e' },
    { name: 'CA', lat: 36.8, lng: -119.4, grade: 'B', color: '#3b82f6' },
    { name: 'GA', lat: 32.2, lng: -83.4, grade: 'A+', color: '#22c55e' },
    { name: 'AZ', lat: 34.0, lng: -111.1, grade: 'A', color: '#22c55e' },
    { name: 'IL', lat: 40.6, lng: -89.0, grade: 'B', color: '#3b82f6' },
    { name: 'OH', lat: 40.4, lng: -82.7, grade: 'C', color: '#f59e0b' },
    { name: 'NY', lat: 42.2, lng: -74.9, grade: 'B', color: '#3b82f6' },
    { name: 'NJ', lat: 40.1, lng: -74.4, grade: 'B', color: '#3b82f6' },
    { name: 'IA', lat: 41.9, lng: -93.1, grade: 'A+', color: '#22c55e' },
    { name: 'CO', lat: 39.0, lng: -105.5, grade: 'A', color: '#22c55e' },
    { name: 'IN', lat: 39.8, lng: -86.1, grade: 'C', color: '#f59e0b' },
    { name: 'MD', lat: 39.0, lng: -76.6, grade: 'B', color: '#3b82f6' },
    { name: 'PA', lat: 41.2, lng: -77.2, grade: 'C', color: '#f59e0b' },
    { name: 'SC', lat: 33.8, lng: -81.2, grade: 'C', color: '#f59e0b' },
];

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
function DataPoints({ radius = 2.02 }) {
    const groupRef = useRef();

    useFrame((state) => {
        if (groupRef.current) {
            groupRef.current.children.forEach((child, i) => {
                if (child.material) {
                    child.material.opacity = 0.6 + Math.sin(state.clock.elapsedTime * 2 + i) * 0.3;
                }
            });
        }
    });

    return (
        <group ref={groupRef}>
            {US_HOTSPOTS.map((spot, i) => {
                const pos = latLngToSphere(spot.lat, spot.lng, radius);
                return (
                    <mesh key={i} position={pos}>
                        <sphereGeometry args={[0.035, 8, 8]} />
                        <meshBasicMaterial color={spot.color} transparent opacity={0.8} />
                    </mesh>
                );
            })}
        </group>
    );
}

// The main globe mesh
function GlobeMesh() {
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

            <DataPoints />
        </group>
    );
}

// Main exported component
export default function GlobeVisualizer({ height = '400px' }) {
    return (
        <div
            style={{
                width: '100%',
                height,
                position: 'relative',
                borderRadius: '1.5rem',
                overflow: 'hidden',
                background: 'radial-gradient(ellipse at center, rgba(99, 102, 241, 0.08) 0%, transparent 70%)',
            }}
        >
            <Canvas
                camera={{ position: [0, 0, 5.5], fov: 40 }}
                gl={{ antialias: true, alpha: true }}
                style={{ background: 'transparent' }}
            >
                <ambientLight intensity={0.3} />
                <pointLight position={[10, 10, 10]} intensity={0.8} />
                <pointLight position={[-10, -10, -5]} intensity={0.3} color="#818cf8" />

                <Suspense fallback={null}>
                    <GlobeMesh />
                    <ParticleField />
                </Suspense>

                <OrbitControls
                    enableZoom={false}
                    enablePan={false}
                    autoRotate
                    autoRotateSpeed={0.3}
                    minPolarAngle={Math.PI / 3}
                    maxPolarAngle={Math.PI / 1.5}
                />
            </Canvas>

            {/* Overlay info */}
            <div
                style={{
                    position: 'absolute',
                    bottom: '1rem',
                    left: '1rem',
                    right: '1rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end',
                    pointerEvents: 'none',
                }}
            >
                <div>
                    <div style={{ color: '#94a3b8', fontSize: '9px', fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                        Live Market Intelligence
                    </div>
                    <div style={{ color: '#e2e8f0', fontSize: '18px', fontWeight: 900, marginTop: '2px' }}>
                        US Tax Auction Globe
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    {[
                        { color: '#22c55e', label: 'A/A+ Grade' },
                        { color: '#3b82f6', label: 'B Grade' },
                        { color: '#f59e0b', label: 'C Grade' },
                    ].map((item, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.color }} />
                            <span style={{ color: '#64748b', fontSize: '10px', fontWeight: 700 }}>{item.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
