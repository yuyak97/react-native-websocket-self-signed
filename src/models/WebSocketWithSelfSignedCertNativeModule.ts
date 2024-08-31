import { NativeModules, Platform, type NativeModule } from 'react-native';
import type { WebSocketWithSelfSignedCertNativeModuleType } from '../types/native-module';

const LINKING_ERROR =
  `The package 'react-native-websocket-with-self-signed-cert' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n';

const WebSocketWithSelfSignedCertNativeModule: WebSocketWithSelfSignedCertNativeModuleType &
  NativeModule = NativeModules.WebSocketWithSelfSignedCert
  ? NativeModules.WebSocketWithSelfSignedCert
  : new Proxy(
      {},
      {
        get() {
          throw new Error(LINKING_ERROR);
        },
      }
    );

export default WebSocketWithSelfSignedCertNativeModule;
