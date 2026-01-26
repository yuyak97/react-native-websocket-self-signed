import Foundation

@objc(WebSocketWithSelfSignedCertManager)
public final class WebSocketWithSelfSignedCertManager: NSObject, URLSessionDelegate {

  private var webSocketTasks: [String: URLSessionWebSocketTask] = [:]
  private var isConnectedMap: [String: Bool] = [:]

  private var onOpen: ((NSString) -> Void)?
  private var onMessage: ((NSString, NSString) -> Void)?
  private var onBinaryMessage: ((NSString, NSString) -> Void)?
  private var onClose: ((NSString) -> Void)?
  private var onError: ((NSString, NSString) -> Void)?

  @objc(setCallbacksWithOnOpen:onMessage:onBinaryMessage:onClose:onError:)
  public func setCallbacks(
    onOpen: @escaping (NSString) -> Void,
    onMessage: @escaping (NSString, NSString) -> Void,
    onBinaryMessage: @escaping (NSString, NSString) -> Void,
    onClose: @escaping (NSString) -> Void,
    onError: @escaping (NSString, NSString) -> Void
  ) {
    self.onOpen = onOpen
    self.onMessage = onMessage
    self.onBinaryMessage = onBinaryMessage
    self.onClose = onClose
    self.onError = onError
  }

  @objc(connect:headers:completion:)
  public func connect(
    _ url: NSString,
    headers: NSDictionary?,
    completion: @escaping (NSString?, NSError?) -> Void
  ) {
    guard let nsUrl = URL(string: url as String) else {
      completion(nil, NSError(domain: "InvalidURL", code: 1))
      return
    }

    let urlKey = url as String
    if webSocketTasks[urlKey] != nil {
      completion(nil, NSError(domain: "AlreadyConnected", code: 2))
      return
    }

    var request = URLRequest(url: nsUrl)
    if let headers = headers as? [String: String] {
      headers.forEach { request.addValue($0.value, forHTTPHeaderField: $0.key) }
    }

    let session = URLSession(configuration: .default, delegate: self, delegateQueue: nil)
    let webSocketTask = session.webSocketTask(with: request)
    webSocketTask.resume()

    webSocketTasks[urlKey] = webSocketTask
    isConnectedMap[urlKey] = true

    listenForMessages(url: urlKey)

    onOpen?(url)
    completion("Connected to \(url)!" as NSString, nil)
  }

  @objc(send:message:)
  public func send(_ url: NSString, message: NSString) {
    let key = url as String
    guard let task = webSocketTasks[key], isConnectedMap[key] == true else {
      onError?(url, "WebSocket is not connected")
      return
    }
    task.send(.string(message as String)) { [weak self] error in
      if let error = error {
        self?.onError?(url, error.localizedDescription as NSString)
      }
    }
  }

  @objc(sendBinaryBase64:base64String:)
  public func sendBinaryBase64(_ url: NSString, base64String: NSString) {
    let key = url as String
    guard let task = webSocketTasks[key], isConnectedMap[key] == true else {
      onError?(url, "WebSocket is not connected")
      return
    }
    guard let data = Data(base64Encoded: base64String as String) else {
      onError?(url, "Invalid Base64 binary string")
      return
    }
    task.send(.data(data)) { [weak self] error in
      if let error = error {
        self?.onError?(url, error.localizedDescription as NSString)
      }
    }
  }

  @objc(close:)
  public func close(_ url: NSString) {
    let key = url as String
    guard let task = webSocketTasks[key] else {
      onError?(url, "No active WebSocket for this URL")
      return
    }
    task.cancel(with: .normalClosure, reason: nil)
    webSocketTasks.removeValue(forKey: key)
    isConnectedMap.removeValue(forKey: key)
    onClose?(url)
  }

  private func listenForMessages(url: String) {
    guard let webSocketTask = webSocketTasks[url] else { return }
    webSocketTask.receive { [weak self] result in
      guard let self = self else { return }

      switch result {
      case .failure(let error):
        self.isConnectedMap[url] = false
        self.onError?(url as NSString, error.localizedDescription as NSString)

      case .success(let message):
        switch message {
        case .string(let text):
          self.onMessage?(url as NSString, text as NSString)
        case .data(let data):
          self.onBinaryMessage?(url as NSString, data.base64EncodedString() as NSString)
        @unknown default:
          break
        }
        self.listenForMessages(url: url)
      }
    }
  }

  public func urlSession(
    _ session: URLSession,
    didReceive challenge: URLAuthenticationChallenge,
    completionHandler: @escaping (URLSession.AuthChallengeDisposition, URLCredential?) -> Void
  ) {
    // Bypass SSL certificate validation and accept any certificate
    if let serverTrust = challenge.protectionSpace.serverTrust {
      let credential = URLCredential(trust: serverTrust)
      completionHandler(.useCredential, credential)
    } else {
      // Perform default handling if serverTrust is not available
      completionHandler(.performDefaultHandling, nil)
    }
  }
}
