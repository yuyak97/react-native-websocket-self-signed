import { NativeModules, Platform, type NativeModule } from 'react-native';
import type { WebSocketSelfSignedModule } from '../types/native-module';

const LINKING_ERROR =
  `The package 'react-native-websocket-self-signed' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n';

const WebSocketSelfSignedNativeModule: WebSocketSelfSignedModule &
  NativeModule = NativeModules.WebSocketSelfSigned
  ? NativeModules.WebSocketSelfSigned
  : new Proxy(
      {},
      {
        get() {
          throw new Error(LINKING_ERROR);
        },
      }
    );

export default WebSocketSelfSignedNativeModule;
