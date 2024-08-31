import { NativeEventEmitter } from 'react-native';
import { WebSocketEvent } from '../enums/websocket-event.enum';
import WebSocketWithSelfSignedCert from '../models/WebSocketWithSelfSignedCert';
import WebSocketWithSelfSignedCertNativeModule from '../models/WebSocketWithSelfSignedCertNativeModule';

jest.mock('../models/WebSocketWithSelfSignedCertNativeModule', () => ({
  connect: jest.fn(() => Promise.resolve('connected')),
  send: jest.fn(),
  close: jest.fn(),
  addListener: jest.fn(),
  removeListeners: jest.fn(),
}));

describe('WebSocketWithSelfSignedCert', () => {
  let webSocket: WebSocketWithSelfSignedCert;
  let addListenerMock: jest.Mock;
  let listenerMock: { remove: jest.Mock };

  beforeEach(() => {
    // Mock the addListener method of NativeEventEmitter
    addListenerMock = jest.fn();
    listenerMock = { remove: jest.fn() };

    jest
      .spyOn(NativeEventEmitter.prototype, 'addListener')
      .mockImplementation((event, callback) => {
        addListenerMock(event, callback);
        return listenerMock as any;
      });

    // Initialize the WebSocketWithSelfSignedCert instance
    webSocket = new WebSocketWithSelfSignedCert();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should connect to WebSocket server', async () => {
    const result = await webSocket.connect('ws://example.com');
    expect(
      WebSocketWithSelfSignedCertNativeModule.connect
    ).toHaveBeenCalledWith('ws://example.com');
    expect(result).toBe('connected');
  });

  it('should send a message', () => {
    const message = 'Hello, World!';
    webSocket.send(message);
    expect(WebSocketWithSelfSignedCertNativeModule.send).toHaveBeenCalledWith(
      message
    );
  });

  it('should close the WebSocket connection and remove all listeners', () => {
    webSocket.onOpen(jest.fn());
    webSocket.onMessage(jest.fn());
    webSocket.onClose(jest.fn());
    webSocket.onError(jest.fn());

    webSocket.close();
    expect(WebSocketWithSelfSignedCertNativeModule.close).toHaveBeenCalled();

    expect(listenerMock.remove).toHaveBeenCalledTimes(4);
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

  it('should remove the onOpen event listener', () => {
    webSocket.onOpen(jest.fn()); // Ensure the listener is added
    webSocket.removeOnOpenListener();
    expect(listenerMock.remove).toHaveBeenCalled();
  });

  it('should remove the onMessage event listener', () => {
    webSocket.onMessage(jest.fn()); // Ensure the listener is added
    webSocket.removeOnMessageListener();
    expect(listenerMock.remove).toHaveBeenCalled();
  });

  it('should remove the onClose event listener', () => {
    webSocket.onClose(jest.fn()); // Ensure the listener is added
    webSocket.removeOnCloseListener();
    expect(listenerMock.remove).toHaveBeenCalled();
  });

  it('should remove the onError event listener', () => {
    webSocket.onError(jest.fn()); // Ensure the listener is added
    webSocket.removeOnErrorListener();
    expect(listenerMock.remove).toHaveBeenCalled();
  });
});
