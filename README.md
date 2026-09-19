# DARSIL Automotive Solutions — Sistema Integral de Cotizaciones, Operaciones & Flotas

Plataforma integral empresarial de alta gama desarrollada para **DARSIL Automotive Solutions** (Ingeniería y Diagnóstico Automotriz, Manufactura Aditiva 3D y Mantenimiento de Flotas).

---

## 🚀 Arquitectura del Sistema

```
                  ┌────────────────────────────────────────────────────────┐
                  │                   USUARIOS / CLIENTES                  │
                  └───────────┬────────────────────────────────┬───────────┘
                              │                                │
              ┌───────────────▼──────────────┐   ┌─────────────▼──────────────┐
              │    🌐 Portal Web / Landing   │   │     📱 App Móvil Android   │
              │     (React + Vite + Tailwind)│   │       (Flutter Release)    │
              └───────────────┬──────────────┘   └─────────────┬──────────────┘
                              │                                │
                              └───────────────┬────────────────┘
                                              │  REST API (JSON / HTTPS)
                                              ▼
                              ┌────────────────────────────────┐
                              │    ⚡ Backend REST API         │
                              │  (Node.js + Express + Docker)  │
                              │  - Motor PDF Oficial Chromium  │
                              │  - Integraciones RENIEC/SUNAT  │
                              │  - Logística Rutas con Mapbox  │
                              └───────────────┬────────────────┘
                                              │
                                              ▼
                              ┌────────────────────────────────┐
                              │    🍃 Base de Datos            │
                              │   MongoDB Atlas / Local Docker │
                              └────────────────────────────────┘
```

---

## 🌟 Características Principales

1. **Dashboard Ejecutivo ERP:** Métricas en tiempo real, pipeline comercial (Aprobadas, En Taller, Facturadas), cálculo de conversión y control financiero.
2. **Landing Page Futurista con Video de Fondo:** Video en bucle de alta definición, estética cyberpunk/industrial y **Rastreador de Cotización para Clientes** (por placa o N° de cotización).
3. **Motor PDF Oficial de Alta Fidelidad:** Maquetación idéntica al diseño del taller con Puppeteer/Chromium, logotipo oficial transparente en alta resolución y cálculo automático de tiempos y vigencia.
4. **Consultas Oficiales en Línea (APIsPerú):**
   * **DNI (8 dígitos):** Consulta directa a RENIEC.
   * **RUC (11 dígitos):** Consulta a SUNAT (Razón Social y Dirección Fiscal).
5. **Logística y Viáticos con Mapbox:**
   * Geocodificación y cálculo de distancia/tiempo de ruta desde el taller central hasta el cliente.
   * Estimación automática de viáticos de traslado técnico.
6. **Aplicación Móvil en Campo (Flutter 3):**
   * Ícono personalizado, tema oscuro en titanio y oro.
   * **Catálogo Maestro MO Offline de Respaldo:** Permite al técnico seleccionar y cotizar servicios incluso sin internet.
   * Selector dinámico de IP/servidor para operar tanto en red local como en la nube.
   * Redirección instantánea a WhatsApp del cliente con enlace al PDF.

---

## 🛠️ Tecnologías Empleadas

* **Frontend Web:** React 18, Vite, Tailwind CSS, Lucide Icons, Mapbox GL.
* **Backend:** Node.js, Express, Puppeteer-Core, Chromium Headless, Mongoose.
* **Base de Datos:** MongoDB (Docker local / MongoDB Atlas en la nube).
* **Móvil:** Flutter 3, Dart, Http, Url Launcher.
* **Contenedores:** Docker & Docker Compose.

---

## 📱 App Móvil Android (APK)

El archivo instalador compilado listo para usar en smartphones se encuentra en:
* [`darsil_mobile.apk`](./darsil_mobile.apk)

---

## 🌐 Despliegue en la Nube

* **Backend:** Desplegable en [Render](https://render.com) como **Web Service Docker** utilizando `./backend/Dockerfile`.
* **Frontend Web:** Desplegable en **GitHub Pages** (con el workflow automático de [`.github/workflows/deploy-web.yml`](./.github/workflows/deploy-web.yml)) o como **Render Static Site**.
* **Base de Datos:** [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) M0 Cluster gratuito.

---

© 2026 DARSIL Automotive Solutions. Todos los derechos reservados.
