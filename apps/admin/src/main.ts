import { enableProdMode } from '@angular/core';
import { environment } from '@kh/common/environments';

import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, appConfig).catch((err) => console.error(err));
