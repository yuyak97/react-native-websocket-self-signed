/**
 * The expected interface of the WebSocketWithSelfSignedCert native module.
 */
export interface WebSocketWithSelfSignedCertNativeModuleType {
  connect(url: string): Promise<string>;
  send(message: string): void;
  close(): void;
}
