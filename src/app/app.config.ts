import {
  ApplicationConfig,
  provideZoneChangeDetection,
  importProvidersFrom,
  APP_INITIALIZER,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import {
  provideClientHydration,
  withEventReplay,
} from '@angular/platform-browser';
import { authInterceptor } from './interceptors/auth.interceptor';
import { es_ES, provideNzI18n } from 'ng-zorro-antd/i18n';
import { registerLocaleData } from '@angular/common';
import es from '@angular/common/locales/es';
import { FormsModule } from '@angular/forms';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { NzIconService } from 'ng-zorro-antd/icon';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

// Importar iconos de Ant Design
import {
  PlusCircleOutline,
  SaveOutline,
  ReloadOutline,
  PlusOutline,
  EditOutline,
  DeleteOutline,
  EyeOutline,
  EyeInvisibleOutline,
  SearchOutline,
  SunOutline,
  MoonOutline,
  LogoutOutline,
  MenuOutline,
  CloseOutline,
  FilterOutline,
  UpOutline,
  DownOutline,
  LeftOutline,
  RightOutline,
  DownloadOutline,
  LinkOutline,
  DatabaseOutline,
  ClockCircleOutline,
  CalendarOutline,
  ThunderboltOutline,
  CloudSyncOutline,
  MinusOutline,
} from '@ant-design/icons-angular/icons';

registerLocaleData(es);

// Quita el sufijo "/ página" del selector de tamaño de página (nz-pagination),
// para que muestre solo el número (25, 50, 100).
const esEsSinSufijoPagina = {
  ...es_ES,
  Pagination: {
    ...es_ES.Pagination,
    items_per_page: '',
  },
};

// Función para registrar iconos
export function registerIconsFactory(iconService: NzIconService): () => void {
  return () => {
    iconService.addIcon(
      PlusCircleOutline,
      SaveOutline,
      ReloadOutline,
      PlusOutline,
      EditOutline,
      DeleteOutline,
      EyeOutline,
      EyeInvisibleOutline,
      SearchOutline,
      SunOutline,
      MoonOutline,
      LogoutOutline,
      MenuOutline,
      CloseOutline,
      FilterOutline,
      UpOutline,
      DownOutline,
      LeftOutline,
      RightOutline,
      DownloadOutline,
      LinkOutline,
      DatabaseOutline,
      ClockCircleOutline,
      CalendarOutline,
      ThunderboltOutline,
      CloudSyncOutline,
      MinusOutline,
    );
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideNzI18n(esEsSinSufijoPagina),
    importProvidersFrom(FormsModule),
    provideAnimationsAsync(),
    provideCharts(withDefaultRegisterables()),
    {
      provide: APP_INITIALIZER,
      useFactory: registerIconsFactory,
      deps: [NzIconService],
      multi: true,
    },
  ],
};
