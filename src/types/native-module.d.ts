/**
 * The expected interface of the WssSelfSigned native module.
 */
export interface WebSocketSelfSignedModule {
  connect(url: string): Promise<string>;
  send(message: string): void;
  close(): void;
}
