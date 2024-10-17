import { Component, OnInit, OnDestroy } from '@angular/core';

//Importacion de librerias del rendimiento de la web
import { onINP, onCLS, onFCP, onTTFB, onLCP } from 'web-vitals';
import { RouterOutlet, Router, RouterModule } from '@angular/router';

import { DatingComponent } from './dating/dating.component';

//Importaciones de OpenTelemetry
import {
  MeterProvider,
  PeriodicExportingMetricReader,
} from '@opentelemetry/sdk-metrics';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';

import { Resource } from '@opentelemetry/resources';
import { interval, Subscription } from 'rxjs';

//Servicios
import { CustomErrorHandler } from '../../src/app/_services/custom-error-handler.service';
import { DependencyCheckerService } from '../../src/app/_services/dependency-checker.service';

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
export class AppComponent implements OnInit, OnDestroy {
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
    private dependencyChecker: DependencyCheckerService
  ) {}

  ngOnInit() {
    this.trackPageLoadTime();
    this.webVitals();
    this.trackAppStatus();

    const issues = this.dependencyChecker.checkAppComponentDependencies(this);
    if (issues.length > 0) {
      console.warn('Problemas detectados en AppComponent:', issues);
      this.handleDependencyIssues(issues); // Enviar métrica de problema de importacion de librarias a Prometheus
    }

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

    // Registrar el listener del evento `beforeunload` para cuando la página se cierra o recarga
    window.addEventListener('beforeunload', this.handleBeforeUnload);
  }

  ngOnDestroy() {
    console.log('Aplicación destruida');

    // Limpiar la suscripción de intervalos y el listener de eventos
    if (this.appStatusSubscription) {
      this.appStatusSubscription.unsubscribe();
    }
    window.removeEventListener('beforeunload', this.handleBeforeUnload);
  }

  // Configuración de OpenTelemetry para exportar a OpenTelemetry Collector
  private metricExporter = new OTLPMetricExporter({
    url: 'http://localhost:4318/v1/metrics', // URL del OpenTelemetry Collector
  });

  private meterProvider = new MeterProvider({
    resource: new Resource({
      'service.name': 'angular-app',
    }),
    readers: [
      new PeriodicExportingMetricReader({
        exporter: this.metricExporter,
        exportIntervalMillis: 1000, // 15s para recolectar
      }),
    ],
  });

  private meter = this.meterProvider.getMeter('angular-app');

  // Métricas a enviar
  private buttonClickCount = this.meter.createCounter('button_click_count', {
    description: 'Número de clics en el botón',
  });

  private pageLoadTime = this.meter.createHistogram('page_load_time', {
    description: 'Tiempo de carga de la página',
  });

  // Métricas de Web Vitals
  private lcpHistogram = this.meter.createHistogram('lcp', {
    description: 'Largest Contentful Paint',
  });

  private inpHistogram = this.meter.createHistogram('inp', {
    description: 'Input Navigation Performance',
  });

  private clsHistogram = this.meter.createHistogram('cls', {
    description: 'Cumulative Layout Shift',
  });

  private fcpHistogram = this.meter.createHistogram('fcp', {
    description: 'First Contentful Paint',
  });

  private ttfbpHistogram = this.meter.createHistogram('ttfb', {
    description: 'Time to First Byte',
  });

  // MÉTRICA PARA EL ESTADO DE LA APLICACIÓN (sin etiquetas)
  private appStatusGauge = this.meter.createObservableGauge('app_status', {
    description:
      'Estado de la aplicación Angular: 1 si está activa, 0 si está inactiva',
  });

  //Funciones que envian metricas
  // Función para manejar problemas de dependencias
  private handleDependencyIssues(issues: string[]) {
    // Crear el contador para problemas de dependencias
    const dependencyIssuesCounter = this.meter.createCounter(
      'dependency_issues',
      {
        description: 'Número de problemas detectados en dependencias',
      }
    );

    if (issues.length > 0) {
      issues.forEach((issue) => {
        console.error('Problema detectado:', issue);
        // Enviar una métrica a Prometheus por cada problema detectado
        dependencyIssuesCounter.add(1, { issue });
      });
    }
  }

  // Función para manejar el evento `beforeunload` que sirve para mandar 0 al cerrar la página web
  private handleBeforeUnload = (event: BeforeUnloadEvent) => {
    console.log('Enviando métrica de estado 0 antes de cerrar o recargar.');

    // Registrar la métrica de la aplicación inactiva sin etiquetas
    this.appStatusGauge.addCallback((observableResult) => {
      observableResult.observe(0); // Cambiar el estado a 0 cuando se cierra la aplicación
    });

    // Forzar el envío de las métricas antes de que la página se cierre
    this.meterProvider
      .forceFlush()
      .then(() => {
        console.log('Métrica de estado 0 enviada.');
      })
      .catch((err) => {
        console.error('Error enviando métrica de estado 0:', err);
      });

    // Este bloque es para asegurar que el evento `beforeunload` siga su curso
    event.preventDefault();
    event.returnValue = '';
  };

  // Función que reporta el estado de la aplicación (1 para activa)
  private trackAppStatus() {
    this.appStatusGauge.addCallback((observableResult) => {
      observableResult.observe(1); // Estado de la aplicación activa
    });

    // Actualizar la métrica periódicamente mientras la aplicación está activa
    this.appStatusSubscription = interval(15000).subscribe(() => {
      console.log('Aplicación activa, enviando métrica de estado.');
    });
  }

  // Funciones que agregan y mandan las otras métricas
  public trackButtonClick() {
    this.buttonClickCount.add(1, { action: 'button_click' });
    console.log('Botón clickeado. Métrica enviada al backend');
  }

  private trackPageLoadTime() {
    const loadTime =
      performance.timing.loadEventEnd - performance.timing.navigationStart;
    this.pageLoadTime.record(loadTime, { route: window.location.pathname });
    console.log('Tiempo de carga de la página registrado');
  }

  private webVitals() {
    this.onCLS((metric) => {
      this.clsHistogram.record(metric.value, {
        name: metric.name,
        rating: metric.rating,
      });
      console.log('CLS registrado:', metric);
    });
    this.onLCP((metric) => {
      this.lcpHistogram.record(metric.value, {
        name: metric.name,
        rating: metric.rating,
      });
      console.log('LCP registrado:', metric);
    });
    this.onINP((metric) => {
      this.inpHistogram.record(metric.value, {
        name: metric.name,
        rating: metric.rating,
      });
      console.log('INP registrado:', metric);
    });

    this.onFCP((metric) => {
      this.fcpHistogram.record(metric.value, {
        name: metric.name,
        rating: metric.rating,
      });
      console.log('FCP registrado:', metric);
    });
    this.onTTFB((metric) => {
      this.ttfbpHistogram.record(metric.value, {
        name: metric.name,
        rating: metric.rating,
      });
      console.log('TTFB registrado:', metric);
    });
  }
}
