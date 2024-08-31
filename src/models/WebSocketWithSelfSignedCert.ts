import { NativeEventEmitter, type EmitterSubscription } from 'react-native';
import { WebSocketEvent } from '../enums/websocket-event.enum';
import WebSocketWithSelfSignedCertNativeModule from './WebSocketWithSelfSignedCertNativeModule';

/**
 * WebSocketWithSelfSignedCert provides a wrapper around native WebSocket functionality
 * with support for handling WebSocket events and managing self-signed certificates.
 */
class WebSocketWithSelfSignedCert {
  private eventEmitter: NativeEventEmitter;
  private listeners: { [key in WebSocketEvent]?: EmitterSubscription } = {};

  /**
   * Initializes the WebSocketWithSelfSignedCert instance and sets up the NativeEventEmitter.
   */
  constructor() {
    this.eventEmitter = new NativeEventEmitter(
      WebSocketWithSelfSignedCertNativeModule
    );
  }

  /**
   * Connects to the WebSocket server at the given URL.
   *
   * @param url - The WebSocket server URL to connect to.
   * @returns A promise that resolves when the connection is successful.
   */
  connect(url: string): Promise<string> {
    return WebSocketWithSelfSignedCertNativeModule.connect(url);
  }

  /**
   * Sends a message through the WebSocket connection.
   *
   * @param message - The message to be sent to the server.
   */
  send(message: string): void {
    WebSocketWithSelfSignedCertNativeModule.send(message);
  }

  /**
   * Closes the WebSocket connection and removes all event listeners.
   */
  close(): void {
    WebSocketWithSelfSignedCertNativeModule.close();
    this.removeAllListeners();
  }

  /**
   * Registers a callback to be invoked when the WebSocket connection is opened.
   *
   * @param callback - The callback function to be called on the 'open' event.
   */
  onOpen(callback: () => void): void {
    this.listeners[WebSocketEvent.OPEN] = this.eventEmitter.addListener(
      WebSocketEvent.OPEN,
      callback
    );
  }

  /**
   * Registers a callback to be invoked when a message is received from the server.
   *
   * @param callback - The callback function to be called on the 'message' event.
   */
  onMessage(callback: (message: string) => void): void {
    this.listeners[WebSocketEvent.MESSAGE] = this.eventEmitter.addListener(
      WebSocketEvent.MESSAGE,
      callback
    );
  }

  /**
   * Registers a callback to be invoked when binary data is received from the server.
   *
   * @param callback - The callback function to be called on the 'binaryMessage' event.
   */
  onBinaryMessage(callback: (data: Uint8Array) => void): void {
    this.listeners[WebSocketEvent.BINARY_MESSAGE] =
      this.eventEmitter.addListener(WebSocketEvent.BINARY_MESSAGE, callback);
  }

  /**
   * Registers a callback to be invoked when the WebSocket connection is closed.
   *
   * @param callback - The callback function to be called on the 'close' event.
   */
  onClose(callback: () => void): void {
    this.listeners[WebSocketEvent.CLOSE] = this.eventEmitter.addListener(
      WebSocketEvent.CLOSE,
      callback
    );
  }

  /**
   * Registers a callback to be invoked when an error occurs in the WebSocket connection.
   *
   * @param callback - The callback function to be called on the 'error' event.
   */
  onError(callback: (error: string) => void): void {
    this.listeners[WebSocketEvent.ERROR] = this.eventEmitter.addListener(
      WebSocketEvent.ERROR,
      callback
    );
  }

  /**
   * Removes all registered event listeners.
   * This is automatically called when the connection is closed.
   */
  private removeAllListeners(): void {
    Object.keys(this.listeners).forEach((key) => {
      const event = key as WebSocketEvent;
      this.listeners[event]?.remove();
      delete this.listeners[event];
    });
  }

  /**
   * Removes the listener for the 'open' event.
   */
  removeOnOpenListener(): void {
    this.listeners[WebSocketEvent.OPEN]?.remove();
    delete this.listeners[WebSocketEvent.OPEN];
  }

  /**
   * Removes the listener for the 'message' event.
   */
  removeOnMessageListener(): void {
    this.listeners[WebSocketEvent.MESSAGE]?.remove();
    delete this.listeners[WebSocketEvent.MESSAGE];
  }

  /**
   * Removes the listener for the 'binaryMessage' event.
   */
  removeOnBinaryMessageListener(): void {
    this.listeners[WebSocketEvent.BINARY_MESSAGE]?.remove();
    delete this.listeners[WebSocketEvent.BINARY_MESSAGE];
  }

  /**
   * Removes the listener for the 'close' event.
   */
  removeOnCloseListener(): void {
    this.listeners[WebSocketEvent.CLOSE]?.remove();
    delete this.listeners[WebSocketEvent.CLOSE];
  }

  /**
   * Removes the listener for the 'error' event.
   */
  removeOnErrorListener(): void {
    this.listeners[WebSocketEvent.ERROR]?.remove();
    delete this.listeners[WebSocketEvent.ERROR];
  }
}

export default WebSocketWithSelfSignedCert;
