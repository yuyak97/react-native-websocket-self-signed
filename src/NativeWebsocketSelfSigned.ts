import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export type Headers = { [key: string]: string };

export interface Spec extends TurboModule {
  addListener(eventName: string): void;
  removeListeners(count: number): void;

  connect(url: string, headers?: Headers): Promise<string>;
  send(url: string, message: string): void;
  sendBinaryBase64(url: string, base64String: string): void;
  close(url: string): void;
}

export const WebsocketSelfSignedNativeModule =
  TurboModuleRegistry.getEnforcing<Spec>('WebsocketSelfSigned');
