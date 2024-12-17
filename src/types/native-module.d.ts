/**
 * The expected interface of the WebSocketWithSelfSignedCert native module.
 */
export interface WebSocketWithSelfSignedCertNativeModuleType {
  connect(url: string, headers?: { [key: string]: string }): Promise<string>;
  send(message: string): void;
  close(): void;
}
