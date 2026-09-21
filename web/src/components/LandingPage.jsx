import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  FileText, 
  CheckCircle2, 
  Clock, 
  Wrench, 
  Cpu, 
  Printer, 
  Truck, 
  Phone, 
  ExternalLink, 
  Shield, 
  Zap, 
  Download,
  Car,
  ChevronRight,
  ArrowRight,
  Activity,
  Layers,
  Award,
  Sparkles,
  Gauge,
  Check,
  Settings,
  Flame,
  ShieldCheck,
  Send,
  Radio,
  Boxes,
  Mouse,
  Headphones,
  X,
  Info,
  Target,
  Compass,
  BookOpen,
  Menu,
  RotateCw,
  Box,
  Eye,
  Play,
  Pause
} from 'lucide-react';
import { api } from '../services/api';
import STLViewer3D from './STLViewer3D';

export default function LandingPage({ quotes = [], authUser, onSwitchToAdmin }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [foundQuote, setFoundQuote] = useState(null);
  const [searchError, setSearchError] = useState('');

  // Estado de Navegación Activa, Scroll y Menú Móvil
  const [activeNav, setActiveNav] = useState('inicio');
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Efecto de Cursor Neón Ámbar en Tiempo Real
  const [cursorPos, setCursorPos] = useState({ x: -1000, y: -1000 });
  useEffect(() => {
    const handleMouseMove = (e) => setCursorPos({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Modal Interactivo de Ficha Técnica Vehicular
  const [selectedVehicleModal, setSelectedVehicleModal] = useState(null);

  // Modal Legal Corporativo (Términos, Privacidad, Garantía, Libro de Reclamaciones)
  const [legalModal, setLegalModal] = useState(null);

  // Formulario interactivo para Libro de Reclamaciones
  const [claimForm, setClaimForm] = useState({
    name: '',
    docType: 'DNI',
    docNum: '',
    phone: '',
    email: '',
    plateOrQuote: '',
    type: 'RECLAMO',
    description: '',
    solution: ''
  });
  const [claimSubmitted, setClaimSubmitted] = useState(false);

  // =========================================================================
  // VISOR DE PIEZAS EN IMPRESIÓN 3D INDUSTRIAL CON ROTACIÓN 360°
  // =========================================================================
  const [selected3DPart, setSelected3DPart] = useState('golf_vw');
  const [rotAngle, setRotAngle] = useState(35);
  const [isAutoRotating, setIsAutoRotating] = useState(true);
  const [renderMode, setRenderMode] = useState('solido'); // 'solido' | 'cad'
  const isDragging3D = useRef(false);
  const dragStartX = useRef(0);
  const dragStartAngle = useRef(0);

  // Loop de auto-rotación fluida a 60fps
  useEffect(() => {
    if (!isAutoRotating) return;
    let animId;
    const animate = () => {
      setRotAngle((prev) => (prev + 0.5) % 360);
      animId = requestAnimationFrame(animate);
    };
    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [isAutoRotating]);

  const industrial3DParts = {
    golf_vw: {
      id: 'golf_vw',
      name: 'Fijador / Clip de Parrilla VW Golf Mk2',
      code: 'PART-3D-VW-GOLF-CLIP',
      file: './golf_VW.stl',
      fileName: 'golf_VW.stl',
      app: 'Volkswagen Golf Mk2 (Parrilla Frontal Doble Faro)',
      category: 'Automotriz & Clásicos',
      material: 'PETG / Polímero Técnico Elástico de Alta Durabilidad',
      tensile: '75 MPa (Flexibilidad elástica para clip de enganche)',
      temp: 'Hasta 110°C en vano de parrilla frontal',
      tolerance: '±0.05 mm (Encaje exacto a presión en marco portafaros)',
      standard: 'ASTM F2792 / ISO 52900 (Manufactura Aditiva)',
      note: 'Colocado de manera referencial por el momento.',
      desc: 'Clip de fijación de parrilla frontal para VW Golf Mk2 con parrilla de doble faro. Componente de sujeción que asegura firmemente la parrilla frontal del vehículo al panel portafaros y estructura de la carrocería, restaurando la fijación original sin holguras ni vibraciones.'
    },
    subaru_delete: {
      id: 'subaru_delete',
      name: 'Placa Embellecedora Frontal (Delete Plate) Subaru',
      code: 'PART-3D-SUB-FPD',
      file: './front-plate-delete_subaru.stl',
      fileName: 'front-plate-delete_subaru.stl',
      app: 'Subaru (WRX, STI, BRZ, Forester, Impreza)',
      category: 'Aerodinámica & Tuning',
      material: 'PETG de Grado Exterior con Protección Anti-UV',
      tensile: '80 MPa (Resistencia a impactos de gravilla en carretera)',
      temp: 'Resistencia térmica de -20°C a 90°C sin deformación',
      tolerance: '±0.05 mm (Ranuras con insertos para tuercas M4/M5)',
      standard: 'ASTM F2792 / ISO 52900 (Manufactura Aditiva)',
      note: 'Verifique la normativa de tránsito local respecto al uso de placa delantera antes de instalar este componente.',
      desc: 'Placa de reemplazo / embellecedor para la eliminación de la placa de matrícula delantera (Front Plate Delete). El modelo está diseñado modularmente para imprimirse en 4 secciones unidas mediante pernos utilizando las ranuras posteriores provistas de insertos para tuercas (o en 2 secciones para impresoras de mayor formato). Las dos piezas mayores se articulan mediante una bisagra para adaptarse con máxima precisión al ángulo y curvatura del parachoques. Fabricado y testeado en PETG durante más de 4 años de servicio continuo en vehículo sin presentar degradación. Archivos STEP y SCAD disponibles para ajustes personalizados.'
    },
    camaro_conn: {
      id: 'camaro_conn',
      name: 'Conector de Ramal Eléctrico Chevrolet Camaro Berlinetta',
      code: 'PART-3D-CAMARO-CONN',
      file: './connector_CamaroBerlinetta.stl',
      fileName: 'connector_CamaroBerlinetta.stl',
      app: 'Chevrolet Camaro Berlinetta Clásico (Ramal Eléctrico)',
      category: 'Restauración Clásica',
      material: 'Polímero Ignífugo Reforzado UL94-V0',
      tensile: '85 MPa con pines de aleación de cobre estañado',
      temp: 'Resistente a calor bajo capó (-40°C a 140°C)',
      tolerance: '±0.03 mm de encaje en terminales originales',
      standard: 'UNECE R10 / ISO 14229',
      note: 'Componente de ingeniería inversa para restauración sin alterar arnés original.',
      desc: 'Conector de reemplazo para arnés eléctrico de Chevrolet Camaro Berlinetta. Diseñado por ingeniería inversa para sustituir conectores originales descontinuados sin necesidad de cortar o empalmar cables del ramal original del vehículo. Garantiza acoplamiento hermético, resistencia a vibración y contacto eléctrico seguro.'
    },
    engranaje: {
      id: 'engranaje',
      name: 'Engranaje Helicoidal de Alta Carga',
      code: 'PART-3D-ENG-24V',
      file: '',
      fileName: '',
      app: 'Mixers, Trompos Hormigoneros y Reductores Industriales',
      category: 'Flotas Pesadas',
      material: 'Onyx™ (Nylon PA12 + Microfibra de Carbono Continua)',
      tensile: '140 MPa (Superior al Aluminio 6061-T6)',
      temp: 'Hasta 180°C - 210°C bajo carga continua',
      tolerance: '±0.05 mm (ISO 2768-mK)',
      standard: 'ASTM F2792 / ISO 52900 (Manufactura Aditiva Industrial)',
      note: 'Fabricación bajo demanda según muestra u orden CAD.',
      desc: 'Reemplazo de alta resistencia mecánica para engranajes descontinuados de maquinaria pesada. Fabricado mediante impresión aditiva con filamento continuo de fibra de carbono para soportar torque extremo.'
    },
    conector: {
      id: 'conector',
      name: 'Conector Blindado de Ramal ECU 24V',
      code: 'PART-3D-CONN-ECU',
      file: '',
      fileName: '',
      app: 'Tractocamiones Volvo FH, Scania, Shacman, Sinotruk',
      category: 'Flotas Pesadas',
      material: 'Polímero Ignífugo Reforzado UL94-V0',
      tensile: '85 MPa con sellado hermético IP68',
      temp: 'Resistente a aceites, combustible diésel y calor (-40°C a 160°C)',
      tolerance: '±0.03 mm de encaje en pines',
      standard: 'UNECE R10 / ISO 14229',
      note: 'Evita reemplazo del ramal completo importado.',
      desc: 'Conector estanco de 36 pines para arnés de computadora de motor diésel pesado. Evita el reemplazo completo del ramal eléctrico original importado, reduciendo costos en más del 70%.'
    },
    brida: {
      id: 'brida',
      name: 'Soporte y Brida Sensor NOx / Escape',
      code: 'PART-3D-NOX-BRD',
      file: '',
      fileName: '',
      app: 'Sistemas SCR / Urea AdBlue de Transporte Pesado',
      category: 'Flotas Pesadas',
      material: 'Composite Alta Temperatura PEEK / Fibra de Carbono',
      tensile: '110 MPa bajo vibración continua',
      temp: 'Resistencia térmica certificada hasta 240°C',
      tolerance: '±0.05 mm fijación directa a chasis',
      standard: 'SAE J1939 / NFPA 1901',
      note: 'Disipación térmica y corrección por fatiga.',
      desc: 'Brida con disipación térmica para sensores de emisión NOx. Diseñada por ingeniería inversa para corregir roturas por fatiga y vibración de ruta en transporte interprovincial y minero.'
    }
  };

  // Controladores de Arrastre 360° con Mouse y Pantallas Táctiles
  const handle3DMouseDown = (e) => {
    isDragging3D.current = true;
    dragStartX.current = e.clientX;
    dragStartAngle.current = rotAngle;
    setIsAutoRotating(false);
  };

  const handle3DMouseMove = (e) => {
    if (!isDragging3D.current) return;
    const deltaX = e.clientX - dragStartX.current;
    const newAngle = (dragStartAngle.current + deltaX * 0.75) % 360;
    setRotAngle(newAngle < 0 ? newAngle + 360 : newAngle);
  };

  const handle3DMouseUp = () => {
    isDragging3D.current = false;
  };

  const handle3DTouchStart = (e) => {
    if (e.touches.length === 1) {
      isDragging3D.current = true;
      dragStartX.current = e.touches[0].clientX;
      dragStartAngle.current = rotAngle;
      setIsAutoRotating(false);
    }
  };

  const handle3DTouchMove = (e) => {
    if (!isDragging3D.current || e.touches.length !== 1) return;
    const deltaX = e.touches[0].clientX - dragStartX.current;
    const newAngle = (dragStartAngle.current + deltaX * 0.75) % 360;
    setRotAngle(newAngle < 0 ? newAngle + 360 : newAngle);
  };

  const handle3DTouchEnd = () => {
    isDragging3D.current = false;
  };

  // Renderizador Geométrico Vectorial 3D según ángulo de rotación
  const render3DModel = (partId, angle, mode) => {
    const rad = (angle * Math.PI) / 180;
    const isCad = mode === 'cad';
    const strokeColor = isCad ? '#06b6d4' : '#f59e0b';
    const fillTop = isCad ? 'rgba(6, 182, 212, 0.12)' : 'url(#solidGradTop)';

    if (partId === 'golf_vw') {
      const cx = 200, cy = 135;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      const w = 110, h = 45, d = 80;

      const x1 = cx - (w / 2) * cos + (d / 2) * sin * 0.45;
      const y1 = cy - (w / 2) * sin * 0.3 - (d / 2) * cos * 0.28;
      const x2 = cx + (w / 2) * cos + (d / 2) * sin * 0.45;
      const y2 = cy + (w / 2) * sin * 0.3 - (d / 2) * cos * 0.28;
      const x3 = cx + (w / 2) * cos - (d / 2) * sin * 0.45;
      const y3 = cy + (w / 2) * sin * 0.3 + (d / 2) * cos * 0.28;
      const x4 = cx - (w / 2) * cos - (d / 2) * sin * 0.45;
      const y4 = cy - (w / 2) * sin * 0.3 + (d / 2) * cos * 0.28;

      const arm1X = cx - (w * 0.38) * cos;
      const arm1Y = cy - (w * 0.38) * sin * 0.3 - 28;
      const arm2X = cx + (w * 0.38) * cos;
      const arm2Y = cy + (w * 0.38) * sin * 0.3 - 28;

      return (
        <svg viewBox="0 0 400 300" className="w-full h-full max-w-[420px] max-h-[300px]">
          <defs>
            <linearGradient id="clipGradFront" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3f3f46" />
              <stop offset="100%" stopColor="#18181b" />
            </linearGradient>
            <linearGradient id="clipGradTop" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#52525b" />
              <stop offset="50%" stopColor="#27272a" />
              <stop offset="100%" stopColor="#09090b" />
            </linearGradient>
          </defs>

          <ellipse cx={cx} cy={cy + h + 22} rx={60 + 20 * Math.abs(cos)} ry={14} fill="rgba(245, 158, 11, 0.08)" filter="blur(6px)" />

          <polygon
            points={`${x4.toFixed(1)},${y4.toFixed(1)} ${x3.toFixed(1)},${y3.toFixed(1)} ${x3.toFixed(1)},${(y3 + h).toFixed(1)} ${x4.toFixed(1)},${(y4 + h).toFixed(1)}`}
            fill={isCad ? 'rgba(6, 182, 212, 0.08)' : 'url(#clipGradFront)'}
            stroke={strokeColor}
            strokeWidth={isCad ? 1 : 1.3}
          />
          <polygon
            points={`${x3.toFixed(1)},${y3.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)} ${x2.toFixed(1)},${(y2 + h).toFixed(1)} ${x3.toFixed(1)},${(y3 + h).toFixed(1)}`}
            fill={isCad ? 'rgba(6, 182, 212, 0.05)' : '#18181b'}
            stroke={strokeColor}
            strokeWidth={isCad ? 1 : 1.3}
          />
          <polygon
            points={`${x1.toFixed(1)},${y1.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)} ${x3.toFixed(1)},${y3.toFixed(1)} ${x4.toFixed(1)},${y4.toFixed(1)}`}
            fill={isCad ? 'rgba(6, 182, 212, 0.12)' : 'url(#clipGradTop)'}
            stroke={strokeColor}
            strokeWidth={isCad ? 1.2 : 1.5}
          />

          <path
            d={`M ${(cx - (w * 0.4) * cos).toFixed(1)} ${(cy - (w * 0.4) * sin * 0.3).toFixed(1)} L ${arm1X.toFixed(1)} ${arm1Y.toFixed(1)} L ${(arm1X + 16 * cos).toFixed(1)} ${(arm1Y + 6).toFixed(1)} L ${(cx - (w * 0.22) * cos).toFixed(1)} ${(cy - (w * 0.22) * sin * 0.3).toFixed(1)} Z`}
            fill={isCad ? 'rgba(6, 182, 212, 0.15)' : '#27272a'}
            stroke={strokeColor}
            strokeWidth={isCad ? 1 : 1.4}
          />
          <path
            d={`M ${(cx + (w * 0.22) * cos).toFixed(1)} ${(cy + (w * 0.22) * sin * 0.3).toFixed(1)} L ${(arm2X - 16 * cos).toFixed(1)} ${(arm2Y + 6).toFixed(1)} L ${arm2X.toFixed(1)} ${arm2Y.toFixed(1)} L ${(cx + (w * 0.4) * cos).toFixed(1)} ${(cy + (w * 0.4) * sin * 0.3).toFixed(1)} Z`}
            fill={isCad ? 'rgba(6, 182, 212, 0.15)' : '#27272a'}
            stroke={strokeColor}
            strokeWidth={isCad ? 1 : 1.4}
          />

          <rect
            x={cx - 16}
            y={cy + 8}
            width="32"
            height="18"
            rx="3"
            fill={isCad ? 'none' : '#09090b'}
            stroke={isCad ? '#06b6d4' : '#f59e0b'}
            strokeWidth={1}
          />
          <line
            x1={cx - 12}
            y1={cy + 17}
            x2={cx + 12}
            y2={cy + 17}
            stroke={isCad ? '#22d3ee' : '#fbbf24'}
            strokeWidth="1.5"
            strokeDasharray={isCad ? '2,2' : undefined}
          />

          {isCad && (
            <g fontSize="9" fill="#06b6d4" fontFamily="monospace">
              <text x={cx + 55} y={cy - 20}>VW GOLF MK2 • DUAL HEADLIGHT</text>
              <text x={cx - 140} y={cy + h + 24}>CLIP ENCAJE SNAP-FIT</text>
              <text x={cx - 50} y={cy + h + 40}>TOLERANCIA ±0.05 mm</text>
            </g>
          )}
        </svg>
      );
    }

    if (partId === 'subaru_delete') {
      const cx = 200, cy = 135;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      const w = 180, h = 38, d = 45;

      const x1 = cx - (w / 2) * cos + (d / 2) * sin * 0.35;
      const y1 = cy - (w / 2) * sin * 0.2 - (d / 2) * cos * 0.2;
      const x2 = cx + (w / 2) * cos + (d / 2) * sin * 0.35;
      const y2 = cy + (w / 2) * sin * 0.2 - (d / 2) * cos * 0.2;
      const x3 = cx + (w / 2) * cos - (d / 2) * sin * 0.35;
      const y3 = cy + (w / 2) * sin * 0.2 + (d / 2) * cos * 0.2;
      const x4 = cx - (w / 2) * cos - (d / 2) * sin * 0.35;
      const y4 = cy - (w / 2) * sin * 0.2 + (d / 2) * cos * 0.2;

      const midTopX = cx;
      const midTopY = cy;
      const midBotX = cx;
      const midBotY = cy + h;

      return (
        <svg viewBox="0 0 400 300" className="w-full h-full max-w-[420px] max-h-[300px]">
          <defs>
            <linearGradient id="subaruPlateGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#18181b" />
              <stop offset="50%" stopColor="#27272a" />
              <stop offset="100%" stopColor="#09090b" />
            </linearGradient>
            <linearGradient id="subaruTopGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3f3f46" />
              <stop offset="100%" stopColor="#27272a" />
            </linearGradient>
          </defs>

          <ellipse cx={cx} cy={cy + h + 24} rx={80 + 30 * Math.abs(cos)} ry={12} fill="rgba(245, 158, 11, 0.08)" filter="blur(8px)" />

          <polygon
            points={`${x4.toFixed(1)},${y4.toFixed(1)} ${x3.toFixed(1)},${y3.toFixed(1)} ${x3.toFixed(1)},${(y3 + h).toFixed(1)} ${x4.toFixed(1)},${(y4 + h).toFixed(1)}`}
            fill={isCad ? 'rgba(6, 182, 212, 0.08)' : 'url(#subaruPlateGrad)'}
            stroke={strokeColor}
            strokeWidth={isCad ? 1 : 1.4}
          />
          <polygon
            points={`${x3.toFixed(1)},${y3.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)} ${x2.toFixed(1)},${(y2 + h).toFixed(1)} ${x3.toFixed(1)},${(y3 + h).toFixed(1)}`}
            fill={isCad ? 'rgba(6, 182, 212, 0.05)' : '#18181b'}
            stroke={strokeColor}
            strokeWidth={isCad ? 1 : 1.2}
          />
          <polygon
            points={`${x1.toFixed(1)},${y1.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)} ${x3.toFixed(1)},${y3.toFixed(1)} ${x4.toFixed(1)},${y4.toFixed(1)}`}
            fill={isCad ? 'rgba(6, 182, 212, 0.12)' : 'url(#subaruTopGrad)'}
            stroke={strokeColor}
            strokeWidth={isCad ? 1.2 : 1.5}
          />

          <line
            x1={midTopX}
            y1={midTopY}
            x2={midBotX}
            y2={midBotY}
            stroke={isCad ? '#06b6d4' : '#f59e0b'}
            strokeWidth={isCad ? 1.5 : 2}
            strokeDasharray={isCad ? '3,2' : undefined}
          />
          <circle cx={midTopX} cy={midTopY + 10} r="3" fill={isCad ? '#06b6d4' : '#fbbf24'} />
          <circle cx={midTopX} cy={midTopY + h - 10} r="3" fill={isCad ? '#06b6d4' : '#fbbf24'} />

          {[-0.65, 0.65].map((factor, idx) => {
            const hx = cx + (w * 0.35 * factor) * cos;
            const hy = cy + (h / 2) + (w * 0.35 * factor) * sin * 0.2;
            return (
              <g key={idx}>
                <ellipse
                  cx={hx}
                  cy={hy}
                  rx={isCad ? 6 : 7}
                  ry={isCad ? 6 : 7}
                  fill={isCad ? 'none' : '#09090b'}
                  stroke={isCad ? '#06b6d4' : '#f59e0b'}
                  strokeWidth="1.2"
                />
                <circle cx={hx} cy={hy} r="2.5" fill={isCad ? '#22d3ee' : '#3f3f46'} />
              </g>
            );
          })}

          <line
            x1={cx - 45 * cos}
            y1={cy + (h / 2) - 45 * sin * 0.2}
            x2={cx - 15 * cos}
            y2={cy + (h / 2) - 15 * sin * 0.2}
            stroke={isCad ? '#06b6d4' : '#52525b'}
            strokeWidth="1.5"
          />
          <line
            x1={cx + 15 * cos}
            y1={cy + (h / 2) + 15 * sin * 0.2}
            x2={cx + 45 * cos}
            y2={cy + (h / 2) + 45 * sin * 0.2}
            stroke={isCad ? '#06b6d4' : '#52525b'}
            strokeWidth="1.5"
          />

          {isCad && (
            <g fontSize="9" fill="#06b6d4" fontFamily="monospace">
              <text x={cx + 50} y={cy - 20}>SUBARU FRONT PLATE DELETE</text>
              <text x={cx - 150} y={cy + h + 24}>SISTEMA MODULAR CON BISAGRA</text>
              <text x={cx - 60} y={cy + h + 40}>INSERTOS TUERCA TRASERA M4/M5</text>
            </g>
          )}
        </svg>
      );
    }

    if (partId === 'camaro_conn') {
      const cx = 200, cy = 135;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      const w = 115, h = 65, d = 75;

      const x1 = cx - (w / 2) * cos + (d / 2) * sin * 0.4;
      const y1 = cy - (w / 2) * sin * 0.3 - (d / 2) * cos * 0.25;
      const x2 = cx + (w / 2) * cos + (d / 2) * sin * 0.4;
      const y2 = cy + (w / 2) * sin * 0.3 - (d / 2) * cos * 0.25;
      const x3 = cx + (w / 2) * cos - (d / 2) * sin * 0.4;
      const y3 = cy + (w / 2) * sin * 0.3 + (d / 2) * cos * 0.25;
      const x4 = cx - (w / 2) * cos - (d / 2) * sin * 0.4;
      const y4 = cy - (w / 2) * sin * 0.3 + (d / 2) * cos * 0.25;

      return (
        <svg viewBox="0 0 400 300" className="w-full h-full max-w-[420px] max-h-[300px]">
          <defs>
            <linearGradient id="camaroGradFront" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3f3f46" />
              <stop offset="100%" stopColor="#18181b" />
            </linearGradient>
            <linearGradient id="camaroGradSide" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#27272a" />
              <stop offset="100%" stopColor="#09090b" />
            </linearGradient>
          </defs>

          <ellipse cx={cx} cy={cy + h + 20} rx={65 + 15 * Math.abs(cos)} ry={12} fill="rgba(245, 158, 11, 0.08)" filter="blur(6px)" />

          <polygon
            points={`${x4.toFixed(1)},${y4.toFixed(1)} ${x3.toFixed(1)},${y3.toFixed(1)} ${x3.toFixed(1)},${(y3 + h).toFixed(1)} ${x4.toFixed(1)},${(y4 + h).toFixed(1)}`}
            fill={isCad ? 'rgba(6, 182, 212, 0.08)' : 'url(#camaroGradFront)'}
            stroke={strokeColor}
            strokeWidth={isCad ? 1 : 1.3}
          />
          <polygon
            points={`${x3.toFixed(1)},${y3.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)} ${x2.toFixed(1)},${(y2 + h).toFixed(1)} ${x3.toFixed(1)},${(y3 + h).toFixed(1)}`}
            fill={isCad ? 'rgba(6, 182, 212, 0.05)' : 'url(#camaroGradSide)'}
            stroke={strokeColor}
            strokeWidth={isCad ? 1 : 1.3}
          />
          <polygon
            points={`${x1.toFixed(1)},${y1.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)} ${x3.toFixed(1)},${y3.toFixed(1)} ${x4.toFixed(1)},${y4.toFixed(1)}`}
            fill={isCad ? 'rgba(6, 182, 212, 0.12)' : '#09090b'}
            stroke={strokeColor}
            strokeWidth={isCad ? 1.2 : 1.5}
          />

          <rect
            x={cx - 18}
            y={cy - 18}
            width="36"
            height="14"
            rx="3"
            fill={isCad ? 'none' : '#27272a'}
            stroke={isCad ? '#06b6d4' : '#fbbf24'}
            strokeWidth={isCad ? 1 : 1.5}
          />

          {Array.from({ length: 4 }).map((_, r) =>
            Array.from({ length: 2 }).map((_, c) => {
              const u = -0.3 + r * 0.2;
              const v = -0.2 + c * 0.4;
              const px = cx + (w * u) * cos + (d * v) * sin * 0.4;
              const py = cy + (w * u) * sin * 0.3 + (d * v) * cos * 0.25;
              return (
                <g key={`${r}-${c}`}>
                  <rect
                    x={px - 3}
                    y={py - 3}
                    width="6"
                    height="6"
                    fill={isCad ? '#06b6d4' : '#f59e0b'}
                    stroke={isCad ? '#22d3ee' : '#d97706'}
                    strokeWidth="0.5"
                  />
                  {!isCad && <circle cx={px} cy={py} r="1" fill="#ffffff" />}
                </g>
              );
            })
          )}

          <rect
            x={cx - 14}
            y={cy + h - 8}
            width="28"
            height="14"
            rx="2"
            fill={isCad ? 'none' : '#27272a'}
            stroke={strokeColor}
            strokeWidth={1}
          />

          {isCad && (
            <g fontSize="9" fill="#06b6d4" fontFamily="monospace">
              <text x={cx + 60} y={cy - 20}>CHEVROLET CAMARO BERLINETTA</text>
              <text x={cx - 140} y={cy + h + 22}>CONECTOR ARNES ORIGINAL 8-WAY</text>
              <text x={cx - 50} y={cy + h + 38}>POLÍMERO IGNÍFUGO UL94-V0</text>
            </g>
          )}
        </svg>
      );
    }

    if (partId === 'engranaje') {
      const teeth = 14;
      const cx = 200, cy = 135;
      const rx = 96, ry = 40;
      const depth = 48;

      const pointsTop = [];
      const pointsBottom = [];
      for (let i = 0; i < teeth * 2; i++) {
        const theta = (i * Math.PI) / teeth + rad;
        const isTip = i % 2 === 0;
        const rFactor = isTip ? 1.22 : 0.95;
        const x = cx + rx * rFactor * Math.cos(theta);
        const y = cy + ry * rFactor * Math.sin(theta);
        pointsTop.push({ x, y, theta });
        pointsBottom.push({ x, y: y + depth, theta });
      }

      const topPathD = pointsTop.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ') + ' Z';

      return (
        <svg viewBox="0 0 400 300" className="w-full h-full max-w-[420px] max-h-[300px]">
          <defs>
            <linearGradient id="solidGradTop" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#3f3f46" />
              <stop offset="50%" stopColor="#27272a" />
              <stop offset="100%" stopColor="#18181b" />
            </linearGradient>
            <radialGradient id="gearHubGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#52525b" />
              <stop offset="70%" stopColor="#27272a" />
              <stop offset="100%" stopColor="#09090b" />
            </radialGradient>
          </defs>

          {isCad && (
            <g opacity="0.3" stroke="#06b6d4" strokeWidth="0.5" strokeDasharray="3,3">
              <circle cx={cx} cy={cy} r={rx * 1.3} fill="none" />
              <circle cx={cx} cy={cy} r={rx * 0.5} fill="none" />
              <line x1={cx - 140} y1={cy} x2={cx + 140} y2={cy} />
              <line x1={cx} y1={cy - 70} x2={cx} y2={cy + depth + 70} />
            </g>
          )}

          {pointsTop.map((pt, i) => {
            const nextIdx = (i + 1) % pointsTop.length;
            const ptNext = pointsTop[nextIdx];
            const ptBottom = pointsBottom[i];
            const ptBottomNext = pointsBottom[nextIdx];
            const midTheta = (pt.theta + ptNext.theta) / 2;
            const isFacingFront = Math.sin(midTheta) > -0.15;
            if (!isFacingFront && !isCad) return null;

            return (
              <polygon
                key={i}
                points={`${pt.x.toFixed(1)},${pt.y.toFixed(1)} ${ptNext.x.toFixed(1)},${ptNext.y.toFixed(1)} ${ptBottomNext.x.toFixed(1)},${ptBottomNext.y.toFixed(1)} ${ptBottom.x.toFixed(1)},${ptBottom.y.toFixed(1)}`}
                fill={isCad ? 'rgba(6, 182, 212, 0.06)' : (i % 2 === 0 ? '#1f2937' : '#111827')}
                stroke={strokeColor}
                strokeWidth={isCad ? 0.8 : 0.6}
                strokeOpacity={isCad ? 0.8 : 0.4}
              />
            );
          })}

          <path
            d={topPathD}
            fill={fillTop}
            stroke={strokeColor}
            strokeWidth={isCad ? 1.2 : 1.5}
            strokeOpacity={isCad ? 0.9 : 0.8}
            filter={!isCad ? 'drop-shadow(0 0 8px rgba(245,158,11,0.25))' : undefined}
          />

          <ellipse
            cx={cx}
            cy={cy}
            rx={rx * 0.45}
            ry={ry * 0.45}
            fill={isCad ? 'none' : 'url(#gearHubGrad)'}
            stroke={strokeColor}
            strokeWidth={isCad ? 1 : 1.2}
          />
          <ellipse
            cx={cx}
            cy={cy}
            rx={rx * 0.22}
            ry={ry * 0.22}
            fill={isCad ? 'none' : '#000000'}
            stroke={isCad ? '#06b6d4' : '#f59e0b'}
            strokeWidth={isCad ? 0.8 : 1}
          />

          <line
            x1={cx + (rx * 0.22) * Math.cos(rad)}
            y1={cy + (ry * 0.22) * Math.sin(rad)}
            x2={cx + (rx * 0.35) * Math.cos(rad)}
            y2={cy + (ry * 0.35) * Math.sin(rad)}
            stroke={strokeColor}
            strokeWidth={isCad ? 1.5 : 2}
          />

          {isCad && (
            <g fontSize="9" fill="#06b6d4" fontFamily="monospace">
              <text x={cx + 70} y={cy - 25}>Ø EXT 185.0 mm</text>
              <text x={cx - 130} y={cy + depth + 30}>PASO MODULAR 4.5</text>
              <text x={cx - 50} y={cy + depth + 45}>TOLERANCIA ±0.05 mm</text>
            </g>
          )}
        </svg>
      );
    }

    if (partId === 'conector') {
      const cx = 200, cy = 130;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      const w = 110, h = 60, d = 70;

      const x1 = cx - (w / 2) * cos + (d / 2) * sin * 0.4;
      const y1 = cy - (w / 2) * sin * 0.3 - (d / 2) * cos * 0.25;
      const x2 = cx + (w / 2) * cos + (d / 2) * sin * 0.4;
      const y2 = cy + (w / 2) * sin * 0.3 - (d / 2) * cos * 0.25;
      const x3 = cx + (w / 2) * cos - (d / 2) * sin * 0.4;
      const y3 = cy + (w / 2) * sin * 0.3 + (d / 2) * cos * 0.25;
      const x4 = cx - (w / 2) * cos - (d / 2) * sin * 0.4;
      const y4 = cy - (w / 2) * sin * 0.3 + (d / 2) * cos * 0.25;

      return (
        <svg viewBox="0 0 400 300" className="w-full h-full max-w-[420px] max-h-[300px]">
          <defs>
            <linearGradient id="connGradSide" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#18181b" />
              <stop offset="100%" stopColor="#27272a" />
            </linearGradient>
            <linearGradient id="connGradFront" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3f3f46" />
              <stop offset="100%" stopColor="#18181b" />
            </linearGradient>
          </defs>

          <polygon
            points={`${x4.toFixed(1)},${y4.toFixed(1)} ${x3.toFixed(1)},${y3.toFixed(1)} ${x3.toFixed(1)},${(y3 + h).toFixed(1)} ${x4.toFixed(1)},${(y4 + h).toFixed(1)}`}
            fill={isCad ? 'rgba(6, 182, 212, 0.08)' : 'url(#connGradFront)'}
            stroke={strokeColor}
            strokeWidth={isCad ? 1 : 1.2}
          />
          <polygon
            points={`${x3.toFixed(1)},${y3.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)} ${x2.toFixed(1)},${(y2 + h).toFixed(1)} ${x3.toFixed(1)},${(y3 + h).toFixed(1)}`}
            fill={isCad ? 'rgba(6, 182, 212, 0.05)' : 'url(#connGradSide)'}
            stroke={strokeColor}
            strokeWidth={isCad ? 1 : 1.2}
          />

          <polygon
            points={`${x1.toFixed(1)},${y1.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)} ${x3.toFixed(1)},${y3.toFixed(1)} ${x4.toFixed(1)},${y4.toFixed(1)}`}
            fill={isCad ? 'rgba(6, 182, 212, 0.12)' : '#09090b'}
            stroke={strokeColor}
            strokeWidth={isCad ? 1.2 : 1.5}
          />

          {Array.from({ length: 6 }).map((_, r) =>
            Array.from({ length: 3 }).map((_, c) => {
              const u = -0.35 + r * 0.14;
              const v = -0.25 + c * 0.25;
              const px = cx + (w * u) * cos + (d * v) * sin * 0.4;
              const py = cy + (w * u) * sin * 0.3 + (d * v) * cos * 0.25;
              return (
                <circle
                  key={`${r}-${c}`}
                  cx={px}
                  cy={py}
                  r={isCad ? 2.2 : 2.8}
                  fill={isCad ? '#06b6d4' : '#f59e0b'}
                  stroke={isCad ? '#22d3ee' : '#fbbf24'}
                  strokeWidth="0.5"
                />
              );
            })
          )}

          <rect
            x={cx - 15}
            y={cy + h - 10}
            width="30"
            height="18"
            rx="3"
            fill={isCad ? 'none' : '#27272a'}
            stroke={strokeColor}
            strokeWidth={1}
          />

          {isCad && (
            <g fontSize="9" fill="#06b6d4" fontFamily="monospace">
              <text x={cx + 55} y={cy - 18}>36 PINES IP68</text>
              <text x={cx - 130} y={cy + h + 20}>COMPATIBLE CAN J1939</text>
              <text x={cx - 40} y={cy + h + 36}>POLÍMERO UL94-V0</text>
            </g>
          )}
        </svg>
      );
    }

    const cx = 200, cy = 140;
    const rx = 100, ry = 44;
    const depth = 28;

    return (
      <svg viewBox="0 0 400 300" className="w-full h-full max-w-[420px] max-h-[300px]">
        <defs>
          <linearGradient id="flangeGradSide" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3f3f46" />
            <stop offset="100%" stopColor="#18181b" />
          </linearGradient>
          <linearGradient id="flangeGradTop" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#52525b" />
            <stop offset="50%" stopColor="#27272a" />
            <stop offset="100%" stopColor="#18181b" />
          </linearGradient>
        </defs>

        <path
          d={`M ${cx - rx} ${cy} A ${rx} ${ry} 0 0 0 ${cx + rx} ${cy} v ${depth} A ${rx} ${ry} 0 0 1 ${cx - rx} ${cy + depth} Z`}
          fill={isCad ? 'rgba(6, 182, 212, 0.08)' : 'url(#flangeGradSide)'}
          stroke={strokeColor}
          strokeWidth={isCad ? 1 : 1.2}
        />

        <ellipse
          cx={cx}
          cy={cy}
          rx={rx}
          ry={ry}
          fill={isCad ? 'rgba(6, 182, 212, 0.12)' : 'url(#flangeGradTop)'}
          stroke={strokeColor}
          strokeWidth={isCad ? 1.2 : 1.5}
        />

        <ellipse
          cx={cx}
          cy={cy - 16}
          rx={rx * 0.42}
          ry={ry * 0.42}
          fill={isCad ? 'none' : '#27272a'}
          stroke={strokeColor}
          strokeWidth={isCad ? 1 : 1.2}
        />
        <ellipse
          cx={cx}
          cy={cy - 16}
          rx={rx * 0.28}
          ry={ry * 0.28}
          fill={isCad ? 'none' : '#09090b'}
          stroke={isCad ? '#06b6d4' : '#f59e0b'}
          strokeWidth={1}
        />

        {[0, (2 * Math.PI) / 3, (4 * Math.PI) / 3].map((baseAngle, idx) => {
          const theta = baseAngle + rad;
          const hx = cx + rx * 0.72 * Math.cos(theta);
          const hy = cy + ry * 0.72 * Math.sin(theta);
          return (
            <g key={idx}>
              <ellipse
                cx={hx}
                cy={hy}
                rx={10}
                ry={5}
                fill={isCad ? 'none' : '#09090b'}
                stroke={strokeColor}
                strokeWidth={isCad ? 1 : 1.2}
              />
              {isCad && (
                <line
                  x1={hx - 8}
                  y1={hy}
                  x2={hx + 8}
                  y2={hy}
                  stroke="#06b6d4"
                  strokeWidth="0.6"
                />
              )}
            </g>
          );
        })}

        {isCad && (
          <g fontSize="9" fill="#06b6d4" fontFamily="monospace">
            <text x={cx + 60} y={cy - 30}>ROSCA M20x1.5 (NOx)</text>
            <text x={cx - 130} y={cy + depth + 30}>3x PERNOS M10 (BCD 130mm)</text>
            <text x={cx - 50} y={cy + depth + 45}>TERMO-RESISTENTE 240°C</text>
          </g>
        )}
      </svg>
    );
  };

  // =========================================================================
  // FUSIÓN DE VIDEOS DE FONDO CENTRALES (TOTALMENTE SILENCIADO)
  // 1. FONDO1.mp4  2. video_fondo.mp4  3. gemini_generated_video_45915709.mp4
  // =========================================================================
  const heroBackgroundVideos = [
    { id: 1, src: './FONDO1.mp4', label: 'Taller & Rendimiento' },
    { id: 2, src: './video_fondo.mp4', label: 'Ingeniería Automotriz' },
    { id: 3, src: './gemini_generated_video_45915709.mp4', label: 'Flotas & Potencia Pesada' }
  ];
  const [currentHeroVideoIdx, setCurrentHeroVideoIdx] = useState(0);
  const heroVideoRef = useRef(null);

  // Video permanentemente silenciado para reproducción automática fluida
  useEffect(() => {
    const video = heroVideoRef.current;
    if (!video) return;

    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', 'true');

    const tryPlay = () => {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {});
      }
    };

    tryPlay();

    const handleInteraction = () => {
      if (video && video.paused) {
        video.muted = true;
        video.play().catch(() => {});
      }
    };

    window.addEventListener('touchstart', handleInteraction, { once: true, passive: true });
    window.addEventListener('click', handleInteraction, { once: true, passive: true });
    window.addEventListener('scroll', handleInteraction, { once: true, passive: true });

    return () => {
      window.removeEventListener('touchstart', handleInteraction);
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('scroll', handleInteraction);
    };
  }, [currentHeroVideoIdx]);

  const handleHeroVideoEnded = () => {
    setCurrentHeroVideoIdx((prev) => (prev + 1) % heroBackgroundVideos.length);
  };

  // ScrollSpy para actualizar el item activo del navbar automáticamente al hacer scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
      const sections = ['inicio', 'vehiculos', 'servicios', 'piezas3d', 'nosotros', 'rastreador', 'calculadora'];
      const scrollPos = window.scrollY + 140;

      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i]);
        if (el) {
          const top = el.offsetTop;
          if (scrollPos >= top) {
            setActiveNav(sections[i]);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Desplazamiento Suave y Centrado Preciso de Secciones
  const scrollToSection = (e, targetId) => {
    if (e && e.preventDefault) e.preventDefault();
    setActiveNav(targetId);
    setMobileMenuOpen(false);
    const element = document.getElementById(targetId);
    if (element) {
      const navOffset = 80; // Compensación de altura fija del navbar
      const y = element.getBoundingClientRect().top + window.pageYOffset - navOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
      window.history.pushState(null, '', `#${targetId}`);
    }
  };

  // =========================================================================
  // LAS 4 CARTILLAS / CATEGORÍAS VEHICULARES
  // Deportivos (video: deportivo.mp4), Pickups (video: pickupcamioneta.mp4),
  // Mixer (imagen MIXER.jfif) y Tractocamiones (imagen TRACTO.jfif)
  // =========================================================================
  const vehicleCategories = [
    {
      id: 'deportivos',
      title: 'Deportivos',
      subtitle: 'Diseño, potencia y precisión.',
      type: 'video',
      mediaSrc: './deportivo.mp4',
      badge: 'Gama Alta & Rendimiento',
      details: 'Calibración ECU, diagnóstico electrónico con escáner de alta gama, inyección multipunto/directa, optimización de sensores de oxígeno y mantenimiento preventivo para máxima respuesta en pista.',
      specs: [
        'Diagnóstico CAN Bus de alta velocidad',
        'Reprogramación y lectura de parámetros en vivo',
        'Afinamiento electrónico de alta precisión'
      ]
    },
    {
      id: 'pickups',
      title: 'Pickups',
      subtitle: 'Fuerza que te acompaña siempre.',
      type: 'video',
      mediaSrc: './pickupcamioneta.mp4',
      badge: '4x4 & Utilitarios',
      details: 'Mantenimiento del sistema de tracción 4WD, alternadores de alta potencia, refuerzo eléctrico para accesorios off-road, diagnóstico de fallas Common Rail e inyectores diésel.',
      specs: [
        'Refuerzo eléctrico para trabajo severo',
        'Prueba dinámica de alternador y arranque',
        'Diagnóstico de inyección Common Rail'
      ]
    },
    {
      id: 'mixer',
      title: 'Mixer',
      subtitle: 'Construimos el futuro juntos.',
      type: 'image',
      mediaSrc: './MIXER.jfif',
      badge: 'Construcción & Minería',
      details: 'Sistemas de 24V de servicio pesado, accionamiento de trompos, diagnóstico de sensores de presión hidráulica, arrancadores reforzados y cableado ignífugo para entornos hostiles.',
      specs: [
        'Sistemas eléctricos de 24V en carga continua',
        'Mantenimiento preventivo en obra/taller',
        'Cableado automotriz industrial ignífugo'
      ]
    },
    {
      id: 'tractocamiones',
      title: 'Tractocamiones',
      subtitle: 'Potencia que impulsa tu negocio.',
      type: 'image',
      mediaSrc: './TRACTO.jfif',
      badge: 'Transporte Pesado',
      details: 'Especialistas en Volvo FH, Scania, Shacman, Sinotruk. Redes multiplexadas CAN Bus, emuladores y reprogramación de sistemas NOx/AdBlue, prueba dinámica en banco y auxilio en carretera.',
      specs: [
        'Monitoreo computarizado de flotas pesadas',
        'Banco de prueba dinámico de 24V bajo carga',
        'Auxilio vial y rescate técnico 24/7'
      ]
    }
  ];

  // Estados del Cotizador Rápido Interactivo para Clientes
  const [calcVehicle, setCalcVehicle] = useState('tracto');
  const [calcService, setCalcService] = useState('canbus');

  const vehicleOptions = [
    { id: 'tracto', label: 'Tractocamión', desc: 'Volvo, Scania, Shacman, Sinotruk', icon: Truck },
    { id: 'mixer', label: 'Volquete / Mixer', desc: 'Camc, Mack, Mercedes, Dongfeng', icon: Boxes },
    { id: 'bus', label: 'Bus Interprovincial', desc: 'Mercedes O500, Scania K410, Modasa', icon: Car },
    { id: 'maquinaria', label: 'Línea Amarilla', desc: 'Caterpillar, Komatsu, JCB, Bobcat', icon: Settings }
  ];

  const serviceOptions = [
    { 
      id: 'canbus', 
      label: 'Diagnóstico CAN Bus & ECU', 
      desc: 'Lectura y reprogramación con escáner OEM de parámetros vivos y sensores NOx.',
      time: '1 a 2 horas (Inmediato)',
      tag: 'Electrónica Digital'
    },
    { 
      id: 'arranque', 
      label: 'Sistema de Arranque 24V', 
      desc: 'Mantenimiento preventivo/correctivo y prueba dinámica en banco bajo carga real.',
      time: 'Mismo día / 2 a 4 hrs',
      tag: 'Potencia Eléctrica'
    },
    { 
      id: '3dprint', 
      label: 'Manufactura 3D Aditiva', 
      desc: 'Ingeniería inversa de piezas descontinuadas en polímeros reforzados con fibra de carbono.',
      time: '24 a 48 horas (Diseño CAD)',
      tag: 'Obsolescencia Cero'
    },
    { 
      id: 'auxilio', 
      label: 'Auxilio de Campo en Ruta', 
      desc: 'Unidad móvil especializada para rescate técnico vial y reactivación inmediata.',
      time: '< 45 min despacho',
      tag: 'Emergencia 24/7'
    }
  ];

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchError('');
    setFoundQuote(null);

    const q = searchQuery.trim().toUpperCase();
    if (!q) {
      setSearchError('Por favor ingresa un número de cotización o placa para consultar.');
      return;
    }

    const match = quotes.find(item => 
      (item.quoteNumber && item.quoteNumber.toUpperCase().includes(q)) ||
      (item.plate && item.plate.toUpperCase().includes(q)) ||
      (item.clientDoc && item.clientDoc.includes(q))
    );

    if (match) {
      setFoundQuote(match);
    } else {
      setSearchError(`No encontramos una cotización registrada con: "${searchQuery}". Verifica el número (ej. DA-2026-001) o la placa.`);
    }
  };

  const formatSoles = (amount) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  const getWhatsAppEstimateUrl = () => {
    const vObj = vehicleOptions.find(v => v.id === calcVehicle) || vehicleOptions[0];
    const sObj = serviceOptions.find(s => s.id === calcService) || serviceOptions[0];
    const text = `Hola DARSIL Automotive Solutions, requiero atención técnica especializada:\n\n*Tipo de Unidad:* ${vObj.label} (${vObj.desc})\n*Servicio Requerido:* ${sObj.label}\n*Especialidad:* ${sObj.tag}\n*Tiempo Estimado:* ${sObj.time}\n\nPor favor contáctenme para coordinar detalles y disponibilidad.`;
    return `https://api.whatsapp.com/send?phone=51934787006&text=${encodeURIComponent(text)}`;
  };

  return (
    <div id="inicio" className="relative min-h-screen bg-black text-white font-sans selection:bg-amber-500 selection:text-black overflow-x-hidden">
      
      {/* Resplandor Neón Ámbar Siguiendo al Cursor en Tiempo Real */}
      <div
        className="pointer-events-none fixed inset-0 z-30 transition-opacity duration-300 hidden md:block"
        style={{
          background: `radial-gradient(650px circle at ${cursorPos.x}px ${cursorPos.y}px, rgba(245, 158, 11, 0.08), transparent 70%)`
        }}
      />

      {/* ========================================================================= */}
      {/* 1. HEADER / NAVBAR DARSIL (FONDO INVISIBLE PARA VER EL VIDEO DE FONDO) */}
      {/* ========================================================================= */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled 
          ? 'bg-black/85 backdrop-blur-md border-b border-white/10 shadow-xl' 
          : 'bg-transparent border-b border-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 sm:h-24 flex items-center justify-between">
          
          {/* Logo Oficial DARSIL (Mayor tamaño, sin enmarque, transparente y limpio) */}
          <div className="flex items-center space-x-3">
            <a href="#inicio" onClick={(e) => scrollToSection(e, 'inicio')} className="flex items-center group py-1">
              <img
                src="./logo_transparente.png"
                alt="DARSIL Automotive Solutions"
                className="h-14 sm:h-16 md:h-20 w-auto object-contain filter drop-shadow-[0_0_18px_rgba(245,158,11,0.4)] hover:opacity-95 transition-transform duration-300 group-hover:scale-105"
              />
            </a>
          </div>

          {/* Menú Central Navegación Limpio */}
          <nav className="hidden md:flex items-center space-x-6 lg:space-x-8">
            {[
              { id: 'inicio', label: 'Inicio' },
              { id: 'vehiculos', label: 'Vehículos' },
              { id: 'servicios', label: 'Soluciones' },
              { id: 'piezas3d', label: 'Piezas 3D' },
              { id: 'nosotros', label: 'Nosotros' },
              { id: 'rastreador', label: 'Rastrear Cotización' },
              { id: 'calculadora', label: 'Contacto' }
            ].map((item) => {
              const isActive = activeNav === item.id;
              return (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={(e) => scrollToSection(e, item.id)}
                  className={`relative text-xs sm:text-sm font-semibold tracking-wide transition-colors py-1.5 ${
                    isActive 
                      ? 'text-amber-400 font-bold' 
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <span>{item.label}</span>
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-400 to-yellow-400 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
                  )}
                </a>
              );
            })}
          </nav>

          {/* Acciones Derecha */}
          <div className="flex items-center space-x-2.5 sm:space-x-3.5">
            {/* Acceso al Sistema ERP */}
            <button
              onClick={onSwitchToAdmin}
              className="inline-flex items-center space-x-1.5 text-xs font-black bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full shadow-[0_0_20px_rgba(245,158,11,0.4)] hover:brightness-110 active:scale-95 transition"
            >
              <span>Acceso ERP</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            {/* Botón Hamburguesa Móvil */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl bg-white/5 border border-white/15 text-slate-300 hover:text-amber-400 transition"
              title="Abrir Menú"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>

        {/* Drawer Móvil Limpio */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-zinc-950/95 border-b border-white/10 p-5 space-y-2 backdrop-blur-2xl animate-in slide-in-from-top-2">
            {[
              { id: 'inicio', label: 'Inicio' },
              { id: 'vehiculos', label: 'Vehículos' },
              { id: 'servicios', label: 'Soluciones' },
              { id: 'piezas3d', label: 'Piezas 3D' },
              { id: 'nosotros', label: 'Nosotros' },
              { id: 'rastreador', label: 'Rastrear Cotización' },
              { id: 'calculadora', label: 'Contacto' }
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={(e) => scrollToSection(e, item.id)}
                className={`w-full text-left p-3 rounded-xl flex items-center justify-between text-xs font-bold transition ${
                  activeNav === item.id
                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span className="uppercase tracking-wide">{item.label}</span>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </button>
            ))}
          </div>
        )}
      </header>

      {/* ========================================================================= */}
      {/* 2. HERO PRINCIPAL 16:9 (PANTALLA COMPLETA CINEMÁTICA EN ESCRITORIO) */}
      {/* ========================================================================= */}
      <section id="inicio" className="relative w-full h-screen min-h-[640px] pt-24 sm:pt-28 pb-6 flex flex-col justify-between overflow-hidden">
        
        {/* Video Central de Fondo con Efecto Fusionado y Transición Continua (SILENCIADO) */}
        <div className="absolute inset-0 z-0 overflow-hidden bg-slate-950">
          <video
            ref={heroVideoRef}
            src={heroBackgroundVideos[currentHeroVideoIdx].src}
            autoPlay
            loop={false}
            muted
            playsInline
            webkit-playsinline="true"
            preload="auto"
            onEnded={handleHeroVideoEnded}
            className="w-full h-full object-cover filter brightness-[0.44] contrast-125 scale-105 transition-opacity duration-1000"
          />
          {/* Gradientes y Viñeteado Cinemático */}
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/80"></div>
          <div className="absolute inset-0 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:28px_28px] opacity-10 pointer-events-none"></div>
        </div>

        {/* Indicador Numérico Vertical Izquierdo (01 .. 03) */}
        <div className="hidden xl:flex flex-col items-center justify-center absolute left-6 top-1/2 -translate-y-1/2 z-20 space-y-4 font-mono text-xs select-none">
          <span className="text-amber-400 font-bold tracking-wider">0{currentHeroVideoIdx + 1}</span>
          <div className="w-0.5 h-20 bg-white/20 relative overflow-hidden rounded-full">
            <div 
              className="w-full bg-amber-400 transition-all duration-700 rounded-full" 
              style={{ 
                height: `${100 / heroBackgroundVideos.length}%`, 
                transform: `translateY(${currentHeroVideoIdx * 100}%)` 
              }}
            ></div>
          </div>
          <span className="text-slate-500 font-medium">0{heroBackgroundVideos.length}</span>
        </div>

        {/* Contenido Principal de la Portada 16:9 */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full my-auto py-6">
          <div className="max-w-3xl text-left space-y-5">
            
            {/* Tag / Badge Técnico */}
            <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-md bg-black/60 border border-white/20 backdrop-blur-md text-[10px] sm:text-xs font-mono font-bold tracking-widest text-slate-300 uppercase shadow-inner">
              <span className="text-amber-400 font-bold">&lt;</span>
              <span>TECNOLOGIA • RENDIMIENTO • CONFIANZA</span>
              <span className="text-amber-400 font-bold">&gt;</span>
            </div>

            {/* Titular Principal Solicitado */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.08] uppercase">
              Ingeniería Automotriz<br className="hidden sm:inline" /> de Precisión<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 drop-shadow-[0_0_30px_rgba(245,158,11,0.45)]">
                y Soluciones en Campo
              </span>
            </h1>

            {/* Barra de Acento Dorado */}
            <div className="w-20 h-1.5 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full"></div>

            {/* Subtítulo Técnico Oficial Solicitado */}
            <p className="text-sm sm:text-base lg:text-lg text-slate-200/90 max-w-2xl leading-relaxed font-normal">
              Especialistas en electrónica pesada, reparación de sistemas de arranque de 24V, diagnóstico computarizado con escáner oficial y fabricación de componentes descontinuados mediante impresión 3D industrial.
            </p>

            {/* Botones de Acción */}
            <div className="pt-2 flex flex-wrap items-center gap-3.5">
              <a
                href="#vehiculos"
                onClick={(e) => scrollToSection(e, 'vehiculos')}
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black px-6 py-3.5 rounded-full text-xs sm:text-sm shadow-gold-glow hover:brightness-110 active:scale-95 transition"
              >
                <span>Explorar vehículos</span>
                <ChevronRight className="w-4 h-4 text-slate-950" />
              </a>

              <a
                href="#nosotros"
                onClick={(e) => scrollToSection(e, 'nosotros')}
                className="inline-flex items-center space-x-2 bg-black/40 hover:bg-white/10 text-white font-bold px-6 py-3.5 rounded-full text-xs sm:text-sm border border-white/20 backdrop-blur-md transition"
              >
                <span>Conocer DARSIL</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </a>
            </div>

          </div>
        </div>

        {/* Indicadores Inferiores del Hero (Mouse Scroll + Acentos Tecnológicos) */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pb-6 flex items-center justify-between text-xs font-mono text-slate-400">
          <button 
            type="button"
            onClick={(e) => scrollToSection(e, 'vehiculos')}
            className="flex items-center space-x-2 animate-bounce select-none cursor-pointer hover:text-amber-400 transition"
          >
            <Mouse className="w-4 h-4 text-amber-400" />
            <span className="text-[10px] tracking-widest text-slate-300 uppercase font-bold">SCROLL PARA EXPLORAR</span>
          </button>

          {/* Insignia Tecnológica Oficial */}
          <div className="flex items-center space-x-3.5 select-none">
            <div className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-black/60 border border-white/15 text-slate-300 backdrop-blur-md text-[10px] tracking-widest uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
              <span>INGENIERÍA EN TIEMPO REAL</span>
            </div>

            <div className="text-amber-400 font-bold tracking-widest text-sm">
              ///
            </div>
          </div>
        </div>

      </section>

      {/* ========================================================================= */}
      {/* BARRA DE MÉTRICAS Y KPIS DE IMPACTO EN TIEMPO REAL */}
      {/* ========================================================================= */}
      <section className="relative z-20 py-12 sm:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-zinc-950/95 via-black/95 to-zinc-950/95 border border-amber-500/30 rounded-2xl sm:rounded-3xl p-5 sm:p-7 backdrop-blur-2xl shadow-[0_15px_45px_rgba(0,0,0,0.9),0_0_30px_rgba(245,158,11,0.12)]">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 sm:gap-6 divide-y sm:divide-y-0 sm:divide-x divide-white/10">
            
            <div className="pt-3 sm:pt-0 sm:px-4 text-left group">
              <div className="flex items-center space-x-2 text-[10px] sm:text-xs font-mono text-amber-400 font-bold uppercase tracking-wider mb-1">
                <Activity className="w-3.5 h-3.5 text-amber-400 group-hover:animate-pulse" />
                <span>Flotas & Taller</span>
              </div>
              <div className="text-2xl sm:text-4xl font-black text-white tracking-tight flex items-baseline space-x-1">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300">+1,480</span>
                <span className="text-xs text-amber-400/80 font-mono">UND</span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-1">
                Unidades pesadas y comerciales atendidas con éxito.
              </p>
            </div>

            <div className="pt-3 sm:pt-0 sm:px-4 text-left group">
              <div className="flex items-center space-x-2 text-[10px] sm:text-xs font-mono text-emerald-400 font-bold uppercase tracking-wider mb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
                <span>Confiabilidad Operativa</span>
              </div>
              <div className="text-2xl sm:text-4xl font-black text-white tracking-tight flex items-baseline space-x-1">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">99.6%</span>
                <span className="text-xs text-emerald-400/80 font-mono">UPTIME</span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-1">
                Cero retornos en sistemas de arranque de 24V y CAN Bus.
              </p>
            </div>

            <div className="pt-3 sm:pt-0 sm:px-4 text-left group">
              <div className="flex items-center space-x-2 text-[10px] sm:text-xs font-mono text-amber-400 font-bold uppercase tracking-wider mb-1">
                <Clock className="w-3.5 h-3.5 text-amber-400 group-hover:animate-spin" />
                <span>Auxilio Vial en Ruta</span>
              </div>
              <div className="text-2xl sm:text-4xl font-black text-white tracking-tight flex items-baseline space-x-1">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300">&lt; 45</span>
                <span className="text-xs text-amber-400/80 font-mono">MIN</span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-1">
                Tiempo promedio de despacho móvil y reactivación de unidad.
              </p>
            </div>

            <div className="pt-3 sm:pt-0 sm:px-4 text-left group">
              <div className="flex items-center space-x-2 text-[10px] sm:text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider mb-1">
                <Boxes className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
                <span>Manufactura Aditiva 3D</span>
              </div>
              <div className="text-2xl sm:text-4xl font-black text-white tracking-tight flex items-baseline space-x-1">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-300">±0.05</span>
                <span className="text-xs text-cyan-400/80 font-mono">MM</span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-1">
                Tolerancia dimensional en Onyx™ con microfibra de carbono.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. SECCIÓN DEDICADA DE VEHÍCULOS (UBICADA MÁS ABAJO CON SU PROPIO AIRE) */}
      {/* ========================================================================= */}
      <section id="vehiculos" className="relative py-20 lg:py-24 bg-gradient-to-b from-black via-zinc-950 to-black border-t border-white/10 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          
          {/* Cabecera de la Sección de Vehículos */}
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-400/30 text-amber-300 text-xs font-mono font-bold uppercase tracking-wider mb-3">
              <span>&lt; FLOTAS • LÍNEAS DE RENDIMIENTO • POTENCIA &gt;</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Líneas Especializadas de Vehículos
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
              Haz clic en cualquier categoría para conocer especificaciones técnicas, diagnósticos y soluciones DARSIL para cada unidad.
            </p>
          </div>

          {/* Grilla de las 4 Cartillas Vehiculares */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            
            {vehicleCategories.map((cat) => (
              <div 
                key={cat.id}
                onClick={() => setSelectedVehicleModal(cat)}
                className="group relative h-72 sm:h-80 lg:h-96 rounded-2xl overflow-hidden border border-white/15 bg-black/50 backdrop-blur-md shadow-2xl hover:border-amber-400/70 hover:shadow-[0_0_35px_rgba(245,158,11,0.3)] transition duration-500 cursor-pointer flex flex-col justify-between"
              >
                {/* Media de Fondo (Video en Vivo para Deportivos y Pickups / Imagen para Mixer y Tracto) */}
                <div className="absolute inset-0 z-0">
                  {cat.type === 'video' ? (
                    <video
                      src={cat.mediaSrc}
                      autoPlay
                      loop
                      muted
                      playsInline
                      webkit-playsinline="true"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 brightness-[0.72] contrast-115"
                    />
                  ) : (
                    <img
                      src={cat.mediaSrc}
                      alt={cat.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 brightness-[0.68] contrast-120"
                    />
                  )}
                  {/* Gradiente Protector de Legibilidad */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/20 group-hover:via-black/35 transition-colors duration-500"></div>
                </div>

                {/* Contenido Superior de la Tarjeta */}
                <div className="relative z-10 p-5 text-left">
                  <div className="w-8 h-0.5 bg-amber-400 group-hover:w-16 transition-all duration-300 mb-3"></div>
                  <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight group-hover:text-amber-300 transition">
                    {cat.title}
                  </h3>
                  <p className="text-xs text-slate-300/90 mt-1.5 leading-relaxed line-clamp-2">
                    {cat.subtitle}
                  </p>
                </div>

                {/* Acción Inferior: Botón Circular con Flecha + Tag */}
                <div className="relative z-10 p-5 pt-0 flex items-center justify-between">
                  <div className="w-10 h-10 rounded-full border border-white/20 bg-black/50 backdrop-blur-md flex items-center justify-center text-white group-hover:border-amber-400 group-hover:text-amber-400 group-hover:bg-amber-500/20 group-hover:scale-110 transition duration-300">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                  
                  <span className="text-[10px] font-mono font-bold text-amber-300/90 uppercase tracking-widest bg-black/60 px-2.5 py-1 rounded-full border border-amber-500/30">
                    {cat.badge}
                  </span>
                </div>

              </div>
            ))}

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. PILARES TECNOLÓGICOS Y SOLUCIONES DE TALLER */}
      {/* ========================================================================= */}
      <section id="servicios" className="min-h-screen py-20 lg:py-24 bg-black/95 border-t border-white/10 scroll-mt-20 flex flex-col justify-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-400/30 text-amber-300 text-xs font-mono font-bold uppercase tracking-wider mb-3">
              <span>&lt; CAPACIDADES DE ALTO RENDIMIENTO &gt;</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Nuestros Pilares Tecnológicos
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
              Diseñado para maximizar la disponibilidad y rendimiento operativo de maquinaria pesada, transporte interprovincial y flotas comerciales.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <div className="bg-slate-900/60 p-6 rounded-3xl border border-white/10 hover:border-amber-500/50 transition duration-300 group text-left">
              <div className="p-3 bg-amber-500/10 rounded-2xl w-fit text-amber-400 mb-4 group-hover:scale-110 transition">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Diagnóstico Digital CAN</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Lectura y reprogramación de computadoras de abordo ECU, sensores NOx, actuadores y subsistemas electrónicos 12V/24V.
              </p>
            </div>

            <div className="bg-slate-900/60 p-6 rounded-3xl border border-white/10 hover:border-amber-500/50 transition duration-300 group text-left">
              <div className="p-3 bg-amber-500/10 rounded-2xl w-fit text-amber-400 mb-4 group-hover:scale-110 transition">
                <Printer className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Manufactura 3D Aditiva</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Ingeniería inversa y fabricación aditiva de engranajes, conectores y piezas plásticas descontinuadas en polímeros de alta resistencia.
              </p>
            </div>

            <div className="bg-slate-900/60 p-6 rounded-3xl border border-white/10 hover:border-amber-500/50 transition duration-300 group text-left">
              <div className="p-3 bg-amber-500/10 rounded-2xl w-fit text-amber-400 mb-4 group-hover:scale-110 transition">
                <Truck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Auxilio Técnico en Ruta</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Unidades móviles equipadas para rescate vial, solución de fallas eléctricas de arranque y sustitución de alternadores en ruta.
              </p>
            </div>

            <div className="bg-slate-900/60 p-6 rounded-3xl border border-white/10 hover:border-amber-500/50 transition duration-300 group text-left">
              <div className="p-3 bg-amber-500/10 rounded-2xl w-fit text-amber-400 mb-4 group-hover:scale-110 transition">
                <Wrench className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Mantenimiento de Potencia</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Banco de prueba dinámico para motores de arranque pesados, bobinado de alternadores y cableado automotriz ignífugo.
              </p>
            </div>

          </div>

          {/* Botón de enlace hacia el Laboratorio y Visor 3D */}
          <div className="mt-12 text-center">
            <a
              href="#piezas3d"
              onClick={(e) => scrollToSection(e, 'piezas3d')}
              className="inline-flex items-center space-x-2 text-xs font-mono font-bold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-6 py-3 rounded-full transition duration-300 shadow-md"
            >
              <span>Explorar Laboratorio de Piezas 3D y Visor 360°</span>
              <ChevronRight className="w-4 h-4 rotate-90 text-amber-400" />
            </a>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. VISOR DE PIEZAS EN IMPRESIÓN 3D INDUSTRIAL CON ROTACIÓN 360° */}
      {/* ========================================================================= */}
      <section id="piezas3d" className="min-h-screen py-20 lg:py-24 bg-gradient-to-b from-black via-zinc-950 to-black border-t border-white/10 scroll-mt-20 flex flex-col justify-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          
          {/* Header del Visor 3D */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 text-left">
            <div>
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-400/30 text-amber-300 text-xs font-mono font-bold uppercase tracking-wider mb-2">
                <Box className="w-3.5 h-3.5 text-amber-400" />
                <span>LABORATORIO DE MANUFACTURA ADITIVA • ESTÁNDAR ASTM F2792 / ISO 52900</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Visor Interactivo de Piezas 3D <span className="text-amber-400 font-mono">(Rotación 360°)</span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
                Inspecciona y descarga modelos digitales de componentes fabricados con tecnología aditiva industrial para sustitución de piezas descontinuadas y restauración automotriz.
              </p>
            </div>

            {/* Selector de Modos y Controles */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="bg-black/60 border border-white/15 rounded-xl p-1 flex items-center space-x-1">
                <button
                  type="button"
                  onClick={() => setRenderMode('solido')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition ${
                    renderMode === 'solido'
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Sólido Onyx™
                </button>
                <button
                  type="button"
                  onClick={() => setRenderMode('cad')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition ${
                    renderMode === 'cad'
                      ? 'bg-cyan-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Malla CAD
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsAutoRotating(!isAutoRotating)}
                className={`p-2 rounded-xl border text-xs font-mono transition flex items-center space-x-1.5 ${
                  isAutoRotating
                    ? 'bg-amber-500/20 border-amber-400/50 text-amber-300'
                    : 'bg-white/5 border-white/15 text-slate-400 hover:text-white'
                }`}
                title={isAutoRotating ? 'Pausar rotación' : 'Activar rotación automática'}
              >
                {isAutoRotating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span className="hidden sm:inline text-[11px]">{isAutoRotating ? 'Pausa' : 'Auto 360°'}</span>
              </button>

              <button
                type="button"
                onClick={() => setRotAngle(35)}
                className="p-2 rounded-xl bg-white/5 border border-white/15 text-slate-400 hover:text-white hover:border-amber-400/50 transition"
                title="Reiniciar ángulo"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Pestañas de Piezas Disponibles (6 modelos) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mb-6">
            {[
              { id: 'golf_vw', name: 'Clip Parrilla VW Mk2', tag: 'VW Golf Mk2' },
              { id: 'subaru_delete', name: 'Plate Delete Subaru', tag: 'Subaru Tuning' },
              { id: 'camaro_conn', name: 'Conector Camaro', tag: 'Camaro Clásico' },
              { id: 'engranaje', name: 'Engranaje Helicoidal', tag: 'Mixers & Flotas' },
              { id: 'conector', name: 'Conector ECU 24V', tag: 'Volvo / Scania' },
              { id: 'brida', name: 'Brida Sensor NOx', tag: 'SCR AdBlue' }
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => { setSelected3DPart(p.id); setRotAngle(35); }}
                className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                  selected3DPart === p.id
                    ? 'bg-gradient-to-r from-amber-500/20 to-yellow-500/10 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.25)] ring-1 ring-amber-400/50'
                    : 'bg-zinc-950/80 border-white/10 hover:border-white/25 text-slate-300'
                }`}
              >
                <div>
                  <span className="text-[9px] font-mono text-amber-400 block uppercase font-bold tracking-wider">{p.tag}</span>
                  <span className="text-xs font-black text-white block mt-1 leading-tight">{p.name}</span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[9px] text-slate-500 font-mono">
                    {industrial3DParts[p.id].file ? '.STL' : 'CAD'}
                  </span>
                  <ChevronRight className={`w-3.5 h-3.5 ${selected3DPart === p.id ? 'text-amber-400' : 'text-slate-600'}`} />
                </div>
              </button>
            ))}
          </div>

          {/* Panel Principal del Visor 3D + Ficha de Ingeniería */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-zinc-950/90 border border-white/15 rounded-3xl p-5 sm:p-7 shadow-2xl overflow-hidden">
            
            {/* Canvas 3D Interactivo (Arrastrable con el Mouse/Touch o WebGL Three.js) */}
            <div 
              className="lg:col-span-7 relative h-80 sm:h-96 rounded-2xl bg-black/80 border border-white/10 overflow-hidden flex flex-col items-center justify-center select-none"
              {...(!industrial3DParts[selected3DPart].file ? {
                onMouseDown: handle3DMouseDown,
                onMouseMove: handle3DMouseMove,
                onMouseUp: handle3DMouseUp,
                onMouseLeave: handle3DMouseUp,
                onTouchStart: handle3DTouchStart,
                onTouchMove: handle3DTouchMove,
                onTouchEnd: handle3DTouchEnd,
                style: { cursor: 'grab' }
              } : {})}
            >
              {/* Cuadrícula de Fondo Tecnológica */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:24px_24px] opacity-20 pointer-events-none"></div>

              {/* Micro Insignia de Telemetría 3D */}
              <div className="absolute top-3 left-3 z-10 flex items-center space-x-2 text-[10px] font-mono text-slate-400 bg-black/60 px-2.5 py-1 rounded-full border border-white/10 pointer-events-none">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
                <span>{industrial3DParts[selected3DPart].file ? 'GEOMETRÍA STL REAL 3D • WEBGL' : `ROTACIÓN: ${Math.round(rotAngle)}°`}</span>
                <span>• MODO: {renderMode.toUpperCase()}</span>
              </div>

              <div className="absolute top-3 right-3 z-10 text-[10px] font-mono text-amber-400 bg-black/60 px-2.5 py-1 rounded-full border border-amber-500/30 pointer-events-none">
                <span>{industrial3DParts[selected3DPart].file ? 'ORBITA 3D • ZOOM CON RUEDA' : 'ARRASTRE PARA ROTAR 360°'}</span>
              </div>

              {/* RENDER GEOMÉTRICO 3D: STL WEBGL REAL O SVG PROYECTADO */}
              {industrial3DParts[selected3DPart].file ? (
                <STLViewer3D
                  stlUrl={industrial3DParts[selected3DPart].file}
                  renderMode={renderMode}
                  isAutoRotating={isAutoRotating}
                  onAngleChange={(a) => setRotAngle(a)}
                />
              ) : (
                <div className="relative w-full h-full flex items-center justify-center pointer-events-none">
                  {render3DModel(selected3DPart, rotAngle, renderMode)}
                </div>
              )}

              {/* Brillo en Piso / Sombra Dinámica */}
              <div className="absolute bottom-6 w-56 h-6 bg-amber-500/15 rounded-full blur-xl pointer-events-none"></div>
            </div>

            {/* Ficha Técnica de Ingeniería del Componente */}
            <div className="lg:col-span-5 text-left flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                    {industrial3DParts[selected3DPart].code}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {industrial3DParts[selected3DPart].tolerance}
                  </span>
                </div>

                <h4 className="text-xl font-black text-white mb-2">
                  {industrial3DParts[selected3DPart].name}
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed mb-3">
                  {industrial3DParts[selected3DPart].desc}
                </p>

                {/* Nota o Advertencia Técnica */}
                {industrial3DParts[selected3DPart].note && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] leading-relaxed flex items-start space-x-2 mb-3">
                    <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                    <span>{industrial3DParts[selected3DPart].note}</span>
                  </div>
                )}

                <div className="space-y-2 pt-2 border-t border-white/10 text-xs">
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-slate-400">Aplicación:</span>
                    <span className="font-semibold text-white text-right">{industrial3DParts[selected3DPart].app}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-slate-400">Material de Grado Técnico:</span>
                    <span className="font-semibold text-amber-300 text-right">{industrial3DParts[selected3DPart].material}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-slate-400">Resistencia Mecánica:</span>
                    <span className="font-semibold text-white text-right">{industrial3DParts[selected3DPart].tensile}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-slate-400">Resistencia Térmica:</span>
                    <span className="font-semibold text-white text-right">{industrial3DParts[selected3DPart].temp}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-slate-400">Estándar Internacional:</span>
                    <span className="font-semibold text-cyan-300 text-right">{industrial3DParts[selected3DPart].standard}</span>
                  </div>
                </div>
              </div>

              {/* Botones de Acción (Descarga STL y Cotización WhatsApp) */}
              <div className="pt-3 border-t border-white/10 space-y-2.5">
                {industrial3DParts[selected3DPart].file && (
                  <a
                    href={industrial3DParts[selected3DPart].file}
                    download={industrial3DParts[selected3DPart].fileName}
                    className="w-full inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs px-5 py-3 rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.3)] transition"
                  >
                    <Download className="w-4 h-4" />
                    <span>Descargar Modelo 3D ({industrial3DParts[selected3DPart].fileName})</span>
                  </a>
                )}

                <a
                  href={`https://api.whatsapp.com/send?phone=51934787006&text=${encodeURIComponent(`Hola DARSIL, deseo cotizar la fabricación aditiva 3D de la pieza: ${industrial3DParts[selected3DPart].name} (${industrial3DParts[selected3DPart].code}) para mi unidad/maquinaria.`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-xs px-5 py-3.5 rounded-xl shadow-gold-glow hover:brightness-110 active:scale-95 transition"
                >
                  <Printer className="w-4 h-4 text-slate-950" />
                  <span>Cotizar Fabricación Aditiva 3D</span>
                </a>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. SECCIÓN DEDICADA NOSOTROS: MISIÓN Y VISIÓN DARSIL */}
      {/* ========================================================================= */}
      <section id="nosotros" className="relative py-24 bg-gradient-to-b from-zinc-950 via-black to-zinc-950 border-t border-white/10 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          
          {/* Cabecera Sección Nosotros */}
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-400/30 text-amber-300 text-xs font-mono font-bold uppercase tracking-wider mb-3">
              <span>&lt; NUESTRA IDENTIDAD • INGENIERÍA & NORMAS GLOBALES &gt;</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Misión y Visión DARSIL
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
              Comprometidos con la excelencia técnica, la transparencia operativa y la homologación bajo estándares y normativas internacionales.
            </p>
          </div>

          {/* Grilla Misión y Visión */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
            
            {/* Tarjeta de Misión Institucional */}
            <div className="relative group bg-gradient-to-b from-zinc-900/90 to-black/90 p-8 sm:p-10 rounded-3xl border border-white/15 hover:border-amber-400/60 shadow-2xl transition duration-500 flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-amber-500/20 transition duration-500"></div>
              
              <div>
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.25)] group-hover:scale-105 transition">
                    <Target className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="text-[11px] font-mono font-bold text-amber-400 uppercase tracking-widest block">
                      PROPÓSITO CORPORATIVO
                    </span>
                    <h3 className="text-2xl font-black text-white">
                      Misión Institucional
                    </h3>
                  </div>
                </div>

                <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal mb-6">
                  Brindar soluciones integrales de alta ingeniería automotriz, mantenimiento electromecánico y fabricación aditiva industrial con los más rigurosos estándares técnicos, garantizando la continuidad operativa y rentabilidad de flotas comerciales, transporte pesado y vehículos de alto rendimiento en todo el territorio nacional.
                </p>

                <div className="space-y-3 pt-4 border-t border-white/10">
                  <div className="flex items-start space-x-3 text-xs sm:text-sm text-slate-300">
                    <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <span>Disponibilidad y respuesta técnica inmediata en taller y auxilio vial de campo 24/7.</span>
                  </div>
                  <div className="flex items-start space-x-3 text-xs sm:text-sm text-slate-300">
                    <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <span>Diagnóstico computarizado bajo protocolo ISO 14229 (UDS) y redes multiplexadas SAE J1939.</span>
                  </div>
                  <div className="flex items-start space-x-3 text-xs sm:text-sm text-slate-300">
                    <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <span>Gestión de calidad y aseguramiento de procesos alineados a la norma internacional ISO 9001:2015.</span>
                  </div>
                  <div className="flex items-start space-x-3 text-xs sm:text-sm text-slate-300">
                    <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <span>Fabricación aditiva 3D en fibra de carbono según especificaciones ASTM F2792 / ISO 52900.</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-4 flex items-center justify-between text-xs font-mono text-slate-500 border-t border-white/5">
                <span className="text-amber-400/90 font-bold">/// COMPROMISO TÉCNICO</span>
                <span>NORMA ISO 9001:2015</span>
              </div>
            </div>

            {/* Tarjeta de Visión de Futuro */}
            <div className="relative group bg-gradient-to-b from-zinc-900/90 to-black/90 p-8 sm:p-10 rounded-3xl border border-white/15 hover:border-yellow-400/60 shadow-2xl transition duration-500 flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-yellow-500/20 transition duration-500"></div>

              <div>
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-yellow-500/15 border border-yellow-500/30 flex items-center justify-center text-yellow-400 shadow-[0_0_20px_rgba(234,179,8,0.25)] group-hover:scale-105 transition">
                    <Compass className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="text-[11px] font-mono font-bold text-yellow-400 uppercase tracking-widest block">
                      HORIZONTE ESTRATÉGICO
                    </span>
                    <h3 className="text-2xl font-black text-white">
                      Visión de Futuro
                    </h3>
                  </div>
                </div>

                <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal mb-6">
                  Consolidarnos como el centro tecnológico automotriz líder y referente del Perú en diagnóstico electrónico computarizado, rescate técnico y manufactura avanzada de componentes, reconocidos por nuestra innovación continua, honestidad técnica y excelencia en el servicio al cliente.
                </p>

                <div className="space-y-3 pt-4 border-t border-white/10">
                  <div className="flex items-start space-x-3 text-xs sm:text-sm text-slate-300">
                    <CheckCircle2 className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
                    <span>Liderazgo en electromovilidad, sistemas de 24V y redes multiplexadas CAN Bus con homologación OEM.</span>
                  </div>
                  <div className="flex items-start space-x-3 text-xs sm:text-sm text-slate-300">
                    <CheckCircle2 className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
                    <span>Trazabilidad digital integral y transparencia total para cada cliente y gestor de flota.</span>
                  </div>
                  <div className="flex items-start space-x-3 text-xs sm:text-sm text-slate-300">
                    <CheckCircle2 className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
                    <span>Red estratégica de auxilio vial y rescate operativo en los principales corredores logísticos.</span>
                  </div>
                  <div className="flex items-start space-x-3 text-xs sm:text-sm text-slate-300">
                    <CheckCircle2 className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
                    <span>Cumplimiento estricto de estándares de seguridad y compatibilidad electromagnética UNECE R10 / NFPA 1901.</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-4 flex items-center justify-between text-xs font-mono text-slate-500 border-t border-white/5">
                <span className="text-yellow-400/90 font-bold">/// VANGUARDIA CONSTANTE</span>
                <span>ESTÁNDARES GLOBALES</span>
              </div>
            </div>

          </div>

          {/* Bloque de Normativas y Estándares Internacionales Homologados */}
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
            <div className="p-4 rounded-2xl bg-black/60 border border-white/10 hover:border-amber-400/40 transition">
              <span className="text-[10px] font-mono text-amber-400 font-bold block uppercase">GESTIÓN DE CALIDAD</span>
              <h4 className="text-sm font-black text-white mt-1">ISO 9001:2015</h4>
              <p className="text-[11px] text-slate-400 mt-1">Protocolos de diagnóstico y control de calidad en taller.</p>
            </div>
            <div className="p-4 rounded-2xl bg-black/60 border border-white/10 hover:border-amber-400/40 transition">
              <span className="text-[10px] font-mono text-cyan-400 font-bold block uppercase">DIAGNÓSTICO DIGITAL</span>
              <h4 className="text-sm font-black text-white mt-1">ISO 14229 / J1939</h4>
              <p className="text-[11px] text-slate-400 mt-1">Servicios UDS y multiplexado CAN para flotas pesadas.</p>
            </div>
            <div className="p-4 rounded-2xl bg-black/60 border border-white/10 hover:border-amber-400/40 transition">
              <span className="text-[10px] font-mono text-yellow-400 font-bold block uppercase">MANUFACTURA ADITIVA</span>
              <h4 className="text-sm font-black text-white mt-1">ASTM F2792 / ISO 52900</h4>
              <p className="text-[11px] text-slate-400 mt-1">Impresión 3D industrial y ensayos mecánicos de tracción.</p>
            </div>
            <div className="p-4 rounded-2xl bg-black/60 border border-white/10 hover:border-amber-400/40 transition">
              <span className="text-[10px] font-mono text-emerald-400 font-bold block uppercase">SEGURIDAD ELÉCTRICA</span>
              <h4 className="text-sm font-black text-white mt-1">UNECE R10 / NFPA 1901</h4>
              <p className="text-[11px] text-slate-400 mt-1">Compatibilidad electromagnética y sistemas de 24V.</p>
            </div>
          </div>

          {/* Barra Experiencia que nos respalda */}
          <div className="relative z-10 w-full mt-12 sm:mt-14">
            <div className="bg-black/75 backdrop-blur-2xl border border-white/15 rounded-2xl p-5 sm:p-7 shadow-[0_0_40px_rgba(0,0,0,0.85)]">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                
                {/* Etiqueta Izquierda */}
                <div className="lg:col-span-3 flex items-center space-x-3.5 pr-4 lg:border-r lg:border-amber-500/30">
                  <div className="w-1.5 h-10 bg-gradient-to-b from-amber-400 to-yellow-500 rounded-full shrink-0"></div>
                  <div className="text-left">
                    <span className="text-xs sm:text-sm font-black text-white uppercase tracking-wider block leading-tight">
                      EXPERIENCIA QUE
                    </span>
                    <span className="text-xs sm:text-sm font-black text-amber-400 uppercase tracking-wider block leading-tight">
                      NOS RESPALDA
                    </span>
                  </div>
                </div>

                {/* 4 Pilares de Confianza */}
                <div className="lg:col-span-9 grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 text-left">
                  
                  <div className="flex items-start space-x-3 group">
                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0 group-hover:scale-110 transition">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-[11px] sm:text-xs font-black text-white uppercase tracking-wider">SOLUCIONES INTEGRALES</h4>
                      <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5">De principio a fin.</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 group">
                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0 group-hover:scale-110 transition">
                      <Settings className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-[11px] sm:text-xs font-black text-white uppercase tracking-wider">TECNOLOGÍA AVANZADA</h4>
                      <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5">Innovación constante.</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 group">
                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0 group-hover:scale-110 transition">
                      <Award className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-[11px] sm:text-xs font-black text-white uppercase tracking-wider">CALIDAD GARANTIZADA</h4>
                      <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5">Estándares superiores.</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 group">
                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0 group-hover:scale-110 transition">
                      <Headphones className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-[11px] sm:text-xs font-black text-white uppercase tracking-wider">SOPORTE ESPECIALIZADO</h4>
                      <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5">Siempre a tu lado.</p>
                    </div>
                  </div>

                </div>

              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. PORTAL DE RASTREO DE COTIZACIONES Y CONSULTA DE PLACAS PARA CLIENTES */}
      {/* ========================================================================= */}
      <section id="rastreador" className="py-24 bg-gradient-to-b from-black via-slate-950 to-black border-t border-white/10 scroll-mt-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-400/30 text-amber-300 text-xs font-bold uppercase tracking-wider mb-4">
            <Search className="w-3.5 h-3.5 text-amber-400" />
            <span>Portal de Consulta para Clientes</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">
            Rastrea el Estado de tu Cotización o Vehículo
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm max-w-xl mx-auto mb-8">
            Ingresa el número de cotización oficial (ej. DA-2026-001) o la placa de tu unidad para consultar presupuesto, estado técnico y descargar el documento PDF.
          </p>

          <div className="bg-slate-900/80 backdrop-blur-2xl p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-amber-500/30 shadow-[0_0_30px_rgba(245,158,11,0.15)] w-full overflow-hidden">
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2.5 w-full">
              <div className="relative flex-1 w-full min-w-0">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Ingresa tu Placa (ej. ABC-123) o N° Cotización"
                  className="w-full bg-black/60 border border-white/20 rounded-xl px-4 py-3 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-amber-400 transition uppercase tracking-wider font-mono"
                />
              </div>
              <button
                type="submit"
                className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black px-6 py-3 rounded-xl text-xs sm:text-sm shadow-gold-glow hover:brightness-110 active:scale-95 transition shrink-0 flex items-center justify-center space-x-2"
              >
                <Search className="w-4 h-4" />
                <span>Consultar Estado</span>
              </button>
            </form>

            {/* Mensaje de Error */}
            {searchError && (
              <div className="mt-4 p-3 bg-red-500/15 border border-red-500/30 rounded-xl text-red-300 text-xs text-left">
                {searchError}
              </div>
            )}

            {/* Tarjeta de Cotización Encontrada */}
            {foundQuote && (
              <div className="mt-6 p-5 bg-black/80 rounded-2xl border border-emerald-500/40 text-left shadow-2xl space-y-4 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
                  <div>
                    <span className="text-xs font-bold text-slate-400">Cotización Oficial</span>
                    <h4 className="text-lg font-black text-amber-400">{foundQuote.quoteNumber}</h4>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs font-black px-3 py-1 rounded-full border ${
                      foundQuote.status === 'APROBADA' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                      foundQuote.status === 'EN_TALLER' || foundQuote.status === 'EN TALLER' ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' :
                      'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    }`}>
                      {foundQuote.status}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block">Cliente:</span>
                    <span className="font-bold text-white text-sm">{foundQuote.clientName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Vehículo / Placa:</span>
                    <span className="font-bold text-white text-sm">
                      {foundQuote.plate ? `${foundQuote.plate} • ${foundQuote.model || ''}` : 'Proyecto Industrial'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Total Cotizado:</span>
                    <span className="font-black text-amber-400 text-lg">{formatSoles(foundQuote.total)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Plazo de Entrega:</span>
                    <span className="font-semibold text-slate-200">{foundQuote.deliveryTerm || 'Inmediato / Según programación'}</span>
                  </div>
                </div>

                {/* Acciones de Cliente */}
                <div className="pt-3 border-t border-white/10 flex flex-wrap gap-2 justify-end">
                  <a
                    href={`/api/quotes/${foundQuote._id}/pdf`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl border border-white/20 transition"
                  >
                    <Download className="w-4 h-4 text-amber-400" />
                    <span>Descargar PDF Oficial</span>
                  </a>
                  <a
                    href={`https://api.whatsapp.com/send?phone=51934787006&text=${encodeURIComponent(`Hola DARSIL, deseo coordinar sobre la cotización ${foundQuote.quoteNumber} de mi vehículo ${foundQuote.plate || ''}.`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Contactar Asesor por WhatsApp</span>
                  </a>
                </div>
              </div>
            )}

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. COTIZADOR RÁPIDO INTERACTIVO */}
      {/* ========================================================================= */}
      <section id="calculadora" className="py-24 bg-gradient-to-b from-black via-slate-950 to-black border-t border-white/10 scroll-mt-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-400/30 text-amber-300 text-xs font-bold uppercase tracking-wider mb-4">
            <Gauge className="w-3.5 h-3.5 text-amber-400" />
            <span>Cotizador Rápido de Solución</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-white mb-4">
            ¿Qué problema presenta tu flota hoy?
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm max-w-2xl mx-auto mb-10">
            Selecciona tu tipo de unidad y el síntoma o servicio que requieres para coordinar inmediatamente la asistencia con el equipo técnico de guardia.
          </p>

          <div className="bg-slate-900/80 p-6 sm:p-8 rounded-3xl border border-amber-500/30 backdrop-blur-2xl shadow-2xl text-left space-y-8">
            
            {/* Selección Unidad */}
            <div>
              <span className="text-xs font-black text-slate-400 uppercase tracking-wider block mb-3">
                1. Selecciona la Unidad de tu Flota:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {vehicleOptions.map((v) => {
                  const IconComp = v.icon;
                  const isSelected = calcVehicle === v.id;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setCalcVehicle(v.id)}
                      className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between ${
                        isSelected
                          ? 'bg-amber-500/20 border-amber-400 text-white shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                          : 'bg-black/40 border-white/10 text-slate-400 hover:border-white/30 hover:text-white'
                      }`}
                    >
                      <IconComp className={`w-5 h-5 mb-2 ${isSelected ? 'text-amber-400' : 'text-slate-400'}`} />
                      <div>
                        <div className="text-xs font-black">{v.label}</div>
                        <div className="text-[10px] text-slate-500 truncate">{v.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selección Servicio */}
            <div>
              <span className="text-xs font-black text-slate-400 uppercase tracking-wider block mb-3">
                2. Selecciona la Especialidad Técnica:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {serviceOptions.map((s) => {
                  const isSelected = calcService === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setCalcService(s.id)}
                      className={`p-4 rounded-2xl border text-left transition ${
                        isSelected
                          ? 'bg-amber-500/20 border-amber-400 text-white shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                          : 'bg-black/40 border-white/10 text-slate-400 hover:border-white/30 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs font-black ${isSelected ? 'text-amber-300' : 'text-white'}`}>
                          {s.label}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-slate-300">
                          {s.tag}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">{s.desc}</p>
                      <div className="text-[11px] font-mono text-amber-400 font-bold mt-2">
                        Tiempo estimado: {s.time}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Botón WhatsApp */}
            <div className="p-4 rounded-2xl bg-black/60 border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-left space-y-1">
                <div className="flex items-center space-x-2 text-emerald-400 text-xs font-black uppercase">
                  <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                  <span>Equipo Técnico de Guardia Disponible</span>
                </div>
                <p className="text-xs text-slate-300">
                  Atención directa por WhatsApp con personal certificado de DARSIL.
                </p>
              </div>

              <a
                href={getWhatsAppEstimateUrl()}
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-6 py-3.5 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.4)] transition active:scale-95 shrink-0"
              >
                <Send className="w-4 h-4" />
                <span>Enviar Solicitud Inmediata</span>
              </a>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. FOOTER CORPORATIVO PROFESIONAL DE 4 COLUMNAS */}
      {/* ========================================================================= */}
      <footer className="border-t border-white/10 bg-black pt-16 pb-8 text-left relative overflow-hidden">
        {/* Glow de Fondo */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-amber-500/5 blur-[120px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 sm:gap-12 pb-12 border-b border-white/10">
            
            {/* Columna 1: Identidad Corporativa */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <img
                  src="./logo_transparente.png"
                  alt="DARSIL"
                  className="h-10 w-auto object-contain filter drop-shadow-[0_0_12px_rgba(245,158,11,0.3)]"
                />
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Ingeniería automotriz de precisión, mantenimiento electromecánico de alta potencia en 24V, diagnóstico computarizado y manufactura aditiva 3D industrial.
              </p>
              <div className="pt-2 space-y-1.5 text-xs text-slate-400 font-mono">
                <div className="text-amber-400 font-bold">DARSIL AUTOMOTRIZ S.A.C.</div>
                <div>RUC: 20608934561</div>
                <div className="text-slate-300">Villa El Salvador, Lima, Lima</div>
              </div>
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] text-emerald-400 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>TALLER HOMOLOGADO & ASISTENCIA VIAL</span>
              </div>
            </div>

            {/* Columna 2: Navegación & Módulos */}
            <div className="space-y-3">
              <h4 className="text-xs font-black text-amber-400 uppercase tracking-widest font-mono">
                Navegación Rápida
              </h4>
              <ul className="space-y-2 text-xs text-slate-300">
                <li>
                  <a href="#inicio" onClick={(e) => scrollToSection(e, 'inicio')} className="hover:text-amber-400 transition flex items-center space-x-1.5">
                    <span className="text-amber-400/70">›</span>
                    <span>Inicio / Portada Cinemática</span>
                  </a>
                </li>
                <li>
                  <a href="#vehiculos" onClick={(e) => scrollToSection(e, 'vehiculos')} className="hover:text-amber-400 transition flex items-center space-x-1.5">
                    <span className="text-amber-400/70">›</span>
                    <span>Líneas Especializadas de Vehículos</span>
                  </a>
                </li>
                <li>
                  <a href="#servicios" onClick={(e) => scrollToSection(e, 'servicios')} className="hover:text-amber-400 transition flex items-center space-x-1.5">
                    <span className="text-amber-400/70">›</span>
                    <span>Pilares Tecnológicos & Soluciones</span>
                  </a>
                </li>
                <li>
                  <a href="#nosotros" onClick={(e) => scrollToSection(e, 'nosotros')} className="hover:text-amber-400 transition flex items-center space-x-1.5">
                    <span className="text-amber-400/70">›</span>
                    <span>Misión y Visión DARSIL</span>
                  </a>
                </li>
                <li>
                  <a href="#rastreador" onClick={(e) => scrollToSection(e, 'rastreador')} className="hover:text-amber-400 transition flex items-center space-x-1.5">
                    <span className="text-amber-400/70">›</span>
                    <span>Rastrear Estado de Cotización</span>
                  </a>
                </li>
                <li>
                  <a href="#calculadora" onClick={(e) => scrollToSection(e, 'calculadora')} className="hover:text-amber-400 transition flex items-center space-x-1.5">
                    <span className="text-amber-400/70">›</span>
                    <span>Cotizador Rápido de Solución</span>
                  </a>
                </li>
                <li>
                  <button onClick={onSwitchToAdmin} className="text-amber-400 font-bold hover:underline flex items-center space-x-1.5 text-left">
                    <span>⚡ Acceso a Sistema ERP DARSIL</span>
                  </button>
                </li>
              </ul>
            </div>

            {/* Columna 3: Especialidades Técnicas */}
            <div className="space-y-3">
              <h4 className="text-xs font-black text-amber-400 uppercase tracking-widest font-mono">
                Especialidades Técnicas
              </h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li className="flex items-center space-x-2">
                  <span className="w-1 h-1 rounded-full bg-amber-400"></span>
                  <span>Diagnóstico ECU & Multiplexado CAN Bus</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="w-1 h-1 rounded-full bg-amber-400"></span>
                  <span>Reparación de Motores de Arranque 24V</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="w-1 h-1 rounded-full bg-amber-400"></span>
                  <span>Bobinado & Banco de Alternadores Heavy-Duty</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="w-1 h-1 rounded-full bg-amber-400"></span>
                  <span>Manufactura Aditiva 3D Fibra de Carbono</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="w-1 h-1 rounded-full bg-amber-400"></span>
                  <span>Auxilio Vial y Rescate de Flotas en Ruta</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="w-1 h-1 rounded-full bg-amber-400"></span>
                  <span>Mantenimiento de Sistemas SCR / AdBlue / NOx</span>
                </li>
              </ul>
            </div>

            {/* Columna 4: Legal, Cumplimiento & Libro de Reclamaciones */}
            <div className="space-y-3">
              <h4 className="text-xs font-black text-amber-400 uppercase tracking-widest font-mono">
                Legal & Cumplimiento
              </h4>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setLegalModal('terminos')}
                  className="w-full text-left text-xs text-slate-300 hover:text-amber-400 transition flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/10 hover:border-amber-500/40"
                >
                  <span>Términos y Condiciones</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                </button>

                <button
                  type="button"
                  onClick={() => setLegalModal('privacidad')}
                  className="w-full text-left text-xs text-slate-300 hover:text-amber-400 transition flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/10 hover:border-amber-500/40"
                >
                  <span>Política de Privacidad</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                </button>

                <button
                  type="button"
                  onClick={() => setLegalModal('garantia')}
                  className="w-full text-left text-xs text-slate-300 hover:text-amber-400 transition flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/10 hover:border-amber-500/40"
                >
                  <span>Garantía de Servicio Técnico</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                </button>

                <button
                  type="button"
                  onClick={() => setLegalModal('reclamaciones')}
                  className="w-full text-left text-xs text-amber-300 hover:text-amber-200 transition flex items-center justify-between p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 hover:border-amber-400"
                >
                  <div className="flex items-center space-x-2">
                    <BookOpen className="w-4 h-4 text-amber-400" />
                    <span className="font-bold">Libro de Reclamaciones</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-amber-400" />
                </button>
              </div>

              <div className="pt-2 text-[11px] text-slate-400">
                <span className="text-slate-300 font-bold block">Atención al Cliente:</span>
                <a href="https://api.whatsapp.com/send?phone=51934787006" target="_blank" rel="noreferrer" className="text-amber-400 hover:underline font-mono">
                  +51 934 787 006
                </a>
              </div>
            </div>

          </div>

          {/* Barra Inferior Copyright & Seguridad */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <div>
              <span>© 2026 DARSIL AUTOMOTRIZ. Todos los derechos reservados. Sede: Villa El Salvador, Lima, Lima.</span>
            </div>
            <div className="flex items-center space-x-4 text-[11px] font-mono">
              <span className="flex items-center space-x-1 text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>SSL 256-BIT ENCRYPTION</span>
              </span>
              <span>•</span>
              <span className="text-slate-400">PROTOCOLO ISO 14229</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Botón Flotante WhatsApp Sutil en Colores Corporativos DARSIL */}
      <a
        href="https://api.whatsapp.com/send?phone=51934787006&text=Hola%20DARSIL,%20quisiera%20cotizar%20un%20servicio%20t%C3%A9cnico."
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 p-3 sm:p-3.5 bg-zinc-950/90 hover:bg-black text-amber-400 border border-amber-500/40 hover:border-amber-400 rounded-full shadow-[0_0_20px_rgba(245,158,11,0.25)] hover:shadow-[0_0_30px_rgba(245,158,11,0.45)] backdrop-blur-xl active:scale-95 transition duration-300 flex items-center justify-center group"
        title="Atención Técnica Oficial por WhatsApp"
      >
        <Phone className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
        <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-300 ease-in-out font-bold text-xs pl-0 group-hover:pl-2.5 text-white">
          WhatsApp Técnico
        </span>
        <span className="w-2 h-2 rounded-full bg-emerald-400 ml-1.5 animate-pulse" title="En línea"></span>
      </a>

      {/* Modal Ficha Técnica y Especialidades de la Unidad */}
      {selectedVehicleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-zinc-950 border border-amber-500/40 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(245,158,11,0.25)] flex flex-col max-h-[90vh]">
            
            {/* Header Modal */}
            <div className="p-5 sm:p-6 border-b border-white/10 flex items-center justify-between bg-black/40">
              <div className="flex items-center space-x-3">
                <div className="w-1.5 h-8 bg-amber-400 rounded-full"></div>
                <div>
                  <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest block">
                    {selectedVehicleModal.badge}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-white">
                    {selectedVehicleModal.title}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedVehicleModal(null)}
                className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Media en Modal */}
            <div className="relative h-48 sm:h-64 w-full bg-black overflow-hidden shrink-0">
              {selectedVehicleModal.type === 'video' ? (
                <video
                  src={selectedVehicleModal.mediaSrc}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover brightness-[0.8]"
                />
              ) : (
                <img
                  src={selectedVehicleModal.mediaSrc}
                  alt={selectedVehicleModal.title}
                  className="w-full h-full object-cover brightness-[0.75]"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent"></div>
            </div>

            {/* Cuerpo del Modal */}
            <div className="p-6 space-y-5 overflow-y-auto">
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {selectedVehicleModal.details}
              </p>

              <div>
                <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider mb-2.5 flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-amber-400" />
                  <span>Protocolos Especializados DARSIL</span>
                </h4>
                <ul className="space-y-2">
                  {selectedVehicleModal.specs?.map((spec, idx) => (
                    <li key={idx} className="flex items-start space-x-2 text-xs text-slate-300">
                      <span className="text-amber-400 font-bold">•</span>
                      <span>{spec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Footer Modal con Acción WhatsApp */}
            <div className="p-5 sm:p-6 border-t border-white/10 bg-black/60 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs text-slate-400 text-center sm:text-left">
                ¿Necesitas diagnóstico o mantenimiento para tu {selectedVehicleModal.title}?
              </span>
              <a
                href={`https://api.whatsapp.com/send?phone=51934787006&text=${encodeURIComponent(`Hola DARSIL Automotive Solutions, deseo cotizar atención técnica especializada para la línea de ${selectedVehicleModal.title}.`)}`}
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-xs px-6 py-3 rounded-xl shadow-gold-glow hover:brightness-110 active:scale-95 transition"
              >
                <Phone className="w-4 h-4 text-slate-950" />
                <span>Cotizar Atención Técnica</span>
              </a>
            </div>

          </div>
        </div>
      )}

      {/* Modal Legal Corporativo (Términos, Privacidad, Garantía, Libro de Reclamaciones) */}
      {legalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-3xl bg-zinc-950 border border-amber-500/40 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(245,158,11,0.25)] flex flex-col max-h-[90vh]">
            
            {/* Header Modal Legal */}
            <div className="p-5 sm:p-6 border-b border-white/10 flex items-center justify-between bg-black/50">
              <div className="flex items-center space-x-3">
                <div className="w-1.5 h-8 bg-amber-400 rounded-full"></div>
                <div>
                  <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest block">
                    DARSIL AUTOMOTRIZ S.A.C. • MARCO LEGAL & CUMPLIMIENTO
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-white">
                    {legalModal === 'terminos' && 'Términos y Condiciones del Servicio'}
                    {legalModal === 'privacidad' && 'Política de Privacidad y Protección de Datos'}
                    {legalModal === 'garantia' && 'Política de Garantía Técnica y Repuestos'}
                    {legalModal === 'reclamaciones' && 'Libro de Reclamaciones Virtual'}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setLegalModal(null); setClaimSubmitted(false); }}
                className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido según el tipo de modal */}
            <div className="p-6 space-y-5 overflow-y-auto text-left text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
              
              {/* 1. TÉRMINOS Y CONDICIONES */}
              {legalModal === 'terminos' && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
                    Última actualización: Enero 2026. Al autorizar una cotización o ingresar una unidad a nuestro taller, el cliente acepta los siguientes términos técnicos.
                  </div>

                  <h4 className="text-sm font-black text-white uppercase tracking-wider text-amber-400">
                    1. Alcance de las Cotizaciones y Diagnósticos
                  </h4>
                  <p>
                    Toda cotización emitida a través del sistema oficial DARSIL posee una validez de 15 días hábiles a partir de su emisión. Los diagnósticos computarizados preliminares se basan en los códigos de falla (DTC) y estado inicial reportado; en caso de descubrirse daños ocultos durante el desmontaje técnico, se emitirá una ampliación de presupuesto para previa aprobación del cliente.
                  </p>

                  <h4 className="text-sm font-black text-white uppercase tracking-wider text-amber-400">
                    2. Aprobación y Orden de Trabajo
                  </h4>
                  <p>
                    Ningún servicio correctivo ni reemplazo de componentes será iniciado sin la confirmación expresa del cliente (vía firma de orden física, aprobación digital o confirmación certificada por WhatsApp oficial). La orden de trabajo aprobada formaliza el contrato de prestación de servicios electromecánicos.
                  </p>

                  <h4 className="text-sm font-black text-white uppercase tracking-wider text-amber-400">
                    3. Plazos de Entrega y Casos de Fuerza Mayor
                  </h4>
                  <p>
                    Los tiempos de entrega son estimados y pueden verse afectados por factores ajenos al taller, tales como demoras en importación de repuestos específicos de maquinaria pesada, componentes descontinuados en fase de digitalización 3D o verificaciones dinámicas prolongadas en banco de prueba para salvaguardar la seguridad operativa.
                  </p>

                  <h4 className="text-sm font-black text-white uppercase tracking-wider text-amber-400">
                    4. Facturación Electrónica y Pagos
                  </h4>
                  <p>
                    Todos los comprobantes de pago (Factura Electrónica / Boleta) son emitidos en estricto cumplimiento con la normativa SUNAT. La entrega de la unidad o repuesto manufacturado se realizará una vez cancelado el 100% del saldo presupuestado.
                  </p>

                  <h4 className="text-sm font-black text-white uppercase tracking-wider text-amber-400">
                    5. Retiro y Custodia de Unidades
                  </h4>
                  <p>
                    Una vez notificada la culminación de los trabajos técnicos, el cliente dispone de 48 horas para el retiro de su vehículo o maquinaria. Pasado este plazo, se aplicará una tarifa por derecho de custodia y resguardo en patio.
                  </p>
                </div>
              )}

              {/* 2. POLÍTICA DE PRIVACIDAD */}
              {legalModal === 'privacidad' && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs">
                    En cumplimiento de la Ley N° 29733 (Ley de Protección de Datos Personales de la República del Perú) y su Reglamento.
                  </div>

                  <h4 className="text-sm font-black text-white uppercase tracking-wider text-amber-400">
                    1. Titularidad del Banco de Datos
                  </h4>
                  <p>
                    Los datos personales recopilados a través de esta plataforma web o en nuestras instalaciones en Villa El Salvador, Lima, son incorporados en el banco de datos de titularidad de <strong>DARSIL AUTOMOTRIZ S.A.C.</strong>, garantizando su confidencialidad y tratamiento seguro.
                  </p>

                  <h4 className="text-sm font-black text-white uppercase tracking-wider text-amber-400">
                    2. Finalidad del Tratamiento
                  </h4>
                  <p>
                    Los datos personales (nombres, DNI/RUC, teléfono, placa vehicular, historial de mantenimiento y geolocalización de auxilio vial) son procesados exclusivamente para:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-slate-300">
                    <li>Generación de cotizaciones y órdenes de trabajo automotrices oficiales.</li>
                    <li>Notificaciones en tiempo real sobre el estado técnico del vehículo.</li>
                    <li>Emisión de comprobantes de pago electrónicos conforme a SUNAT.</li>
                    <li>Coordinación inmediata de asistencia vial y rescate técnico en ruta.</li>
                  </ul>

                  <h4 className="text-sm font-black text-white uppercase tracking-wider text-amber-400">
                    3. Seguridad de la Información
                  </h4>
                  <p>
                    Implementamos medidas de seguridad técnicas, organizativas y legales (incluyendo encriptación SSL de 256 bits y control de accesos restringido) para proteger la información contra acceso no autorizado, alteración o pérdida.
                  </p>

                  <h4 className="text-sm font-black text-white uppercase tracking-wider text-amber-400">
                    4. Derechos ARCO
                  </h4>
                  <p>
                    El titular de los datos puede ejercer en cualquier momento sus derechos de Acceso, Rectificación, Cancelación y Oposición comunicándose a través de nuestro canal oficial de WhatsApp (+51 934 787 006) o de forma presencial en nuestra sede en Villa El Salvador, Lima.
                  </p>
                </div>
              )}

              {/* 3. GARANTÍA DE SERVICIO TÉCNICO */}
              {legalModal === 'garantia' && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
                    Certificación de Calidad DARSIL: Cada intervención cuenta con respaldo formal y verificación bajo carga.
                  </div>

                  <h4 className="text-sm font-black text-white uppercase tracking-wider text-amber-400">
                    1. Cobertura de Mano de Obra
                  </h4>
                  <p>
                    Garantizamos la mano de obra técnica en reparaciones electromecánicas de sistemas de arranque de 24V, bobinado y mantenimiento general por un periodo de <strong>90 días calendario o 5,000 km</strong> (lo que ocurra primero), siempre que la unidad opere dentro de los parámetros de carga recomendados.
                  </p>

                  <h4 className="text-sm font-black text-white uppercase tracking-wider text-amber-400">
                    2. Garantía de Repuestos
                  </h4>
                  <p>
                    Los componentes y repuestos nuevos instalados cuentan con la garantía directa otorgada por el fabricante oficial. En componentes suministrados directamente por el cliente, DARSIL garantiza únicamente el correcto ensamble y montaje técnico.
                  </p>

                  <h4 className="text-sm font-black text-white uppercase tracking-wider text-amber-400">
                    3. Garantía en Componentes de Impresión 3D Industrial
                  </h4>
                  <p>
                    Las piezas fabricadas aditivamente en polímeros reforzados con fibra de carbono cuentan con <strong>6 meses de garantía</strong> contra defectos de manufactura, delaminación o fallas estructurales bajo condiciones normales de trabajo mecánico.
                  </p>

                  <h4 className="text-sm font-black text-white uppercase tracking-wider text-amber-400">
                    4. Exclusiones de la Garantía
                  </h4>
                  <p>
                    La garantía quedará sin efecto si la unidad:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-slate-300">
                    <li>Fue manipulada o intervenida por talleres o técnicos terceros no autorizados.</li>
                    <li>Sufrió siniestros viales, inmersión en agua profunda o sobrecargas eléctricas severas ajenas a la reparación.</li>
                    <li>Operó sin los niveles mínimos de fluidos, lubricación o refrigerante requeridos por el fabricante.</li>
                  </ul>
                </div>
              )}

              {/* 4. LIBRO DE RECLAMACIONES VIRTUAL */}
              {legalModal === 'reclamaciones' && (
                <div>
                  {claimSubmitted ? (
                    <div className="p-6 text-center space-y-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl">
                      <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                      <h4 className="text-lg font-black text-white">¡Reclamación Registrada con Éxito!</h4>
                      <p className="text-xs text-slate-300 max-w-md mx-auto">
                        Hemos registrado tu hoja de reclamación virtual. Conforme al Código de Protección y Defensa del Consumidor, recibirás una respuesta formal en un plazo máximo de 15 días hábiles.
                      </p>
                      <div className="p-3 bg-black/60 rounded-xl border border-white/10 font-mono text-xs text-amber-300 text-left space-y-1">
                        <div><strong>Código de Registro:</strong> REC-{Date.now().toString().slice(-6)}</div>
                        <div><strong>Razón Social:</strong> DARSIL AUTOMOTRIZ S.A.C.</div>
                        <div><strong>Sede:</strong> Villa El Salvador, Lima, Lima</div>
                      </div>
                      <div className="pt-2 flex justify-center gap-3">
                        <a
                          href={`https://api.whatsapp.com/send?phone=51934787006&text=${encodeURIComponent(`Hola DARSIL, he ingresado una hoja de reclamación formal:\n\n*Cliente:* ${claimForm.name}\n*Documento:* ${claimForm.docType} ${claimForm.docNum}\n*Tipo:* ${claimForm.type}\n*Placa/Cotización:* ${claimForm.plateOrQuote || 'N/A'}\n*Detalle:* ${claimForm.description}`)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition"
                        >
                          <Phone className="w-4 h-4" />
                          <span>Notificar al Responsable por WhatsApp</span>
                        </a>
                        <button
                          type="button"
                          onClick={() => { setLegalModal(null); setClaimSubmitted(false); }}
                          className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition"
                        >
                          Cerrar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (!claimForm.name || !claimForm.docNum || !claimForm.description) {
                          alert('Por favor completa los campos obligatorios (*).');
                          return;
                        }
                        setClaimSubmitted(true);
                      }}
                      className="space-y-4"
                    >
                      <div className="p-3 bg-black/60 rounded-xl border border-amber-500/20 text-[11px] text-slate-300 space-y-1">
                        <div><strong>Razón Social:</strong> DARSIL AUTOMOTRIZ S.A.C. • <strong>RUC:</strong> 20608934561</div>
                        <div><strong>Dirección:</strong> Villa El Salvador, Lima, Lima • <strong>Teléfono:</strong> 934 787 006</div>
                        <div className="text-amber-400 font-medium">Conforme a la Ley N° 29571 - Código de Protección y Defensa del Consumidor de la República del Perú.</div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Nombre Completo / Razón Social *</label>
                          <input
                            type="text"
                            required
                            value={claimForm.name}
                            onChange={(e) => setClaimForm({ ...claimForm, name: e.target.value })}
                            placeholder="Ej. Juan Pérez / Empresa Transportes SAC"
                            className="w-full bg-black/60 border border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                          />
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div className="col-span-1">
                            <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Tipo Doc.</label>
                            <select
                              value={claimForm.docType}
                              onChange={(e) => setClaimForm({ ...claimForm, docType: e.target.value })}
                              className="w-full bg-zinc-900 border border-white/20 rounded-xl px-2 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                            >
                              <option value="DNI">DNI</option>
                              <option value="RUC">RUC</option>
                              <option value="CE">CE</option>
                            </select>
                          </div>
                          <div className="col-span-2">
                            <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">N° Documento *</label>
                            <input
                              type="text"
                              required
                              value={claimForm.docNum}
                              onChange={(e) => setClaimForm({ ...claimForm, docNum: e.target.value })}
                              placeholder="Ej. 70123456"
                              className="w-full bg-black/60 border border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Teléfono Móvil / WhatsApp *</label>
                          <input
                            type="tel"
                            required
                            value={claimForm.phone}
                            onChange={(e) => setClaimForm({ ...claimForm, phone: e.target.value })}
                            placeholder="Ej. 987654321"
                            className="w-full bg-black/60 border border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Placa Vehicular o N° Cotización</label>
                          <input
                            type="text"
                            value={claimForm.plateOrQuote}
                            onChange={(e) => setClaimForm({ ...claimForm, plateOrQuote: e.target.value.toUpperCase() })}
                            placeholder="Ej. ABC-123 o DA-2026-001"
                            className="w-full bg-black/60 border border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 uppercase"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-1">
                        <label className={`p-3 rounded-xl border cursor-pointer text-left transition ${
                          claimForm.type === 'RECLAMO'
                            ? 'bg-amber-500/20 border-amber-400 text-white'
                            : 'bg-black/40 border-white/10 text-slate-400'
                        }`}>
                          <input
                            type="radio"
                            name="claimType"
                            value="RECLAMO"
                            checked={claimForm.type === 'RECLAMO'}
                            onChange={() => setClaimForm({ ...claimForm, type: 'RECLAMO' })}
                            className="sr-only"
                          />
                          <div className="font-bold text-xs text-amber-300">RECLAMO</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">Disconformidad relacionada a los productos o servicios brindados.</div>
                        </label>

                        <label className={`p-3 rounded-xl border cursor-pointer text-left transition ${
                          claimForm.type === 'QUEJA'
                            ? 'bg-amber-500/20 border-amber-400 text-white'
                            : 'bg-black/40 border-white/10 text-slate-400'
                        }`}>
                          <input
                            type="radio"
                            name="claimType"
                            value="QUEJA"
                            checked={claimForm.type === 'QUEJA'}
                            onChange={() => setClaimForm({ ...claimForm, type: 'QUEJA' })}
                            className="sr-only"
                          />
                          <div className="font-bold text-xs text-amber-300">QUEJA</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">Malestar o descontento respecto a la atención al público.</div>
                        </label>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Detalle del Reclamo o Queja *</label>
                        <textarea
                          required
                          rows={3}
                          value={claimForm.description}
                          onChange={(e) => setClaimForm({ ...claimForm, description: e.target.value })}
                          placeholder="Describe detalladamente los hechos ocurridos..."
                          className="w-full bg-black/60 border border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 resize-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Pedido o Solución Esperada</label>
                        <input
                          type="text"
                          value={claimForm.solution}
                          onChange={(e) => setClaimForm({ ...claimForm, solution: e.target.value })}
                          placeholder="Indica qué solución o medida correctiva solicitas..."
                          className="w-full bg-black/60 border border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                        />
                      </div>

                      <div className="pt-2 flex justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => setLegalModal(null)}
                          className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-xs shadow-gold-glow hover:brightness-110 active:scale-95 transition"
                        >
                          Registrar Hoja de Reclamación
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

            </div>

            {/* Footer Modal Legal */}
            <div className="p-4 sm:p-5 border-t border-white/10 bg-black/60 flex items-center justify-between text-xs text-slate-400">
              <span className="font-mono text-[11px]">Sede: Villa El Salvador, Lima, Lima</span>
              <button
                type="button"
                onClick={() => { setLegalModal(null); setClaimSubmitted(false); }}
                className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition"
              >
                Cerrar Ventana
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
