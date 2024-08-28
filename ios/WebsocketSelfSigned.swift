import Foundation
import React

@objc(WebsocketSelfSigned)
class WebsocketSelfSigned: RCTEventEmitter {

    private var webSocketTask: URLSessionWebSocketTask?

    // Add requiresMainQueueSetup in order to prevent following warning
    // WARN  Module WssSelfSigned requires main queue setup since it overrides `init` but doesn't implement `requiresMainQueueSetup`. 
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

        listenForMessages()
        resolve("Connected!")
    }

    @objc
    func send(_ message: String) {
        let message = URLSessionWebSocketTask.Message.string(message)
        webSocketTask?.send(message) { error in
            if let error = error {
                self.sendEvent(withName: "onError", body: error.localizedDescription)
            }
        }
    }

    @objc
    func close() {
        webSocketTask?.cancel(with: .normalClosure, reason: nil)
        sendEvent(withName: "onClose", body: nil)
    }

    private func listenForMessages() {
        webSocketTask?.receive { [weak self] result in
            switch result {
            case .failure(let error):
                self?.sendEvent(withName: "onError", body: error.localizedDescription)
            case .success(let message):
                switch message {
                case .string(let text):
                    self?.sendEvent(withName: "onMessage", body: text)
                case .data(_):
                    // Handle data if necessary
                    break
                @unknown default:
                    break
                }
                self?.listenForMessages()
            }
        }
    }

    override func supportedEvents() -> [String]! {
        return ["onOpen", "onMessage", "onClose", "onError"]
    }
}

extension WebsocketSelfSigned: URLSessionDelegate {
    func urlSession(_ session: URLSession, didReceive challenge: URLAuthenticationChallenge, completionHandler: @escaping (URLSession.AuthChallengeDisposition, URLCredential?) -> Void) {
        // If serverTrust is available, create a URLCredential and use it
        if let serverTrust = challenge.protectionSpace.serverTrust {
            let credential = URLCredential(trust: serverTrust)
            // Bypass SSL certificate validation and accept any certificate
            completionHandler(.useCredential, credential)
        } else {
            // Perform default handling if serverTrust is not available
            completionHandler(.performDefaultHandling, nil)
        }
    }
}
