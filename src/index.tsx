import { NativeEventEmitter, type EventSubscription } from 'react-native';
import { WebsocketSelfSignedNativeModule } from './NativeWebsocketSelfSigned';

export enum WebSocketEvent {
  OPEN = 'onOpen',
  MESSAGE = 'onMessage',
  BINARY_MESSAGE = 'onBinaryMessage',
  CLOSE = 'onClose',
  ERROR = 'onError',
}

/**
 * WebSocketWithSelfSignedCert provides a wrapper around native WebSocket functionality
 * with support for handling multiple WebSocket connections and self-signed certificates.
 */
class WebSocketWithSelfSignedCert {
  private eventEmitter: NativeEventEmitter;
  private listeners: { [key in WebSocketEvent]?: EventSubscription } = {};
  private static instances: Map<string, WebSocketWithSelfSignedCert> =
    new Map();

  /**
   * Retrieves an instance of WebSocketWithSelfSignedCert for a given URL.
   * If an instance does not exist, a new one is created.
   *
   * @param url - The WebSocket server URL.
   * @returns The WebSocket instance associated with the given URL.
   */
  static getInstance(url: string): WebSocketWithSelfSignedCert {
    if (!this.instances.has(url)) {
      this.instances.set(url, new WebSocketWithSelfSignedCert(url));
    }
    return this.instances.get(url)!;
  }

  /**
   * Initializes the WebSocketWithSelfSignedCert instance and sets up the NativeEventEmitter.
   */
  private constructor(private url: string) {
    this.eventEmitter = new NativeEventEmitter(WebsocketSelfSignedNativeModule);
  }

  /**
   * Connects to the WebSocket server at the specified URL with optional headers.
   *
   * @param headers - Optional headers to include in the connection request.
   * @returns A promise that resolves when the connection is successful.
   */
  connect(headers?: { [key: string]: string }): Promise<string> {
    return WebsocketSelfSignedNativeModule.connect(this.url, headers ?? {});
  }

  /**
   * Sends a message through the WebSocket connection for the given URL.
   *
   * @param message - The message to be sent to the server.
   */
  send(message: string): void {
    WebsocketSelfSignedNativeModule.send(this.url, message);
  }

  /**
   * Sends binary data through the WebSocket connection for the given URL.
   *
   * @param dataBase64 - Base64-encoded binary data to send to the server.
   *
   * @remarks
   * The Base64 string provided here will be decoded into a byte array on the
   * native layer (iOS: using `Data(base64Encoded:)`) before being sent through
   * the WebSocket. This allows JavaScript to send binary payloads without
   * handling raw byte arrays directly.
   *
   * If sending fails (e.g., the WebSocket is not connected, the Base64 string is
   * invalid, or a native-layer error occurs), an `onError` event will be emitted.
   */
  sendBinaryBase64(dataBase64: string) {
    WebsocketSelfSignedNativeModule.sendBinaryBase64(this.url, dataBase64);
  }

  /**
   * Closes the WebSocket connection for the given URL and removes all event listeners.
   */
  close(): void {
    WebsocketSelfSignedNativeModule.close(this.url);
    this.removeAllListeners();
    WebSocketWithSelfSignedCert.instances.delete(this.url);
  }

  /**
   * Registers a callback to be invoked when the WebSocket connection is opened.
   *
   * @param callback - The callback function to be called on the 'open' event.
   */
  onOpen(callback: () => void): void {
    this.listeners[WebSocketEvent.OPEN] = this.eventEmitter.addListener(
      WebSocketEvent.OPEN,
      (event) => {
        if (hasUrlInEvent(event) && event.url === this.url) {
          callback();
        }
      }
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
      (event) => {
        if (hasTextMessageInEvent(event) && event.url === this.url) {
          callback(event.message);
        }
      }
    );
  }

  /**
   * Registers a callback to be invoked when binary data is received from the server.
   *
   * @param callback - The callback function to be called on the 'binaryMessage' event. data is base64 string
   */
  onBinaryMessage(callback: (data: string) => void): void {
    this.listeners[WebSocketEvent.BINARY_MESSAGE] =
      this.eventEmitter.addListener(WebSocketEvent.BINARY_MESSAGE, (event) => {
        if (hasTextMessageInEvent(event) && event.url === this.url) {
          callback(event.message);
        }
      });
  }

  /**
   * Registers a callback to be invoked when the WebSocket connection is closed.
   *
   * @param callback - The callback function to be called on the 'close' event.
   */
  onClose(callback: () => void): void {
    this.listeners[WebSocketEvent.CLOSE] = this.eventEmitter.addListener(
      WebSocketEvent.CLOSE,
      (event) => {
        if (hasUrlInEvent(event) && event.url === this.url) {
          callback();
        }
      }
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
      (event) => {
        if (hasErrorInEvent(event) && event.url === this.url) {
          callback(event.error);
        }
      }
    );
  }

  /**
   * Removes all registered event listeners for this instance.
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

type UnknownRecord = Record<string, unknown>;

function isRecord(v: unknown): v is UnknownRecord {
  return typeof v === 'object' && v !== null;
}

export function hasUrlInEvent(
  v: unknown
): v is UnknownRecord & { url: string } {
  return isRecord(v) && typeof v.url === 'string';
}

export function hasTextMessageInEvent(
  v: unknown
): v is UnknownRecord & { url: string; message: string } {
  return hasUrlInEvent(v) && typeof v.message === 'string';
}

export function hasErrorInEvent(
  v: unknown
): v is UnknownRecord & { url: string; error: string } {
  return hasUrlInEvent(v) && typeof v.error === 'string';
}
