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
    this.httpMetricsService
      .post('https://localhost:5001/api/account/register', this.model)
      .subscribe({
        next: (response) => {
          this.cancel();
        },
        error: (error) => {
          this.customErrorHandlerService.handleError(error);
        },
        complete: () => {},
      });
  }
  cancel(): void {
    this.cancelRegister.emit(false);
  }
}
