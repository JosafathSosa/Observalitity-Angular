import { ErrorHandler, Injectable } from '@angular/core';
import { MeterProvider } from '@opentelemetry/sdk-metrics';

@Injectable({
  providedIn: 'root', // Esto permite que el servicio esté disponible en toda la aplicación
})
export class CustomErrorHandler implements ErrorHandler {
  private errorCounter;
  private warningCounter;

  constructor(private meterProvider: MeterProvider) {
    // Crea un contador de errores
    const meter = this.meterProvider.getMeter('angular-app');
    this.errorCounter = meter.createCounter('error_count', {
      description: 'Número de errores en la aplicación',
    });

    this.warningCounter = meter.createCounter('warning_count', {
      description: 'Número de advertencias en la aplicacion',
    });

    // Sobrescribir el comportamiento por defecto de console.warn
    this.overrideConsoleWarn();
  }

  handleError(error: any) {
    // Incrementa la métrica de errores
    this.errorCounter.add(1, { error: error.name || 'UnknownError' });

    // Loguea el error a la consola o maneja el error de otra manera
    console.error('Se ha producido un error:', error);
  }

  handleWarning(warning: any) {
    this.warningCounter.add(1, {
      warning: warning.message || 'UnknownWarning',
    });

    console.warn('Advertencia detectada', warning);
  }

  // Sobrescribir console.warn para capturar advertencias como NG0913
  private overrideConsoleWarn(): void {
    const originalWarn = console.warn;
    const customHandler = this;

    console.warn = function (...args: any[]) {
      // Pasar el warning al manejador personalizado
      customHandler.handleWarning({ message: args[0] });

      // Llamar al comportamiento original de console.warn
      originalWarn.apply(console, args);
    };
  }
}
