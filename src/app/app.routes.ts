import { Routes } from '@angular/router';
import { DatingComponent } from './dating/dating.component';
import { ImagesComponent } from './images/images.component';
import { PokemonComponent } from './pokemon/pokemon.component';

const routeConfig: Routes = [
  { path: '', component: DatingComponent, title: 'Home Page' },
  { path: 'images', component: ImagesComponent, title: 'Image Page' },
  { path: 'pokemon', component: PokemonComponent, title: 'Pokemon API' },
];

export default routeConfig;
