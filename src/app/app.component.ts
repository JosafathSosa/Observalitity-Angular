import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';

//Importacion de librerias del rendimiento de la web
import { onINP, onCLS, onFCP, onTTFB, onLCP } from 'web-vitals';
import { RouterModule } from '@angular/router';
import { DatingComponent } from './dating/dating.component';
import { interval, Subscription } from 'rxjs';

//Servicios
import { CustomErrorHandler } from '../../src/app/_services/custom-error-handler.service';

//Mis librerias
import {
  WebVitalsService,
  ComponentMetricsService,
  DependencyIssuesService,
  AppStatusService,
} from 'ngx-metrics-web';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [DatingComponent, RouterModule],
  template: `<main>
    <section>
      <router-outlet></router-outlet>
    </section>
  </main>`,
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit, OnDestroy, AfterViewInit {
  title = 'angular-app';
  private appStatusSubscription: Subscription | null = null;

  public onLCP = onLCP;
  public onINP = onINP;
  public onCLS = onCLS;
  public onFCP = onFCP;
  public onTTFB = onTTFB;

  // En el constructor de tu componente
  constructor(
    private customErrorHandler: CustomErrorHandler,
    private webVitalsService: WebVitalsService,
    private appStatusService: AppStatusService,
    private componentMetricsService: ComponentMetricsService,
    private dependencyIssuesService: DependencyIssuesService
  ) {}

  ngOnInit() {
    this.appStatusService.startTrackingStatus(
      'app_status_custom', // Nombre de la métrica
      'Estado personalizado de la aplicación Angular: 1 si está activa, 0 si está inactiva'
    );
    this.componentMetricsService.startRender();
    this.webVitalsService.startWebVitalsCollection();
    this.dependencyIssuesService.verifyAndHandleDependencies(
      this,
      'web_vitals_issues',
      'Problemas de dependencias de métricas de Web Vitals'
    );
    /*Simula un error
    setTimeout(() => {
      throw new Error('Error intencional para probar el CustomErrorHandler');
    }, 2000);

    // Simula una advertencia (warning)
    setTimeout(() => {
      this.customErrorHandler.handleWarning({
        message: 'Advertencia intencional para probar las advertencias',
      });
    }, 4000);
    */
  }

  ngAfterViewInit(): void {
    this.componentMetricsService.endRender(
      'appComponent_render_time',
      'Render time for App component'
    );
  }

  ngOnDestroy() {}
}
