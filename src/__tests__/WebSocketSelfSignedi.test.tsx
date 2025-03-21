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
  const testUrl = 'ws://example.com';

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

    // Use getInstance to obtain the WebSocket instance
    webSocket = WebSocketWithSelfSignedCert.getInstance(testUrl);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should connect to WebSocket server', async () => {
    const result = await webSocket.connect();
    expect(
      WebSocketWithSelfSignedCertNativeModule.connect
    ).toHaveBeenCalledWith(testUrl, {});
    expect(result).toBe('connected');
  });

  it('should connect to WebSocket server with header', async () => {
    const header = { Authorization: 'Bearer your_token' };
    const result = await webSocket.connect(header);
    expect(
      WebSocketWithSelfSignedCertNativeModule.connect
    ).toHaveBeenCalledWith(testUrl, header);
    expect(result).toBe('connected');
  });

  it('should send a message', () => {
    const message = 'Hello, World!';
    webSocket.send(message);
    expect(WebSocketWithSelfSignedCertNativeModule.send).toHaveBeenCalledWith(
      testUrl,
      message
    );
  });

  it('should close the WebSocket connection and remove all listeners', () => {
    webSocket.onOpen(jest.fn());
    webSocket.onMessage(jest.fn());
    webSocket.onClose(jest.fn());
    webSocket.onError(jest.fn());
    webSocket.onBinaryMessage(jest.fn());

    webSocket.close();
    expect(WebSocketWithSelfSignedCertNativeModule.close).toHaveBeenCalledWith(
      testUrl
    );
    expect(listenerMock.remove).toHaveBeenCalledTimes(5);
  });

  it('should register an onOpen event listener', () => {
    const callback = jest.fn();
    webSocket.onOpen(callback);
    expect(addListenerMock).toHaveBeenCalledWith(
      WebSocketEvent.OPEN,
      expect.any(Function)
    );
  });

  it('should register an onMessage event listener', () => {
    const callback = jest.fn();
    webSocket.onMessage(callback);
    expect(addListenerMock).toHaveBeenCalledWith(
      WebSocketEvent.MESSAGE,
      expect.any(Function)
    );
  });

  it('should register an onBinaryMessage event listener', () => {
    const callback = jest.fn();
    webSocket.onBinaryMessage(callback);
    expect(addListenerMock).toHaveBeenCalledWith(
      WebSocketEvent.BINARY_MESSAGE,
      expect.any(Function)
    );
  });

  it('should register an onClose event listener', () => {
    const callback = jest.fn();
    webSocket.onClose(callback);
    expect(addListenerMock).toHaveBeenCalledWith(
      WebSocketEvent.CLOSE,
      expect.any(Function)
    );
  });

  it('should register an onError event listener', () => {
    const callback = jest.fn();
    webSocket.onError(callback);
    expect(addListenerMock).toHaveBeenCalledWith(
      WebSocketEvent.ERROR,
      expect.any(Function)
    );
  });

  it('should remove the onOpen event listener', () => {
    webSocket.onOpen(jest.fn());
    webSocket.removeOnOpenListener();
    expect(listenerMock.remove).toHaveBeenCalled();
  });

  it('should remove the onMessage event listener', () => {
    webSocket.onMessage(jest.fn());
    webSocket.removeOnMessageListener();
    expect(listenerMock.remove).toHaveBeenCalled();
  });

  it('should remove the onBinaryMessage event listener', () => {
    webSocket.onBinaryMessage(jest.fn());
    webSocket.removeOnBinaryMessageListener();
    expect(listenerMock.remove).toHaveBeenCalled();
  });

  it('should remove the onClose event listener', () => {
    webSocket.onClose(jest.fn());
    webSocket.removeOnCloseListener();
    expect(listenerMock.remove).toHaveBeenCalled();
  });

  it('should remove the onError event listener', () => {
    webSocket.onError(jest.fn());
    webSocket.removeOnErrorListener();
    expect(listenerMock.remove).toHaveBeenCalled();
  });
});
