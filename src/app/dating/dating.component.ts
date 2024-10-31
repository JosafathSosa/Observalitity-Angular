import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject, OnInit, output } from '@angular/core';
import { MeterProvider } from '@opentelemetry/sdk-metrics';
import { RouterModule } from '@angular/router';
import { CustomErrorHandlerService, HttpMetricsService } from 'ngx-metrics-web';
import { FormsModule } from '@angular/forms';
import { AccountService } from '../_services/AccountService.service';
import { ButtonComponent } from 'ngx-banana-ui';

@Component({
  selector: 'app-dating',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ButtonComponent],
  templateUrl: './dating.component.html',
  styleUrls: ['./dating.component.css'],
})
export class DatingComponent implements OnInit {
  private httpMetricsService = inject(HttpMetricsService);
  accountService = inject(AccountService);
  title = 'Dating App';
  users: any;
  model: any = {};
  meterProvider = inject(MeterProvider);
  requestHistogram: any;
  requestCounter: any;
  cancelRegister = output<boolean>();

  // Inyecta el CustomErrorHandler con el tipo correcto
  customErrorHandlerService: CustomErrorHandlerService = inject(
    CustomErrorHandlerService
  );

  showUsers = false;

  constructor() {
    const meter = this.meterProvider.getMeter('angular-app');

    this.requestHistogram = meter.createHistogram(
      'http_request_duration_seconds',
      {
        description: 'Mide el tiempo de respuesta de las peticiones HTTP GET',
      }
    );

    this.requestCounter = meter.createCounter('http_request_status_count', {
      description: 'Cuenta la cantidad de respuestas HTTP por código de estado',
    });
  }

  ngOnInit(): void {}

  // Método para cargar usuarios y registrar métricas
  loadUsers(): void {
    this.httpMetricsService.get('https://localhost:5001/api/users').subscribe({
      next: (response) => {
        this.users = response;
      },
      error: (error) => {
        // Llamar a CustomErrorHandler para manejar el error
        this.customErrorHandlerService.handleError(error);
      },
      complete: () => {
        console.log('Request completa');
      },
    });
  }

  // Método que se ejecuta al hacer clic en el botón
  onButtonClick(): void {
    this.showUsers = true;
    this.loadUsers();
  }

  register(): void {
    const startTime = performance.now();
    this.accountService.register(this.model).subscribe({
      next: (response) => {
        console.log(response);

        // Incrementar contador de éxito (200)
        console.log('Incrementando contador para código de estado 200');
        this.requestCounter.add(1, {
          method: 'POST',
          status: '200',
          url: 'https://localhost:5001/api/account/register',
        });
        this.cancel();
      },
      error: (error) => {
        console.log(error);
        const statusCode = error.status || 'unknown';
        console.log(
          `Incrementando contador para código de estado ${statusCode}`
        );

        // Llamar a CustomErrorHandler para manejar el error
        this.customErrorHandlerService.handleError(error);

        // Incrementar el contador de error
        this.requestCounter.add(1, {
          method: 'POST',
          status: statusCode.toString(),
          url: 'https://localhost:5001/api/account/register',
        });
      },
      complete: () => {
        const endTime = performance.now();
        const duration = (endTime - startTime) / 1000;
        this.requestHistogram.record(duration, {
          method: 'POST',
          status: '200',
          url: 'https://localhost:5001/api/account/register',
        });

        console.log(`Request completed in ${duration} seconds`);
      },
    });
  }
  cancel(): void {
    this.cancelRegister.emit(false);
  }
}
