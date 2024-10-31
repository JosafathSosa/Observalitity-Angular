// pokemon.component.ts
import {
  AfterViewInit,
  Component,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';
import {
  CustomErrorHandlerService,
  HttpMetricsService,
  ComponentMetricsService,
} from 'ngx-metrics-web';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pokemon',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pokemon.component.html',
  styleUrls: ['./pokemon.component.css'],
})
export class PokemonComponent implements OnInit, OnDestroy, AfterViewInit {
  private httpMetricsService = inject(HttpMetricsService);
  private customErrorHandlerService = inject(CustomErrorHandlerService);
  private componentMetricsService = inject(ComponentMetricsService);

  pokemon: any;

  constructor() {}

  ngOnInit(): void {
    // Inicia la sesión y la métrica de tiempo de renderizado
    this.componentMetricsService.startSession();
    this.componentMetricsService.startRender();

    // Configura e incrementa el contador de visitas
    this.componentMetricsService.configureVisitCounter(
      'pokemon_page_visit_counter',
      'Number of visits to the Pokemon page'
    );
    this.componentMetricsService.trackVisit('PokemonComponent');

    // Configura el gauge de uso de memoria
    this.componentMetricsService.configureMemoryUsage(
      'pokemon_memory_usage',
      'Memory usage for Pokemon component in MB'
    );

    // Cargar la API de Pokemon
    this.loadPokemonAPI();
  }

  ngAfterViewInit(): void {
    // Finaliza y registra el tiempo de renderizado
    this.componentMetricsService.endRender(
      'pokemon_render_time',
      'Render time for Pokemon component'
    );
  }

  ngOnDestroy(): void {
    // Finaliza y registra la duración de la sesión
    this.componentMetricsService.endSession(
      'pokemon_session_duration',
      'Duration of user session in Pokemon component'
    );

    // Registra el uso de memoria al destruir el componente
    this.componentMetricsService.trackMemoryUsage();
  }

  // Método para cargar el API de Pokémon y registrar métricas HTTP
  private loadPokemonAPI(): void {
    this.httpMetricsService
      .get('https://pokeapi.co/api/v2/pokemon/pikachu')
      .subscribe({
        next: (response) => {
          this.pokemon = response;
        },
        error: (error) => {
          console.error('Error al cargar datos de Pokémon:', error);
          this.customErrorHandlerService.handleError(error);
        },
        complete: () => {
          console.log('Solicitud completada a la API de Pokémon.');
        },
      });
  }
}
