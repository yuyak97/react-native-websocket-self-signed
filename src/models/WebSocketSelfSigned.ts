import { NativeEventEmitter } from 'react-native';
import { WebSocketEvent } from '../enums/websocket-event.enum';
import WebSocketSelfSignedNativeModule from './WebSocketSelfSignedNativeModule';

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
    this.eventEmitter = new NativeEventEmitter(WebSocketSelfSignedNativeModule);
  }

  /**
   * Connects to the WebSocket server at the given URL.
   *
   * @param {string} url - The WebSocket server URL to connect to.
   * @returns {Promise<string>} - A promise that resolves when the connection is successful.
   */
  connect(url: string): Promise<string> {
    return WebSocketSelfSignedNativeModule.connect(url);
  }

  /**
   * Sends a message through the WebSocket connection.
   *
   * @param {string} message - The message to be sent to the server.
   */
  send(message: string): void {
    WebSocketSelfSignedNativeModule.send(message);
  }

  /**
   * Closes the WebSocket connection.
   */
  close(): void {
    WebSocketSelfSignedNativeModule.close();
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
