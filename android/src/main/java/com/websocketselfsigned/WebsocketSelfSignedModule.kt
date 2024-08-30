package com.websocketselfsigned

import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import okhttp3.*
import java.security.cert.X509Certificate
import javax.net.ssl.*

class WebSocketSelfSignedModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    private var webSocket: WebSocket? = null
    private val client: OkHttpClient
    private var listenerCount = 0

    init {
        val trustAllCerts = arrayOf<TrustManager>(object : X509TrustManager {
            override fun checkClientTrusted(chain: Array<out X509Certificate>?, authType: String?) {}
            override fun checkServerTrusted(chain: Array<out X509Certificate>?, authType: String?) {}
            override fun getAcceptedIssuers(): Array<X509Certificate> = arrayOf()
        })

        val sslContext = SSLContext.getInstance("SSL")
        sslContext.init(null, trustAllCerts, java.security.SecureRandom())

        val builder = OkHttpClient.Builder()
            .sslSocketFactory(sslContext.socketFactory, trustAllCerts[0] as X509TrustManager)
            .hostnameVerifier { _, _ -> true }

        client = builder.build()
    }

    override fun getName(): String {
        return "WebSocketSelfSigned"
    }

    @ReactMethod
    fun connect(url: String, promise: Promise) {
        val request = Request.Builder().url(url).build()
        webSocket = client.newWebSocket(request, object : WebSocketListener() {
            override fun onOpen(webSocket: WebSocket, response: Response) {
                sendEvent("onOpen", null)
                promise.resolve("Connected")
            }

            override fun onMessage(webSocket: WebSocket, text: String) {
                sendEvent("onMessage", text)
            }

            override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
                sendEvent("onError", t.message)
                promise.reject("WebSocket Error", t)
            }

            override fun onClosing(webSocket: WebSocket, code: Int, reason: String) {
                sendEvent("onClose", null)
                webSocket.close(1000, null)
            }
        })
    }

    @ReactMethod
    fun send(message: String) {
        webSocket?.send(message)
    }

    @ReactMethod
    fun close() {
        webSocket?.close(1000, null)
        sendEvent("onClose", null)
    }

    private fun sendEvent(eventName: String, params: Any?) {
        reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, params)
    }

    // Required for React Native's NativeEventEmitter
    @ReactMethod
    fun addListener(eventName: String) {
        listenerCount += 1
    }

    @ReactMethod
    fun removeListeners(count: Int) {
        listenerCount -= count
        if (listenerCount == 0) {
            // Optionally, perform cleanup if all listeners are removed
        }
    }
}
