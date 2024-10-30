import {
  AfterViewInit,
  Component,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';
import { CustomErrorHandlerService, HttpMetricsService } from 'ngx-metrics-web';
import { MeterProvider } from '@opentelemetry/sdk-metrics';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pokemon',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pokemon.component.html',
  styleUrl: './pokemon.component.css',
})
export class PokemonComponent implements OnInit, OnDestroy, AfterViewInit {
  private httpMetricsService = inject(HttpMetricsService);
  private meterProvider = inject(MeterProvider);
  private customErrorHandlerService: CustomErrorHandlerService = inject(
    CustomErrorHandlerService
  );

  pokemon: any;
  startTime!: number;

  constructor() {
    // Marca el inicio del renderizado
    performance.mark('component-start');
  }

  ngOnInit(): void {
    this.loadPokemonAPI();

    // Incrementa el número de visitas en el componente
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
    console.log(`El componente tardó ${renderTime} ms en renderizar`);
  }

  // Métrica de visitas a la página
  private visitCounter = this.meterProvider
    .getMeter('angular-app')
    .createCounter('page_visits_count', {
      description: 'Numero de visitas',
    });

  // Histograma para tiempo de renderizado
  private renderTimePokemonHistogram = this.meterProvider
    .getMeter('angular-app')
    .createHistogram('PokemonAPIComponent_render_time', {
      description: 'Tiempo renderizado API component',
      unit: 'ms',
    });

  // Método para cargar el API de Pokémon y registrar métricas
  private loadPokemonAPI(): void {
    this.httpMetricsService
      .get('https://pokeapi.co/api/v2/pokemon/pikachu')
      .subscribe({
        next: (response) => {
          this.pokemon = response;
        },
        error: (error) => {
          console.error('Error al cargar datos de Pokémon:', error);
          this.customErrorHandlerService.handleError(error); // Manejo de error
        },
        complete: () => {
          console.log('Solicitud completada a la API de Pokémon.');
        },
      });
  }
}
