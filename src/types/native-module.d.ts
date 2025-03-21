/**
 * The expected interface of the WebSocketWithSelfSignedCert native module.
 */
export interface WebSocketWithSelfSignedCertNativeModuleType {
  /**
   * Connects to the specified WebSocket URL with optional headers.
   *
   * @param url - The WebSocket server URL to connect to.
   * @param headers - Optional headers to include in the connection request.
   * @returns A promise that resolves when the connection is successful.
   */
  connect(url: string, headers?: { [key: string]: string }): Promise<string>;

  /**
   * Sends a message through the WebSocket connection for the given URL.
   *
   * @param url - The WebSocket server URL associated with the connection.
   * @param message - The message to send.
   */
  send(url: string, message: string): void;

  /**
   * Closes the WebSocket connection for the given URL.
   *
   * @param url - The WebSocket server URL associated with the connection.
   */
  close(url: string): void;
}
