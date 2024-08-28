import {
  NativeModules,
  NativeEventEmitter,
  Platform,
  type NativeModule,
} from 'react-native';
import { WebSocketEvent } from '../enums/websocket-event.enum';
import type { WebSocketSelfSignedModule } from '../types/native-module';

const LINKING_ERROR =
  `The package 'react-native-wss-self-signed' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n';

const WebsocketSelfSignedModule: WebSocketSelfSignedModule & NativeModule =
  NativeModules.WebsocketSelfSigned
    ? NativeModules.WebsocketSelfSigned
    : new Proxy(
        {},
        {
          get() {
            throw new Error(LINKING_ERROR);
          },
        }
      );

/**
 * A class that provides WebSocket functionality with support for self-signed certificates.
 * This class wraps around the native module and provides methods to connect, send messages,
 * and handle events in a WebSocket connection.
 */
class WebSocketSelfSigned {
  private eventEmitter: NativeEventEmitter;

  /**
   * Creates an instance of WebSocketSelfSigned.
   * Initializes the NativeEventEmitter for handling WebSocket events.
   */
  constructor() {
    this.eventEmitter = new NativeEventEmitter(WebsocketSelfSignedModule);
  }

  /**
   * Connects to the WebSocket server at the given URL.
   *
   * @param {string} url - The WebSocket server URL to connect to.
   * @returns {Promise<string>} - A promise that resolves when the connection is successful.
   */
  connect(url: string): Promise<string> {
    return WebsocketSelfSignedModule.connect(url);
  }

  /**
   * Sends a message through the WebSocket connection.
   *
   * @param {string} message - The message to be sent to the server.
   */
  send(message: string): void {
    WebsocketSelfSignedModule.send(message);
  }

  /**
   * Closes the WebSocket connection.
   */
  close(): void {
    WebsocketSelfSignedModule.close();
  }

  /**
   * Registers a callback to be invoked when the WebSocket connection is opened.
   *
   * @param {Function} callback - The callback function to be called on the 'open' event.
   * @returns {EmitterSubscription} - The subscription to the event.
   */
  onOpen(callback: () => void) {
    return this.eventEmitter.addListener(WebSocketEvent.OPEN, callback);
  }

  /**
   * Registers a callback to be invoked when a message is received from the server.
   *
   * @param {Function} callback - The callback function to be called on the 'message' event.
   * @returns {EmitterSubscription} - The subscription to the event.
   */
  onMessage(callback: (message: string) => void) {
    return this.eventEmitter.addListener(WebSocketEvent.MESSAGE, callback);
  }

  /**
   * Registers a callback to be invoked when the WebSocket connection is closed.
   *
   * @param {Function} callback - The callback function to be called on the 'close' event.
   * @returns {EmitterSubscription} - The subscription to the event.
   */
  onClose(callback: () => void) {
    return this.eventEmitter.addListener(WebSocketEvent.CLOSE, callback);
  }

  /**
   * Registers a callback to be invoked when an error occurs in the WebSocket connection.
   *
   * @param {Function} callback - The callback function to be called on the 'error' event.
   * @returns {EmitterSubscription} - The subscription to the event.
   */
  onError(callback: (error: string) => void) {
    return this.eventEmitter.addListener(WebSocketEvent.ERROR, callback);
  }

  /**
   * Removes all listeners for the specified WebSocket event.
   *
   * @param {WebSocketEvent} eventName - The event name for which to remove all listeners.
   */
  removeAllListeners(eventName: WebSocketEvent) {
    this.eventEmitter.removeAllListeners(eventName);
  }
}

export default WebSocketSelfSigned;
