import Foundation
import React

@objc(WebSocketWithSelfSignedCert)
class WebSocketWithSelfSignedCert: RCTEventEmitter {

    private var webSocketTask: URLSessionWebSocketTask?
    private var isConnected: Bool = false

    // Add requiresMainQueueSetup in order to prevent the following warning:
    // WARN  Module WebSocketWithSelfSignedCert requires main queue setup since it overrides `init` but doesn't implement `requiresMainQueueSetup`.
    // In a future release React Native will default to initializing all native modules on a background thread unless explicitly opted-out of.
    @objc
    override static func requiresMainQueueSetup() -> Bool {
        return true
    }

    @objc
    func connect(_ url: String, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        guard let nsUrl = URL(string: url) else {
            reject("Invalid URL", "The provided URL is not valid", nil)
            return
        }

        let sessionConfig = URLSessionConfiguration.default
        let session = URLSession(configuration: sessionConfig, delegate: self, delegateQueue: nil)

        webSocketTask = session.webSocketTask(with: nsUrl)
        webSocketTask?.resume()

        // Set the connection state to true
        isConnected = true

        // Start listening for messages
        listenForMessages()

        // Resolve the promise and emit the onOpen event
        resolve("Connected!")
        self.sendEvent(withName: "onOpen", body: nil)
    }

    @objc
    func send(_ message: String) {
        guard isConnected, let webSocketTask = webSocketTask else {
            self.sendEvent(withName: "onError", body: "WebSocket is not connected")
            return
        }
        let message = URLSessionWebSocketTask.Message.string(message)
        webSocketTask.send(message) { error in
            if let error = error {
                self.sendEvent(withName: "onError", body: error.localizedDescription)
            }
        }
    }

    @objc
    func close() {
        webSocketTask?.cancel(with: .normalClosure, reason: nil)
        isConnected = false
        sendEvent(withName: "onClose", body: nil)
    }

    private func listenForMessages() {
        webSocketTask?.receive { [weak self] result in
            guard let self = self else { return }

            switch result {
            case .failure(let error):
                self.isConnected = false
                self.sendEvent(withName: "onError", body: error.localizedDescription)
            case .success(let message):
                switch message {
                case .string(let text):
                    self.sendEvent(withName: "onMessage", body: text)
                case .data(let data):
                    self.sendEvent(withName: "onBinaryMessage", body: data.base64EncodedString())
                @unknown default:
                    break
                }
                // Continue listening for the next message
                self.listenForMessages()
            }
        }
    }

    override func supportedEvents() -> [String]! {
        return ["onOpen", "onMessage", "onClose", "onError", "onBinaryMessage"]
    }
}

extension WebSocketWithSelfSignedCert: URLSessionDelegate {
    func urlSession(_ session: URLSession, didReceive challenge: URLAuthenticationChallenge, completionHandler: @escaping (URLSession.AuthChallengeDisposition, URLCredential?) -> Void) {
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
