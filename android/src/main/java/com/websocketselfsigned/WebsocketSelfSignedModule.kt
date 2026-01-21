package com.websocketwithselfsignedcert

import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import okhttp3.*
import okio.ByteString
import java.security.cert.X509Certificate
import javax.net.ssl.*
import android.util.Base64
import okio.ByteString.Companion.toByteString

class WebSocketWithSelfSignedCertModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    // Map of URL -> WebSocket so we can handle multiple connections simultaneously
    private val webSockets = mutableMapOf<String, WebSocket>()

    // Store the Promise for each connection (to resolve/reject after onOpen/onFailure)
    private val connectionPromises = mutableMapOf<String, Promise>()

    // A single OkHttpClient that trusts all certificates
    private val client: OkHttpClient

    // Required for event emitter support
    private var listenerCount = 0

    init {
        // Create a TrustManager that trusts all certificates
        val trustAllCerts = arrayOf<TrustManager>(object : X509TrustManager {
            override fun checkClientTrusted(chain: Array<out X509Certificate>?, authType: String?) {}
            override fun checkServerTrusted(chain: Array<out X509Certificate>?, authType: String?) {}
            override fun getAcceptedIssuers(): Array<X509Certificate> = arrayOf()
        })

        // Install the all-trusting trust manager
        val sslContext = SSLContext.getInstance("SSL")
        sslContext.init(null, trustAllCerts, java.security.SecureRandom())

        // Build an OkHttpClient that uses our custom SSL context
        val builder = OkHttpClient.Builder()
            .sslSocketFactory(sslContext.socketFactory, trustAllCerts[0] as X509TrustManager)
            .hostnameVerifier { _, _ -> true }

        client = builder.build()
    }

    override fun getName(): String {
        return "WebSocketWithSelfSignedCert"
    }

    /**
     * Connect to the specified WebSocket URL with optional headers.
     * Example from JS:
     *   WebSocketWithSelfSignedCert.connect("wss://your-url", { Authorization: "Bearer token", "Custom-Header": "Value" })
     */
    @ReactMethod
    fun connect(url: String, headers: ReadableMap, promise: Promise) {
        // If there's already a websocket for this URL, reject immediately
        if (webSockets.containsKey(url)) {
            promise.reject("Already Connected", "A WebSocket is already connected to this URL.")
            return
        }

        // Build the request with optional headers
        val requestBuilder = Request.Builder().url(url)
        val iterator = headers.keySetIterator()
        while (iterator.hasNextKey()) {
            val key = iterator.nextKey()
            val value = headers.getString(key)
            if (value != null) {
                requestBuilder.addHeader(key, value)
            }
        }
        val request = requestBuilder.build()

        // Create a new WebSocket and store the promise (so we can resolve it in onOpen)
        connectionPromises[url] = promise
        val webSocket = client.newWebSocket(request, object : WebSocketListener() {

            override fun onOpen(ws: WebSocket, response: Response) {
                // Store the WebSocket in our map
                webSockets[url] = ws

                // Resolve the promise now that the connection is open
                connectionPromises[url]?.resolve("Connected to $url")
                connectionPromises.remove(url)

                // Also send an "onOpen" event to JS with the URL
                sendEvent("onOpen", makeMap("url", url))
            }

            override fun onMessage(ws: WebSocket, text: String) {
                // Send an "onMessage" event to JS with the URL and message
                val params = Arguments.createMap()
                params.putString("url", url)
                params.putString("message", text)
                sendEvent("onMessage", params)
            }

            override fun onMessage(ws: WebSocket, bytes: ByteString) {
                // For binary data, send base64-encoded
                val base64Data = bytes.base64()
                val params = Arguments.createMap()
                params.putString("url", url)
                params.putString("message", base64Data)
                sendEvent("onBinaryMessage", params)
            }

            override fun onClosing(ws: WebSocket, code: Int, reason: String) {
                // Notify JS that the socket is closing
                val params = Arguments.createMap()
                params.putString("url", url)
                params.putString("reason", reason)
                sendEvent("onClose", params)

                // We can close it immediately here
                ws.close(1000, null)
            }

            override fun onFailure(ws: WebSocket, t: Throwable, response: Response?) {
                // If the onOpen hasn't happened yet, reject the promise
                connectionPromises[url]?.reject("WebSocket Error", t)
                connectionPromises.remove(url)

                // Send an "onError" event to JS
                val params = Arguments.createMap()
                params.putString("url", url)
                params.putString("error", t.message ?: "Unknown error")
                sendEvent("onError", params)

                // Remove this socket from the map
                webSockets.remove(url)
            }
        })
    }

    /**
     * Send a text message to the specified WebSocket.
     * Example from JS:
     *   WebSocketWithSelfSignedCert.send("wss://your-url", "Hello!")
     */
    @ReactMethod
    fun send(url: String, message: String) {
        val ws = webSockets[url]
        if (ws == null) {
            val params = Arguments.createMap()
            params.putString("url", url)
            params.putString("error", "WebSocket is not connected")
            sendEvent("onError", params)
            return
        }
        ws.send(message)
    }

    /**
     * Send Base64-encoded binary data to the specified WebSocket.
     * Example from JS:
     *   WebSocketWithSelfSignedCert.sendBinaryBase64("wss://your-url", base64String)
     */
    @ReactMethod
    fun sendBinaryBase64(url: String, base64String: String) {
        val ws = webSockets[url]
        if (ws == null) {
            val params = Arguments.createMap()
            params.putString("url", url)
            params.putString("error", "WebSocket is not connected")
            sendEvent("onError", params)
            return
        }
    
        try {
            // Base64 -> ByteArray
            val bytes = Base64.decode(base64String, Base64.DEFAULT)
            // ByteArray -> ByteString
            val byteString = bytes.toByteString(0, bytes.size)        
            // Send binary
            ws.send(byteString)
        } catch (e: IllegalArgumentException) {
            val params = Arguments.createMap()
            params.putString("url", url)
            params.putString("error", "Invalid Base64 binary string")
            sendEvent("onError", params)
        } catch (e: Exception) {
            val params = Arguments.createMap()
            params.putString("url", url)
            params.putString("error", e.message ?: "Failed to send binary")
            sendEvent("onError", params)
        }
    }


    /**
     * Close the WebSocket connection for the specified URL.
     * Example from JS:
     *   WebSocketWithSelfSignedCert.close("wss://your-url")
     */
    @ReactMethod
    fun close(url: String) {
        val ws = webSockets[url]
        if (ws == null) {
            val params = Arguments.createMap()
            params.putString("url", url)
            params.putString("error", "No active WebSocket for this URL")
            sendEvent("onError", params)
            return
        }

        // Normal closure
        ws.close(1000, "Normal closure")

        // Remove from map
        webSockets.remove(url)

        // Send onClose event
        val params = Arguments.createMap()
        params.putString("url", url)
        sendEvent("onClose", params)
    }

    /**
     * Event Emitter helpers
     */
     
    private fun sendEvent(eventName: String, params: Any?) {
        reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, params)
    }

    // Helper to build a React Native readable map
    private fun makeMap(key: String, value: String): WritableMap {
        val map = Arguments.createMap()
        map.putString(key, value)
        return map
    }

    // For NativeEventEmitter in React Native
    @ReactMethod
    fun addListener(eventName: String) {
        listenerCount += 1
    }

    @ReactMethod
    fun removeListeners(count: Int) {
        listenerCount -= count
        if (listenerCount < 0) {
            listenerCount = 0
        }
    }
}
