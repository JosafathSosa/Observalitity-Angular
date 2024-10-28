import { bootstrapApplication } from '@angular/platform-browser';
import { ErrorHandler } from '@angular/core'; // Importar ErrorHandler
import { AppComponent } from './app/app.component';
import { CustomErrorHandlerService } from 'ngx-metrics-web';
import {
  MeterProvider,
  PeriodicExportingMetricReader,
} from '@opentelemetry/sdk-metrics';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { provideRouter } from '@angular/router';
import routeConfig from './app/app.routes';
import { provideHttpClient } from '@angular/common/http';

// Configuración de OpenTelemetry para exportar a OpenTelemetry Collector
const metricExporter = new OTLPMetricExporter({
  url: 'http://localhost:4318/v1/metrics', // URL del OpenTelemetry Collector
});

// Crear y configurar el MeterProvider
const meterProvider = new MeterProvider({
  resource: new Resource({
    'service.name': 'angular-app',
  }),
  readers: [
    new PeriodicExportingMetricReader({
      exporter: metricExporter,
      exportIntervalMillis: 1000, // 15s para recolectar
    }),
  ],
});

// Inicializa la aplicación con OpenTelemetry y el manejador de errores
bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routeConfig),
    { provide: ErrorHandler, useClass: CustomErrorHandlerService }, // Registrar CustomErrorHandler
    { provide: MeterProvider, useValue: meterProvider },
    // Registrar MeterProvider como proveedor
    provideHttpClient(),
  ],
}).catch((err) => console.error(err));
