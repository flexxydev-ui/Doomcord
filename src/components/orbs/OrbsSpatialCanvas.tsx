import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { OrbData } from '../../types';
import { 
  Sparkles, Users, Activity, Eye, ArrowUpRight, 
  RotateCcw, Compass, Plus, Globe, Lock, Shield 
} from 'lucide-react';

interface OrbsSpatialCanvasProps {
  orbs: OrbData[];
  selectedOrb: OrbData | null;
  onSelectOrb: (orb: OrbData) => void;
  onEnterOrbRoom: (orb: OrbData) => void;
  onCreateOrb: () => void;
}

export const OrbsSpatialCanvas: React.FC<OrbsSpatialCanvasProps> = ({
  orbs,
  selectedOrb,
  onSelectOrb,
  onEnterOrbRoom,
  onCreateOrb
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [hoveredOrb, setHoveredOrb] = useState<OrbData | null>(null);
  const [isControlsCollapsed, setIsControlsCollapsed] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [cameraSpeed, setCameraSpeed] = useState<number>(1);

  // References for render loop and interaction
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const orbMeshesRef = useRef<{ mesh: THREE.Mesh; orb: OrbData; originalPos: THREE.Vector3 }[]>([]);
  const particlesRef = useRef<THREE.Points | null>(null);
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2(-999, -999));
  const targetCamPos = useRef<THREE.Vector3>(new THREE.Vector3(0, 5, 22));
  const currentCamPos = useRef<THREE.Vector3>(new THREE.Vector3(0, 5, 22));

  // Initialize Three.js scene
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    // Detect software WebGL
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.fog = new THREE.FogExp2(0x0a1f18, 0.025);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(0, 5, 22);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: true
    });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Studio Environment map using RoomEnvironment
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // Lighting rig
    const ambientLight = new THREE.AmbientLight(0x1a382b, 1.2);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xdcfce7, 2.0);
    keyLight.position.set(10, 15, 12);
    scene.add(keyLight);

    const fillLight = new THREE.HemisphereLight(0x059669, 0x022c22, 1.0);
    scene.add(fillLight);

    // Cosmic background particle grid
    const particleCount = 600;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 60;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 35;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 60;

      // Forest green, mint, coral particles
      const isCoral = Math.random() > 0.75;
      colors[i * 3] = isCoral ? 0.95 : 0.35;
      colors[i * 3 + 1] = isCoral ? 0.45 : 0.95;
      colors[i * 3 + 2] = isCoral ? 0.35 : 0.75;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Procedural circle texture for particles
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.5, 'rgba(255,255,255,0.4)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 32, 32);

    const particleTexture = new THREE.CanvasTexture(canvas);
    const particleMat = new THREE.PointsMaterial({
      size: 0.35,
      map: particleTexture,
      transparent: true,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);
    particlesRef.current = particles;

    // Build 3D Orbs in spatial circular layout
    const orbMeshes: { mesh: THREE.Mesh; orb: OrbData; originalPos: THREE.Vector3 }[] = [];
    const radius = 10;
    const orbCount = orbs.length;

    orbs.forEach((orb, idx) => {
      const angle = (idx / orbCount) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * (radius * 0.75);
      const y = Math.sin(idx * 1.5) * 1.8;

      const sphereGeo = new THREE.SphereGeometry(1.6, 32, 32);

      // Create procedural noise / glow texture for the orb surface
      const orbCanvas = document.createElement('canvas');
      orbCanvas.width = 128;
      orbCanvas.height = 128;
      const octx = orbCanvas.getContext('2d')!;
      const ograd = octx.createRadialGradient(64, 64, 10, 64, 64, 64);
      ograd.addColorStop(0, orb.primaryColor || '#10b981');
      ograd.addColorStop(0.7, orb.secondaryColor || '#047857');
      ograd.addColorStop(1, '#022c22');
      octx.fillStyle = ograd;
      octx.fillRect(0, 0, 128, 128);

      const orbTex = new THREE.CanvasTexture(orbCanvas);
      orbTex.colorSpace = THREE.SRGBColorSpace;

      const sphereMat = new THREE.MeshPhysicalMaterial({
        map: orbTex,
        roughness: 0.15,
        metalness: 0.4,
        clearcoat: 0.8,
        clearcoatRoughness: 0.2,
        emissive: new THREE.Color(orb.primaryColor || '#10b981'),
        emissiveIntensity: 0.35
      });

      const mesh = new THREE.Mesh(sphereGeo, sphereMat);
      mesh.position.set(x, y, z);
      mesh.userData = { orbId: orb.id, orb };

      // Add orbital halo ring around each Orb
      const ringGeo = new THREE.RingGeometry(2.1, 2.3, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(orb.secondaryColor || '#10b981'),
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.55
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2 + 0.3;
      mesh.add(ring);

      scene.add(mesh);
      orbMeshes.push({ mesh, orb, originalPos: new THREE.Vector3(x, y, z) });
    });

    orbMeshesRef.current = orbMeshes;

    // Raycaster for pointer hover and selection
    const raycaster = new THREE.Raycaster();

    const handlePointerMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const handleClick = () => {
      if (!cameraRef.current) return;
      raycaster.setFromCamera(mouseRef.current, cameraRef.current);
      const intersects = raycaster.intersectObjects(orbMeshes.map(o => o.mesh));
      if (intersects.length > 0) {
        const hitOrb = intersects[0].object.userData.orb as OrbData;
        if (hitOrb) {
          onSelectOrb(hitOrb);
          targetCamPos.current.set(
            intersects[0].object.position.x * 0.7,
            intersects[0].object.position.y + 1,
            intersects[0].object.position.z + 6
          );
        }
      }
    };

    container.addEventListener('mousemove', handlePointerMove);
    container.addEventListener('click', handleClick);

    // Resize handler
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    // Animation render loop
    let animId = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();
      const delta = clock.getDelta();

      // Slowly rotate particle field
      if (particlesRef.current) {
        particlesRef.current.rotation.y = elapsedTime * 0.02 * cameraSpeed;
        particlesRef.current.rotation.x = Math.sin(elapsedTime * 0.01) * 0.05;
      }

      // Smooth camera interpolation towards target
      currentCamPos.current.x = THREE.MathUtils.damp(currentCamPos.current.x, targetCamPos.current.x, 3, 0.016);
      currentCamPos.current.y = THREE.MathUtils.damp(currentCamPos.current.y, targetCamPos.current.y, 3, 0.016);
      currentCamPos.current.z = THREE.MathUtils.damp(currentCamPos.current.z, targetCamPos.current.z, 3, 0.016);
      camera.position.copy(currentCamPos.current);
      camera.lookAt(0, 0, 0);

      // Animate floating orbs and check raycast hover
      raycaster.setFromCamera(mouseRef.current, camera);
      const intersects = raycaster.intersectObjects(orbMeshes.map(o => o.mesh));
      const hitMesh = intersects.length > 0 ? intersects[0].object : null;

      orbMeshes.forEach(({ mesh, orb, originalPos }, i) => {
        // Floating sinusoidal bobbing
        mesh.position.y = originalPos.y + Math.sin(elapsedTime * 1.5 + i) * 0.4;
        mesh.rotation.y += 0.008;

        const isHovered = hitMesh === mesh;
        const isSelected = selectedOrb?.id === orb.id;

        const targetScale = isSelected ? 1.3 : isHovered ? 1.15 : 1.0;
        mesh.scale.setScalar(THREE.MathUtils.damp(mesh.scale.x, targetScale, 6, 0.016));

        // Pulsing emission on hover/selection
        const mat = mesh.material as THREE.MeshPhysicalMaterial;
        if (mat) {
          mat.emissiveIntensity = isHovered || isSelected ? 0.75 : 0.35;
        }
      });

      if (hitMesh) {
        setHoveredOrb(hitMesh.userData.orb);
      } else {
        setHoveredOrb(null);
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousemove', handlePointerMove);
      container.removeEventListener('click', handleClick);
      renderer.dispose();
    };
  }, [orbs, onSelectOrb, cameraSpeed, selectedOrb]);

  const resetCamera = useCallback(() => {
    targetCamPos.current.set(0, 5, 22);
  }, []);

  const categories = ['All', 'Gaming', 'Coding', 'Music', 'Anime', 'Science', 'Study'];

  const filteredOrbs = filterCategory === 'All' 
    ? orbs 
    : orbs.filter(o => o.category.toLowerCase() === filterCategory.toLowerCase());

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden bg-gradient-to-b from-[oklch(0.2_0.03_160)] via-[oklch(0.18_0.028_161)] to-[oklch(0.14_0.025_162)]">
      {/* Top Header Bar */}
      <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/5 backdrop-blur-md bg-[oklch(0.17_0.028_161)]/80">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-[oklch(0.72_0.16_32)] to-[oklch(0.85_0.12_165)] shadow-lg shadow-black/20">
            <Compass className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              Spatial Orbs Nexus
              <span className="text-xs px-2 py-0.5 rounded-full bg-[oklch(0.85_0.12_165)]/20 text-[oklch(0.85_0.12_165)] border border-[oklch(0.85_0.12_165)]/30 font-sans font-medium">
                Live 3D Viewport
              </span>
            </h1>
            <p className="text-xs text-[oklch(0.7_0.03_155)]">
              Interact with rotating interest realms · Click an Orb to inspect or enter
            </p>
          </div>
        </div>

        {/* Category Filters */}
        <div className="hidden lg:flex items-center gap-1.5 p-1 rounded-xl bg-[oklch(0.235_0.032_158)]/60 border border-white/5">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                filterCategory === cat
                  ? 'bg-gradient-to-r from-[oklch(0.72_0.16_32)] to-[oklch(0.85_0.12_165)] text-white shadow-sm'
                  : 'text-[oklch(0.7_0.03_155)] hover:text-white hover:bg-white/5'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={resetCamera}
            title="Reset 3D Camera"
            className="p-2 text-xs font-medium text-[oklch(0.7_0.03_155)] hover:text-white bg-[oklch(0.235_0.032_158)] hover:bg-[oklch(0.26_0.035_156)] rounded-lg transition-colors border border-white/5"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={onCreateOrb}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-[oklch(0.72_0.16_32)] to-[oklch(0.85_0.12_165)] rounded-lg shadow-md hover:opacity-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            Create Custom Orb
          </button>
        </div>
      </div>

      {/* Central 3D Canvas Viewport */}
      <div className="relative flex-1 w-full h-full">
        <div ref={mountRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" />

        {/* Hovered / Inspected Tooltip Card */}
        {hoveredOrb && (
          <div className="absolute top-6 left-6 z-20 max-w-sm p-4 rounded-2xl bg-[oklch(0.17_0.028_161)]/95 border border-white/10 shadow-2xl backdrop-blur-md pointer-events-none transition-all">
            <div className="flex items-center gap-3 mb-2">
              <div 
                className="w-4 h-4 rounded-full shadow-sm"
                style={{ backgroundColor: hoveredOrb.primaryColor }}
              />
              <span className="text-sm font-bold text-white tracking-wide">{hoveredOrb.name}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-[oklch(0.7_0.03_155)] border border-white/10">
                {hoveredOrb.category}
              </span>
            </div>
            <p className="text-xs text-[oklch(0.7_0.03_155)] line-clamp-2 mb-3">
              {hoveredOrb.description}
            </p>
            <div className="flex items-center justify-between text-xs text-[oklch(0.7_0.03_155)]">
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-[oklch(0.85_0.12_165)]" />
                {hoveredOrb.memberCount} members
              </span>
              <span className="flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-[oklch(0.72_0.16_32)]" />
                {hoveredOrb.activityScore}% activity
              </span>
            </div>
          </div>
        )}

        {/* Selected Orb Inspector Modal/Panel */}
        {selectedOrb && (
          <div className="absolute bottom-24 right-6 z-20 w-80 p-5 rounded-2xl bg-[oklch(0.17_0.028_161)] border border-white/10 shadow-2xl backdrop-blur-lg">
            <div className="flex items-start justify-between mb-3">
              <div>
                <span className="text-xs font-medium text-[oklch(0.85_0.12_165)] tracking-wider uppercase">
                  {selectedOrb.category} Realm
                </span>
                <h3 className="text-lg font-bold text-white">{selectedOrb.name}</h3>
              </div>
              <div 
                className="w-7 h-7 rounded-full border-2 border-white/20 shadow-md"
                style={{ backgroundColor: selectedOrb.primaryColor }}
              />
            </div>

            <p className="text-xs text-[oklch(0.7_0.03_155)] leading-relaxed mb-4">
              {selectedOrb.description}
            </p>

            <div className="grid grid-cols-2 gap-2 mb-4 p-2.5 rounded-xl bg-[oklch(0.235_0.032_158)] border border-white/5">
              <div>
                <span className="text-[10px] text-[oklch(0.7_0.03_155)] block">MEMBERS</span>
                <span className="text-sm font-bold text-white tabular-nums">{selectedOrb.memberCount}</span>
              </div>
              <div>
                <span className="text-[10px] text-[oklch(0.7_0.03_155)] block">ACTIVITY SCORE</span>
                <span className="text-sm font-bold text-[oklch(0.85_0.12_165)] tabular-nums">{selectedOrb.activityScore}/100</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onEnterOrbRoom(selectedOrb)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-semibold text-white bg-gradient-to-r from-[oklch(0.72_0.16_32)] to-[oklch(0.85_0.12_165)] hover:opacity-95 rounded-xl shadow-lg transition-all"
              >
                <span>Enter Orb Lounge</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onSelectOrb(null as any)}
                className="py-2.5 px-3 text-xs text-[oklch(0.7_0.03_155)] hover:text-white bg-[oklch(0.235_0.032_158)] rounded-xl border border-white/5"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sleek Collapsible Bottom Dock (Zero Viewport Occlusion per Three.js Directives) */}
      <div className="relative z-20 flex flex-col items-center pb-4 px-6 pointer-events-none">
        {/* Toggle Drawer Button */}
        <button
          onClick={() => setIsControlsCollapsed(!isControlsCollapsed)}
          className="pointer-events-auto px-4 py-1 mb-2 text-[11px] font-medium text-[oklch(0.7_0.03_155)] hover:text-white bg-[oklch(0.17_0.028_161)]/90 border border-white/10 rounded-full shadow-md backdrop-blur-md transition-all"
        >
          {isControlsCollapsed ? '▲ Show Orbs Navigator' : '▼ Hide Controls'}
        </button>

        {/* Horizontal Dock Cards */}
        <div 
          className={`pointer-events-auto w-full max-w-4xl p-2.5 rounded-2xl bg-[oklch(0.17_0.028_161)]/90 border border-white/10 shadow-2xl backdrop-blur-md transition-all duration-300 ${
            isControlsCollapsed ? 'opacity-0 translate-y-6 pointer-events-none h-0 p-0 overflow-hidden' : 'opacity-100 translate-y-0'
          }`}
        >
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {filteredOrbs.map((orb) => {
              const isSelected = selectedOrb?.id === orb.id;
              return (
                <button
                  key={orb.id}
                  onClick={() => onSelectOrb(orb)}
                  className={`flex items-center gap-3 px-3.5 py-2 rounded-xl border transition-all shrink-0 text-left ${
                    isSelected
                      ? 'bg-[oklch(0.235_0.032_158)] border-[oklch(0.85_0.12_165)] shadow-md'
                      : 'bg-white/5 border-white/5 hover:border-white/15 hover:bg-white/10'
                  }`}
                >
                  <div 
                    className="w-3.5 h-3.5 rounded-full shadow-sm"
                    style={{ backgroundColor: orb.primaryColor }}
                  />
                  <div>
                    <span className="text-xs font-semibold text-white block leading-tight">{orb.name}</span>
                    <span className="text-[10px] text-[oklch(0.7_0.03_155)] font-mono tabular-nums">
                      {orb.memberCount} members · {orb.category}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
