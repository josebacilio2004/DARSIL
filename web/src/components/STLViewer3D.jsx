import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export default function STLViewer3D({ stlUrl, renderMode = 'solido', isAutoRotating = true, onAngleChange }) {
  const mountRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const sceneRef = useRef(null);
  const meshRef = useRef(null);
  const controlsRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);

  // Inicializar escena, cámara, renderizador y luces
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 400;
    const height = container.clientHeight || 300;

    // Escena 3D
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Cámara Perspectiva
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 2000);
    camera.position.set(60, 45, 80);
    cameraRef.current = camera;

    // Renderizador WebGL con transparencia
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    rendererRef.current = renderer;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Controles Orbitales (Mouse & Pantallas Táctiles)
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.autoRotate = isAutoRotating;
    controls.autoRotateSpeed = 2.4;
    controls.maxDistance = 500;
    controls.minDistance = 10;
    controlsRef.current = controls;

    // Iluminación Profesional Tipo Estudio de Ingeniería
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xf59e0b, 2.5); // Rim Light Ámbar
    dirLight1.position.set(80, 100, 60);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x38bdf8, 1.8); // Fill Light Celeste
    dirLight2.position.set(-80, -40, -60);
    scene.add(dirLight2);

    const dirLight3 = new THREE.DirectionalLight(0xffffff, 1.2); // Key Light Superior
    dirLight3.position.set(0, 120, 0);
    scene.add(dirLight3);

    // Bucle de Animación
    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (controlsRef.current) {
        controlsRef.current.update();
        if (onAngleChange && cameraRef.current) {
          const angleDeg = Math.round((camera.position.x + 360) % 360);
          onAngleChange(angleDeg);
        }
      }
      renderer.render(scene, camera);
    };
    animate();

    // Observador de Redimensionamiento Responsivo
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        if (w > 0 && h > 0) {
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
        }
      }
    });
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      controls.dispose();
      renderer.dispose();
      if (meshRef.current) {
        meshRef.current.geometry.dispose();
        if (Array.isArray(meshRef.current.material)) {
          meshRef.current.material.forEach((m) => m.dispose());
        } else {
          meshRef.current.material.dispose();
        }
      }
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Actualizar velocidad o estado de auto-rotación
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = isAutoRotating;
    }
  }, [isAutoRotating]);

  // Cargar el archivo .STL cuando cambia stlUrl
  useEffect(() => {
    if (!sceneRef.current || !stlUrl) return;

    setLoading(true);
    setError(null);

    // Remover malla previa si existía
    if (meshRef.current) {
      sceneRef.current.remove(meshRef.current);
      meshRef.current.geometry.dispose();
      if (meshRef.current.material) meshRef.current.material.dispose();
      meshRef.current = null;
    }

    const loader = new STLLoader();
    loader.load(
      stlUrl,
      (geometry) => {
        geometry.computeVertexNormals();
        geometry.center();

        const isCad = renderMode === 'cad';
        const material = new THREE.MeshStandardMaterial({
          color: isCad ? 0x06b6d4 : 0x27272a,
          roughness: isCad ? 0.9 : 0.35,
          metalness: isCad ? 0.1 : 0.6,
          wireframe: isCad
        });

        const mesh = new THREE.Mesh(geometry, material);
        meshRef.current = mesh;
        sceneRef.current.add(mesh);

        // Encuadrar la cámara automáticamente según el tamaño del objeto STL
        geometry.computeBoundingSphere();
        const sphere = geometry.boundingSphere;
        const radius = sphere ? sphere.radius : 40;
        const targetDistance = Math.max(radius * 2.6, 25);

        if (cameraRef.current && controlsRef.current) {
          cameraRef.current.position.set(targetDistance * 0.75, targetDistance * 0.55, targetDistance * 0.95);
          cameraRef.current.lookAt(0, 0, 0);
          controlsRef.current.target.set(0, 0, 0);
          controlsRef.current.update();
        }

        setLoading(false);
      },
      undefined,
      (err) => {
        console.error('Error cargando archivo STL:', stlUrl, err);
        setError('No se pudo cargar la geometría 3D STL.');
        setLoading(false);
      }
    );
  }, [stlUrl]);

  // Actualizar Modo de Renderizado (Sólido / Malla CAD) sin recargar la geometría
  useEffect(() => {
    if (!meshRef.current) return;
    const isCad = renderMode === 'cad';
    meshRef.current.material.wireframe = isCad;
    meshRef.current.material.color.set(isCad ? 0x06b6d4 : 0x27272a);
    meshRef.current.material.roughness = isCad ? 0.9 : 0.35;
    meshRef.current.material.metalness = isCad ? 0.1 : 0.6;
    meshRef.current.material.needsUpdate = true;
  }, [renderMode]);

  return (
    <div className="relative w-full h-full min-h-[320px] flex items-center justify-center">
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm z-20 space-y-3 pointer-events-none">
          <div className="w-9 h-9 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-mono font-bold text-amber-300 tracking-wider uppercase">
            Cargando Modelo STL 3D Real...
          </span>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-rose-400 text-xs font-mono z-20 bg-black/60 p-4 text-center">
          <span className="font-bold mb-1">Aviso Técnico</span>
          <span>{error}</span>
        </div>
      )}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
    </div>
  );
}
