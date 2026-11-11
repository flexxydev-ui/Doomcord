import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { OrbData } from '../../types';
import {
  Sparkles,
  Users,
  Activity,
  ArrowUpRight,
  RotateCcw,
  Compass,
  Plus,
  Search,
  LayoutGrid,
  Box,
} from 'lucide-react';

interface OrbsSpatialCanvasProps {
  orbs: OrbData[];
  selectedOrb: OrbData | null;
  initialMode?: 'grid' | '3d';
  onSelectOrb: (orb: OrbData) => void;
  onEnterOrbRoom: (orb: OrbData) => void;
  onCreateOrb: () => void;
}

export const OrbsSpatialCanvas: React.FC<OrbsSpatialCanvasProps> = ({
  orbs,
  selectedOrb,
  initialMode = 'grid',
  onSelectOrb,
  onEnterOrbRoom,
  onCreateOrb,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [displayMode, setDisplayMode] = useState<'grid' | '3d'>(initialMode);
  const [hoveredOrb, setHoveredOrb] = useState<OrbData | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setDisplayMode(initialMode);
  }, [initialMode]);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const orbMeshesRef = useRef<
    { mesh: THREE.Mesh; orb: OrbData; originalPos: THREE.Vector3 }[]
  >([]);
  const particlesRef = useRef<THREE.Points | null>(null);
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2(-999, -999));
  const targetCamPos = useRef<THREE.Vector3>(new THREE.Vector3(0, 5, 22));
  const currentCamPos = useRef<THREE.Vector3>(new THREE.Vector3(0, 5, 22));

  useEffect(() => {
    if (displayMode !== '3d') return;
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

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
    scene.fog = new THREE.FogExp2(0x101a17, 0.025);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(0, 5, 22);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: true,
    });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(
      isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2)
    );
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(
      new RoomEnvironment(),
      0.04
    ).texture;
    pmremGenerator.dispose();

    const ambientLight = new THREE.AmbientLight(0x192620, 1.3);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0x8be2b8, 2.0);
    keyLight.position.set(10, 15, 12);
    scene.add(keyLight);

    const fillLight = new THREE.HemisphereLight(0x8be2b8, 0x101a17, 1.0);
    scene.add(fillLight);

    // Subtle spatial particle grid
    const particleCount = 450;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 60;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 35;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 60;

      const isCoral = Math.random() > 0.75;
      colors[i * 3] = isCoral ? 0.91 : 0.54;
      colors[i * 3 + 1] = isCoral ? 0.6 : 0.88;
      colors[i * 3 + 2] = isCoral ? 0.48 : 0.72;
    }

    particleGeo.setAttribute(
      'position',
      new THREE.BufferAttribute(positions, 3)
    );
    particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.25,
      transparent: true,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);
    particlesRef.current = particles;

    const orbMeshes: {
      mesh: THREE.Mesh;
      orb: OrbData;
      originalPos: THREE.Vector3;
    }[] = [];
    const radius = 10;
    const orbCount = orbs.length;

    orbs.forEach((orb, idx) => {
      const angle = (idx / Math.max(1, orbCount)) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * (radius * 0.75);
      const y = Math.sin(idx * 1.5) * 1.8;

      const sphereGeo = new THREE.SphereGeometry(1.55, 32, 32);
      const sphereMat = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(orb.primaryColor || '#8BE2B8'),
        roughness: 0.18,
        metalness: 0.35,
        clearcoat: 0.85,
        emissive: new THREE.Color(orb.primaryColor || '#8BE2B8'),
        emissiveIntensity: 0.28,
      });

      const mesh = new THREE.Mesh(sphereGeo, sphereMat);
      mesh.position.set(x, y, z);
      mesh.userData = { orbId: orb.id, orb };

      const ringGeo = new THREE.RingGeometry(2.05, 2.22, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(orb.secondaryColor || '#8BE2B8'),
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.5,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2 + 0.3;
      mesh.add(ring);

      scene.add(mesh);
      orbMeshes.push({ mesh, orb, originalPos: new THREE.Vector3(x, y, z) });
    });

    orbMeshesRef.current = orbMeshes;
    const raycaster = new THREE.Raycaster();

    const handlePointerMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const handleClick = () => {
      if (!cameraRef.current) return;
      raycaster.setFromCamera(mouseRef.current, cameraRef.current);
      const intersects = raycaster.intersectObjects(orbMeshes.map((o) => o.mesh));
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

    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    let animId = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      if (particlesRef.current) {
        particlesRef.current.rotation.y = elapsedTime * 0.02;
      }

      currentCamPos.current.x = THREE.MathUtils.damp(
        currentCamPos.current.x,
        targetCamPos.current.x,
        3,
        0.016
      );
      currentCamPos.current.y = THREE.MathUtils.damp(
        currentCamPos.current.y,
        targetCamPos.current.y,
        3,
        0.016
      );
      currentCamPos.current.z = THREE.MathUtils.damp(
        currentCamPos.current.z,
        targetCamPos.current.z,
        3,
        0.016
      );
      camera.position.copy(currentCamPos.current);
      camera.lookAt(0, 0, 0);

      raycaster.setFromCamera(mouseRef.current, camera);
      const intersects = raycaster.intersectObjects(orbMeshes.map((o) => o.mesh));
      const hitMesh = intersects.length > 0 ? intersects[0].object : null;

      orbMeshes.forEach(({ mesh, orb, originalPos }, i) => {
        mesh.position.y = originalPos.y + Math.sin(elapsedTime * 1.4 + i) * 0.35;
        mesh.rotation.y += 0.007;

        const isHovered = hitMesh === mesh;
        const isSelected = selectedOrb?.id === orb.id;
        const targetScale = isSelected ? 1.25 : isHovered ? 1.12 : 1.0;
        mesh.scale.setScalar(
          THREE.MathUtils.damp(mesh.scale.x, targetScale, 6, 0.016)
        );
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
  }, [displayMode, orbs, onSelectOrb, selectedOrb]);

  const resetCamera = useCallback(() => {
    targetCamPos.current.set(0, 5, 22);
  }, []);

  const categories = [
    'All',
    'Gaming',
    'Coding',
    'Music',
    'Anime',
    'Science',
    'Study',
    'Art',
    'Tech',
    'Chill',
  ];

  const filteredOrbs = orbs.filter((orb) => {
    const matchesCat =
      filterCategory === 'All' ||
      orb.category.toLowerCase() === filterCategory.toLowerCase();
    if (!matchesCat) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      orb.name.toLowerCase().includes(q) ||
      orb.description.toLowerCase().includes(q) ||
      orb.tags?.some((t) => t.toLowerCase().includes(q))
    );
  });

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden bg-[#101A17] text-[#F0F5F1]">
      {/* Top Discovery Header */}
      <header className="relative z-20 h-16 px-8 border-b border-white/[0.06] bg-[#101A17] flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <Compass className="w-4 h-4 text-[#E9987B]" />
          <h1 className="font-display font-bold text-base text-[#F0F5F1]">
            Orbs Discovery
          </h1>
          <span className="text-xs font-mono text-[#718478] border-l border-white/15 pl-3 tabular-nums">
            {orbs.length} active spheres
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Search Input */}
          <div className="relative hidden md:block">
            <Search className="w-3.5 h-3.5 text-[#718478] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Orbs or #tags..."
              className="h-8 pl-8 pr-3 rounded-lg bg-[#141F1B] border border-white/[0.07] focus:border-[#8BE2B8]/50 text-xs text-[#F0F5F1] placeholder-[#718478] outline-none w-52"
            />
          </div>

          {/* View Mode Switcher: Discovery Grid vs 3D Spatial Viewport */}
          <div className="flex items-center gap-1 bg-[#141F1B] p-1 rounded-lg border border-white/[0.06]">
            <button
              onClick={() => setDisplayMode('grid')}
              className={`h-7 px-2.5 rounded text-xs font-medium flex items-center gap-1.5 transition-colors ${
                displayMode === 'grid'
                  ? 'bg-[#24362C] text-[#F0F5F1]'
                  : 'text-[#9BAEA2] hover:text-[#F0F5F1]'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5 text-[#8BE2B8]" />
              <span>Discovery Grid</span>
            </button>
            <button
              onClick={() => setDisplayMode('3d')}
              className={`h-7 px-2.5 rounded text-xs font-medium flex items-center gap-1.5 transition-colors ${
                displayMode === '3d'
                  ? 'bg-[#24362C] text-[#F0F5F1]'
                  : 'text-[#9BAEA2] hover:text-[#F0F5F1]'
              }`}
            >
              <Box className="w-3.5 h-3.5 text-[#E9987B]" />
              <span>3D Constellation</span>
            </button>
          </div>

          {displayMode === '3d' && (
            <button
              onClick={resetCamera}
              title="Reset 3D Camera"
              className="h-8 px-2.5 rounded-lg bg-[#192620] hover:bg-[#24362C] border border-white/[0.07] text-[#9BAEA2] hover:text-[#F0F5F1]"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={onCreateOrb}
            className="h-8 px-3.5 rounded-lg bg-[#8BE2B8] hover:bg-[#7AD4A8] text-[#101A17] text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Orb</span>
          </button>
        </div>
      </header>

      {/* Category Filter Strip */}
      <div className="px-8 py-3 bg-[#141F1B] border-b border-white/[0.05] flex items-center gap-1.5 overflow-x-auto shrink-0">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`h-7 px-3 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
              filterCategory === cat
                ? 'bg-[#24362C] text-[#8BE2B8]'
                : 'text-[#9BAEA2] hover:text-[#F0F5F1] hover:bg-[#192620]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Main Content Area: Structured Discovery Grid OR Interactive 3D Viewport */}
      {displayMode === 'grid' ? (
        <div className="flex-1 overflow-y-auto px-8 py-8">
          <div className="max-w-6xl mx-auto space-y-8">
            {filteredOrbs.length === 0 ? (
              <div className="p-12 rounded-xl bg-[#141F1B] border border-white/[0.06] text-center space-y-3">
                <Compass className="w-8 h-8 text-[#E9987B] mx-auto opacity-80" />
                <div>
                  <h2 className="text-base font-display font-bold text-[#F0F5F1]">
                    No Orbs Found
                  </h2>
                  <p className="text-xs text-[#9BAEA2] mt-1 max-w-md mx-auto">
                    Orbs are interactive interest spaces where members gather around shared topics, live discussions, and media.
                  </p>
                </div>
                <button
                  onClick={onCreateOrb}
                  className="h-9 px-4 rounded-lg bg-[#8BE2B8] text-[#101A17] text-xs font-semibold inline-flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create First Orb</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredOrbs.map((orb) => (
                  <div
                    key={orb.id}
                    className="rounded-xl bg-[#141F1B] hover:bg-[#192620] border border-white/[0.07] p-5 flex flex-col justify-between transition-colors"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center font-display font-bold text-xs text-[#101A17] shrink-0"
                            style={{
                              backgroundColor: orb.primaryColor || '#8BE2B8',
                            }}
                          >
                            {orb.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="text-sm font-display font-bold text-[#F0F5F1]">
                              {orb.name}
                            </h3>
                            <span className="text-[11px] font-mono uppercase text-[#8BE2B8]">
                              {orb.category} · {orb.visibility}
                            </span>
                          </div>
                        </div>
                      </div>

                      <p className="text-xs text-[#9BAEA2] leading-relaxed line-clamp-2 mb-4">
                        {orb.description}
                      </p>

                      {orb.tags && orb.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {orb.tags.slice(0, 4).map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 rounded bg-[#101A17] border border-white/[0.06] text-[10px] font-mono text-[#718478]"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="pt-3.5 border-t border-white/[0.06] flex items-center justify-between">
                      <div className="flex items-center gap-3 text-[11px] font-mono text-[#9BAEA2] tabular-nums">
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-[#8BE2B8]" />
                          {orb.memberCount || 1}
                        </span>
                        <span className="flex items-center gap-1">
                          <Activity className="w-3.5 h-3.5 text-[#E9987B]" />
                          {orb.activityScore || 100}%
                        </span>
                      </div>

                      <button
                        onClick={() => onEnterOrbRoom(orb)}
                        className="h-8 px-3 rounded-lg bg-[#1D2B24] hover:bg-[#24362C] border border-white/[0.08] text-xs font-semibold text-[#8BE2B8] flex items-center gap-1.5 transition-colors"
                      >
                        <span>Enter Orb</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Interactive 3D Spatial Viewport */
        <div className="relative flex-1 w-full h-full">
          <div
            ref={mountRef}
            className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
          />

          {orbs.length === 0 && (
            <div className="absolute inset-0 z-10 flex items-center justify-center p-6 pointer-events-none">
              <div className="max-w-md p-6 rounded-xl bg-[#141F1B]/95 border border-white/10 shadow-2xl text-center pointer-events-auto">
                <Sparkles className="w-6 h-6 text-[#8BE2B8] mx-auto mb-2.5" />
                <h2 className="text-base font-display font-bold text-[#F0F5F1] mb-1">
                  No Orbs in the 3D Constellation Yet
                </h2>
                <p className="text-xs text-[#9BAEA2] mb-4">
                  Create the first Orb to populate the real-time 3D spatial constellation.
                </p>
                <button
                  onClick={onCreateOrb}
                  className="h-9 px-4 rounded-lg bg-[#8BE2B8] text-[#101A17] text-xs font-semibold inline-flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create First Orb</span>
                </button>
              </div>
            </div>
          )}

          {hoveredOrb && (
            <div className="absolute top-6 left-6 z-20 max-w-sm p-4 rounded-xl bg-[#141F1B]/95 border border-white/10 shadow-xl pointer-events-none">
              <div className="flex items-center gap-2.5 mb-1.5">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: hoveredOrb.primaryColor }}
                />
                <span className="text-sm font-display font-bold text-[#F0F5F1]">
                  {hoveredOrb.name}
                </span>
                <span className="text-xs font-mono text-[#8BE2B8]">
                  · {hoveredOrb.category}
                </span>
              </div>
              <p className="text-xs text-[#9BAEA2] line-clamp-2">
                {hoveredOrb.description}
              </p>
            </div>
          )}

          {selectedOrb && (
            <div className="absolute bottom-8 right-8 z-20 w-80 p-5 rounded-xl bg-[#141F1B]/95 border border-white/10 shadow-2xl">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <span className="text-[11px] font-mono uppercase text-[#8BE2B8]">
                    {selectedOrb.category} Sphere
                  </span>
                  <h3 className="text-base font-display font-bold text-[#F0F5F1]">
                    {selectedOrb.name}
                  </h3>
                </div>
                <span
                  className="w-5 h-5 rounded-full"
                  style={{ backgroundColor: selectedOrb.primaryColor }}
                />
              </div>

              <p className="text-xs text-[#9BAEA2] leading-relaxed mb-4">
                {selectedOrb.description}
              </p>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onEnterOrbRoom(selectedOrb)}
                  className="flex-1 h-9 px-4 rounded-lg bg-[#8BE2B8] text-[#101A17] text-xs font-semibold flex items-center justify-center gap-1.5"
                >
                  <span>Enter Orb Lounge</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onSelectOrb(null as any)}
                  className="h-9 px-3 rounded-lg bg-[#192620] text-xs text-[#9BAEA2] hover:text-[#F0F5F1] border border-white/10"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
