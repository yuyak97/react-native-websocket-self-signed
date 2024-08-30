import { NativeEventEmitter } from 'react-native';
import { WebSocketEvent } from '../enums/websocket-event.enum';
import WebSocketSelfSigned from '../models/WebSocketSelfSigned';
import WebSocketSelfSignedNativeModule from '../models/WebSocketSelfSignedNativeModule';

jest.mock('../models/WebSocketSelfSignedNativeModule', () => ({
  connect: jest.fn(() => Promise.resolve('connected')),
  send: jest.fn(),
  close: jest.fn(),
  addListener: jest.fn(),
  removeListeners: jest.fn(),
}));

describe('WebSocketSelfSigned', () => {
  let webSocket: WebSocketSelfSigned;
  let addListenerMock: jest.Mock;
  let removeAllListenersMock: jest.Mock;

  beforeEach(() => {
    // Mock the addListener and removeAllListeners methods of NativeEventEmitter
    addListenerMock = jest.fn();
    removeAllListenersMock = jest.fn();

    jest
      .spyOn(NativeEventEmitter.prototype, 'addListener')
      .mockImplementation(addListenerMock);
    jest
      .spyOn(NativeEventEmitter.prototype, 'removeAllListeners')
      .mockImplementation(removeAllListenersMock);

    // Initialize the WebSocketSelfSigned instance
    webSocket = new WebSocketSelfSigned();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should connect to WebSocket server', async () => {
    const result = await webSocket.connect('ws://example.com');
    expect(WebSocketSelfSignedNativeModule.connect).toHaveBeenCalledWith(
      'ws://example.com'
    );
    expect(result).toBe('connected');
  });

  it('should send a message', () => {
    const message = 'Hello, World!';
    webSocket.send(message);
    expect(WebSocketSelfSignedNativeModule.send).toHaveBeenCalledWith(message);
  });

  it('should close the WebSocket connection', () => {
    webSocket.close();
    expect(WebSocketSelfSignedNativeModule.close).toHaveBeenCalled();
  });

  it('should register an onOpen event listener', () => {
    const callback = jest.fn();
    webSocket.onOpen(callback);
    expect(addListenerMock).toHaveBeenCalledWith(WebSocketEvent.OPEN, callback);
  });

  it('should register an onMessage event listener', () => {
    const callback = jest.fn();
    webSocket.onMessage(callback);
    expect(addListenerMock).toHaveBeenCalledWith(
      WebSocketEvent.MESSAGE,
      callback
    );
  });

  it('should register an onClose event listener', () => {
    const callback = jest.fn();
    webSocket.onClose(callback);
    expect(addListenerMock).toHaveBeenCalledWith(
      WebSocketEvent.CLOSE,
      callback
    );
  });

  it('should register an onError event listener', () => {
    const callback = jest.fn();
    webSocket.onError(callback);
    expect(addListenerMock).toHaveBeenCalledWith(
      WebSocketEvent.ERROR,
      callback
    );
  });

  it('should remove all listeners for an event', () => {
    webSocket.removeAllListeners(WebSocketEvent.CLOSE);
    expect(removeAllListenersMock).toHaveBeenCalledWith(WebSocketEvent.CLOSE);
  });
});
