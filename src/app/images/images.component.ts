import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  Component,
  inject,
  OnInit,
  OnDestroy,
  AfterViewInit,
} from '@angular/core';
import { MeterProvider } from '@opentelemetry/sdk-metrics';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-dating',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './images.component.html',
  styleUrls: ['./images.component.css'],
})
export class ImagesComponent implements OnInit, OnDestroy, AfterViewInit {
  http = inject(HttpClient);
  title = 'Dating App';
  // Añadimos un array de URLs para las seis imágenes
  imageUrls: string[] = [
    'https://www.laxmasmusica.com/uploads/newsarticle/a57e507babd44c508e6a595d3c885324/Red_Hot_Chili_Peppers_lanza_su_nueva_cancio_OhO0gDc.jpg',
    'https://www.billboard.com/wp-content/uploads/2022/11/blink-182-2001-billboard-1548.jpg',
    'https://i.ytimg.com/vi/0RDXd0_KT60/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLCuazKNmso7mv0GLvojs1nlaGx13g',
    'https://upload.wikimedia.org/wikipedia/commons/6/63/Led_Zeppelin_-_promotional_image_%281971%29.jpg',
  ];
  meterProvider = inject(MeterProvider);
  meter = this.meterProvider.getMeter('angular-app');

  showUsers = false;

  constructor() {
    // Marca el inicio del renderizado
    performance.mark('component-start');
  }
  private startTime!: number;
  // Histograma para medir la cantidad de memoria usada
  private memoryUsageHistogram = this.meterProvider
    .getMeter('angular-app')
    .createHistogram('component_memory_usage_mb', {
      description: 'Memoria usada por el componente en MB al salir',
      unit: 'MB',
    });

  // Histograma para medir la duración de el tiempo de carga de una imagen
  private imageLoadTimeHistogram = this.meter.createHistogram(
    'image_load_time',
    {
      description: 'Tiempo de carga de la imagen',
      unit: 'ms',
    }
  );

  // Histograma para medir la duración de la sesión del usuario
  private sessionDurationHistogram = this.meter.createHistogram(
    'user_session_duration',
    {
      description: 'Mide el tiempo que un usuario pasa en la página',
      unit: 'ms', // Milisegundos
    }
  );

  private renderTimeHistogram = this.meter.createHistogram(
    'component_render_time',
    {
      description: 'Tiempo en ms que tarda el componente en renderizar',
      unit: 'ms',
    }
  );

  ngOnInit(): void {
    this.startTime = performance.now(); // Marca el inicio de la sesión del usuario e igual mide el tiempo de la imagen
    console.log('Empecé a contar el tiempo de sesión del componente.');
  }

  ngOnDestroy(): void {
    const endTime = performance.now(); // Marca el final de la sesión del usuario
    const sessionDuration = endTime - this.startTime;

    // Registrar la duración de la sesión
    this.sessionDurationHistogram.record(sessionDuration);
    console.log(`Duración de la sesión registrada: ${sessionDuration} ms`);

    // Verificar y registrar el uso de memoria solo al destruir el componente
    if ((performance as any).memory) {
      const memoryUsedMB = this.getMemoryUsageInMB();
      console.log(
        `Memoria usada al destruir el componente: ${memoryUsedMB} MB`
      );

      // Enviar la métrica de uso de memoria a Prometheus
      this.memoryUsageHistogram.record(memoryUsedMB);
    } else {
      console.warn(
        'La API performance.memory no es compatible con este navegador.'
      );
    }
  }

  ngAfterViewInit(): void {
    // Marca el final del renderizado
    performance.mark('component-end');

    // Mide el tiempo de renderizado
    performance.measure(
      'component-render-time',
      'component-start',
      'component-end'
    );

    // Obtener la medida y registrar en Prometheus
    const entries = performance.getEntriesByName('component-render-time');
    const renderTime = entries[0].duration;

    this.renderTimeHistogram.record(renderTime);
    console.log(`El componente tardó en renderizarse: ${renderTime} ms`);
  }

  onImageLoad(event: Event): void {
    const endTime = performance.now(); // Marca el final de la carga de la imagen
    const loadTime = endTime - this.startTime; // Calcula el tiempo de carga

    // Enviar la métrica de tiempo de carga a Prometheus
    this.imageLoadTimeHistogram.record(loadTime);
    console.log(`La imagen se cargó en: ${loadTime} ms`);
  }

  private getMemoryUsageInMB(): number {
    const memoryInfo = (performance as any).memory; // Cast de performance a any
    if (memoryInfo) {
      const usedJSHeapSize = memoryInfo.usedJSHeapSize; // Memoria usada en bytes
      const usedMB = usedJSHeapSize / (1024 * 1024); // Convertir de bytes a MB
      return usedMB;
    } else {
      console.warn(
        'La API performance.memory no es compatible con este navegador.'
      );
      return 0; // Devuelve 0 si la API no está disponible
    }
  }
}
