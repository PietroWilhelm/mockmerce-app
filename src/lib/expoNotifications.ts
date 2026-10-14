/**
 * O ÚNICO arquivo do app que importa o expo-notifications.
 *
 * Por que não `import * as Notifications from 'expo-notifications'`:
 *
 * O index do pacote carrega `DevicePushTokenAutoRegistration.fx.js`, que já no
 * import registra um listener de TOKEN DE PUSH REMOTO (`addPushTokenListener`).
 * No expo-notifications 57, rodando no Expo Go do Android, isso LANÇA um erro
 * ("Android Push notifications … was removed from Expo Go") e o app nem abre.
 *
 * O Caminho B não usa push remoto — só notificação LOCAL, que o Expo Go
 * continua suportando. Então importamos direto os módulos de notificação
 * local, que não passam pelo `.fx` nem pelo TokenEmitter (conferido em
 * node_modules/expo-notifications/build). Os tipos vêm do pacote com
 * `import type`, que some na compilação e não carrega nada em tempo de execução.
 *
 * Se um dia o app for para o Caminho A (development build), este arquivo
 * volta a ser um re-export do pacote inteiro e nada mais muda.
 */
export { setNotificationHandler } from 'expo-notifications/build/NotificationsHandler';
export { getPermissionsAsync, requestPermissionsAsync } from 'expo-notifications/build/NotificationPermissions';
export { IosAuthorizationStatus } from 'expo-notifications/build/NotificationPermissions.types';
export { setNotificationChannelAsync } from 'expo-notifications/build/setNotificationChannelAsync';
export { AndroidImportance } from 'expo-notifications/build/NotificationChannelManager.types';
export { scheduleNotificationAsync } from 'expo-notifications/build/scheduleNotificationAsync';
export { dismissAllNotificationsAsync } from 'expo-notifications/build/dismissAllNotificationsAsync';
export {
  addNotificationReceivedListener,
  addNotificationResponseReceivedListener,
  getLastNotificationResponse,
  clearLastNotificationResponse,
} from 'expo-notifications/build/NotificationsEmitter';

export type { NotificationPermissionsStatus, NotificationResponse } from 'expo-notifications';
