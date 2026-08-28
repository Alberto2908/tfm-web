# VulnRadar — Frontend

Frontend de **VulnRadar**, una plataforma web para documentar, consultar y verificar vulnerabilidades de seguridad en aplicaciones web. Desarrollado como Trabajo de Fin de Máster (TFM).

Este repositorio contiene la aplicación cliente, desarrollada en Angular. El backend vive en un repositorio independiente: [tfm-server](https://github.com/Alberto2908/tfm-server).

## Características

- **Catálogo de vulnerabilidades**: consulta con filtros combinables (texto, severidad, categoría, rango de fechas) y paginación, sobre un catálogo con cientos de miles de CVE reales importados de la NVD.
- **Dashboard**: estadísticas agregadas del catálogo (por severidad, categoría, evolución temporal) con gráficas interactivas, exportable a PDF.
- **Exportación**: del catálogo filtrado y del dashboard en CSV, JSON, XML y PDF.
- **Panel de verificación (admin)**: revisión de vulnerabilidades pendientes, disparo manual del agente de IA y de la importación incremental de nuevos CVE.
- **Autenticación**: registro, inicio de sesión y perfil de usuario, con roles diferenciados (usuario / administrador).
- **Diseño adaptable**: interfaz responsive (móvil, tablet, escritorio) con modo claro y oscuro.

## Tecnologías

- [Angular 19](https://angular.dev/) (standalone components, SSR/hidratación)
- [TypeScript](https://www.typescriptlang.org/)
- [ng-zorro-antd](https://ng.ant.design/) — librería de componentes UI
- [ng2-charts](https://github.com/valor-software/ng2-charts) / [Chart.js](https://www.chartjs.org/) — gráficas del dashboard
- [SweetAlert2](https://sweetalert2.github.io/) — notificaciones y confirmaciones

## Requisitos previos

- [Node.js](https://nodejs.org/) 18 o superior
- npm
- El backend ([tfm-server](https://github.com/Alberto2908/tfm-server)) corriendo en local o accesible remotamente

## Instalación y ejecución en local

`main` solo contiene este README; el código vive en `develop`.

```bash
git checkout develop
npm install
npm start
```

La aplicación queda disponible en `http://localhost:4200`. Por defecto apunta al backend en `http://localhost:8080` (`src/environments/environment.ts`).

## Build de producción

```bash
npm run build
```

Genera el build en `dist/tfm-web/browser` (sin SSR, pensado para desplegarse como SPA estática).

## Ramas y despliegue

- `main`: rama base del repositorio.
- `develop`: desarrollo activo, con historial de commits granular por funcionalidad.
- `production`: réplica de `develop` una vez probado; conectada a [Vercel](https://vercel.com/) para el despliegue automático como aplicación estática.

## Autor

Alberto Cabello Lasheras
