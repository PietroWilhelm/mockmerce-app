import { registerRootComponent } from 'expo';
import App from './App';

// Registra o App como componente-raiz. Equivale a AppRegistry.registerComponent
// e garante que funcione tanto no Expo Go quanto num build nativo.
registerRootComponent(App);
