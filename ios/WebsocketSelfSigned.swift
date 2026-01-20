import Foundation
import React

@objc(WebSocketWithSelfSignedCert)
class WebSocketWithSelfSignedCert: RCTEventEmitter {

    private var webSocketTasks: [String: URLSessionWebSocketTask] = [:]
    private var isConnectedMap: [String: Bool] = [:]

    // Add requiresMainQueueSetup in order to prevent the following warning:
    // WARN  Module WebSocketWithSelfSignedCert requires main queue setup since it overrides `init` but doesn't implement `requiresMainQueueSetup`.
    // In a future release React Native will default to initializing all native modules on a background thread unless explicitly opted-out of.
    @objc
    override static func requiresMainQueueSetup() -> Bool {
        return true
    }

    @objc
    func connect(_ url: String,
                 headers: [String: String]?,
                 resolver resolve: @escaping RCTPromiseResolveBlock,
                 rejecter reject: @escaping RCTPromiseRejectBlock) {
        guard let nsUrl = URL(string: url) else {
            reject("Invalid URL", "The provided URL is not valid", nil)
            return
        }

        if webSocketTasks[url] != nil {
            reject("Already Connected", "A WebSocket is already connected to this URL", nil)
            return
        }

        var request = URLRequest(url: nsUrl)
        if let headers = headers {
            for (key, value) in headers {
                request.addValue(value, forHTTPHeaderField: key)
            }
        }

        let sessionConfig = URLSessionConfiguration.default
        let session = URLSession(configuration: sessionConfig, delegate: self, delegateQueue: nil)

        let webSocketTask = session.webSocketTask(with: request)
        webSocketTask.resume()

        webSocketTasks[url] = webSocketTask
        isConnectedMap[url] = true

        listenForMessages(url: url)

        resolve("Connected to \(url)!")
        self.sendEvent(withName: "onOpen", body: ["url": url])
    }

    @objc
    func send(_ url: String, message: String) {
        guard let webSocketTask = webSocketTasks[url], isConnectedMap[url] == true else {
            self.sendEvent(withName: "onError", body: ["url": url, "error": "WebSocket is not connected"])
            return
        }

        let message = URLSessionWebSocketTask.Message.string(message)
        webSocketTask.send(message) { error in
            if let error = error {
                self.sendEvent(withName: "onError", body: ["url": url, "error": error.localizedDescription])
            }
        }
    }

    @objc
    func sendBinaryBase64(_ url: String, base64String: String) {
        guard let webSocketTask = webSocketTasks[url], isConnectedMap[url] == true else {
            self.sendEvent(withName: "onError", body: ["url": url, "error": "WebSocket is not connected"])
            return
        }
    
        guard let data = Data(base64Encoded: base64String) else {
            self.sendEvent(withName: "onError", body: [
                "url": url,
                "error": "Invalid Base64 binary string"
            ])
            return
        }
    
        let message = URLSessionWebSocketTask.Message.data(data)
        webSocketTask.send(message) { [weak self] error in
            guard let self = self else { return }
            if let error = error {
                self.sendEvent(withName: "onError", body: [
                    "url": url,
                    "error": error.localizedDescription
                ])
            }
        }
    }


    @objc
    func close(_ url: String) {
        guard let webSocketTask = webSocketTasks[url] else {
            self.sendEvent(withName: "onError", body: ["url": url, "error": "No active WebSocket for this URL"])
            return
        }

        webSocketTask.cancel(with: .normalClosure, reason: nil)
        webSocketTasks.removeValue(forKey: url)
        isConnectedMap.removeValue(forKey: url)

        DispatchQueue.main.async {
            self.sendEvent(withName: "onClose", body: ["url": url])
        }
    }

    private func listenForMessages(url: String) {
        guard let webSocketTask = webSocketTasks[url] else { return }

        webSocketTask.receive { [weak self] result in
            guard let self = self else { return }

            switch result {
            case .failure(let error):
                self.isConnectedMap[url] = false
                DispatchQueue.main.async {
                    self.sendEvent(withName: "onError", body: ["url": url, "error": error.localizedDescription])
                }

            case .success(let message):
                DispatchQueue.main.async {
                    switch message {
                    case .string(let text):
                        self.sendEvent(withName: "onMessage", body: ["url": url, "message": text])
                    case .data(let data):
                        self.sendEvent(withName: "onBinaryMessage", body: ["url": url, "message": data.base64EncodedString()])
                    @unknown default:
                        break
                    }
                }

                self.listenForMessages(url: url)
            }
        }
    }

    override func supportedEvents() -> [String]! {
        return ["onOpen", "onMessage", "onClose", "onError", "onBinaryMessage"]
    }
}

extension WebSocketWithSelfSignedCert: URLSessionDelegate {
    func urlSession(_ session: URLSession,
                    didReceive challenge: URLAuthenticationChallenge,
                    completionHandler: @escaping (URLSession.AuthChallengeDisposition, URLCredential?) -> Void) {
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
