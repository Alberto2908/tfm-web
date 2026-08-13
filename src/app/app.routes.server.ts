import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    // Las gráficas (Chart.js) dibujan sobre <canvas> y no aportan nada
    // renderizadas en servidor; se cargan solo en cliente.
    path: 'dashboard',
    renderMode: RenderMode.Client
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
