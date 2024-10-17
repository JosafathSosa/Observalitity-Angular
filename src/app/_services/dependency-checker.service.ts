import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class DependencyCheckerService {
  constructor() {}

  // Verificar si una clase o función está disponible
  isClassAvailable(classReference: any): boolean {
    return !!classReference;
  }

  checkAppComponentDependencies(appComponent: any): string[] {
    const issues: string[] = [];

    // Verificar si onLCP, onCLS, etc., están presentes en AppComponent
    if (!appComponent.onLCP) {
      issues.push('onLCP no está importado ni utilizado en AppComponent');
    }
    if (!appComponent.onINP) {
      issues.push('onINP no está importado ni utilizado en AppComponent');
    }
    if (!appComponent.onCLS) {
      issues.push('onCLS no está importado ni utilizado en AppComponent');
    }
    if (!appComponent.onTTFB) {
      issues.push('onTTFB no está importado ni utilizado en AppComponent');
    }
    if (!appComponent.onFCP) {
      issues.push('onTTFB no está importado ni utilizado en AppComponent');
    }

    // Puedes continuar con otras verificaciones según las dependencias
    return issues;
  }
}
