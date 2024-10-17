import {
  AfterViewInit,
  Component,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { MeterProvider } from '@opentelemetry/sdk-metrics';
import { CustomErrorHandler } from '../_services/custom-error-handler.service';

@Component({
  selector: 'app-pokemon',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pokemon.component.html',
  styleUrl: './pokemon.component.css',
})
export class PokemonComponent implements OnInit, OnDestroy, AfterViewInit {
  http = inject(HttpClient);
  pokemon: any;
  meterProvider = inject(MeterProvider);
  meter = this.meterProvider.getMeter('angular-app');
  startTime!: number;
  customErrorHandler: CustomErrorHandler = inject(CustomErrorHandler);

  constructor() {
    // Marca el inicio del renderizado
    performance.mark('component-start');
  }

  ngOnInit(): void {
    this.loadPokemonAPI();

    this.startTime = performance.now();

    //Incrementa el numero de visitas en el componente
    this.visitCounter.add(1, { page: 'pokemon' });
    console.log('La página de Pokemon ha sido visitada.');
  }

  ngOnDestroy(): void {}

  ngAfterViewInit(): void {
    performance.mark('component-end');

    performance.measure(
      'PokemonComponent-render-time',
      'component-start',
      'component-end'
    );

    const entries = performance.getEntriesByName(
      'PokemonComponent-render-time'
    );
    const renderTime = entries[0].duration;

    this.renderTimePokemonHistogram.record(renderTime);
    console.log(`El componente tardó ${renderTime} ms en rendererizar`);
  }

  private visitCounter = this.meter.createCounter('page_visits_count', {
    description: 'Numero de visitas',
  });

  private renderTimePokemonHistogram = this.meter.createHistogram(
    'PokemonAPIComponent_render_time',
    { description: 'Tiempo renderizado API component', unit: 'ms' }
  );

  private timeRequestHistogram = this.meter.createHistogram(
    'http_request_duration_seconds',
    { description: 'Mide el tiempo de respuesta de las peticiones HTTP GET' }
  );

  private requestCounter = this.meter.createCounter(
    "'http_request_status_count'",
    {
      description: 'Cuenta la cantidad de respuestas HTTP por código de estado',
    }
  );

  private loadPokemonAPI(): void {
    const startTime = performance.now();

    this.http.get('https://pokeapi.co/api/v2/pokemon/pikachu').subscribe({
      next: (response) => {
        this.pokemon = response;
        console.log('Incrementando request 200');

        this.requestCounter.add(1, {
          method: 'GET',
          status: '200',
          url: 'https://pokeapi.co/api/v2/pokemon/pikachu',
        });
      },
      error: (error) => {
        console.log(error);
        const statusCode = error.status || 'unknown';
        console.log('Incrementando error:', statusCode);

        this.customErrorHandler.handleError(error);

        this.requestCounter.add(1, {
          method: 'GET',
          status: statusCode.toString(),
          url: 'https://pokeapi.co/api/v2/pokemon/pikachu',
        });
      },
      complete: () => {
        const endTime = performance.now();
        const duration = (endTime - startTime) / 1000;
        this.timeRequestHistogram.record(duration, {
          method: 'GET',
          status: '200',
          url: 'https://pokeapi.co/api/v2/pokemon/pikachu',
        });

        console.log(`Request completa en ${duration} s`);
      },
    });
  }
}
