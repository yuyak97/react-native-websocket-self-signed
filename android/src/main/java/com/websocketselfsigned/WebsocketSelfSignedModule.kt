package com.websocketselfsigned

import android.util.Base64
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import okhttp3.*
import okio.ByteString
import okio.ByteString.Companion.toByteString
import java.security.SecureRandom
import java.security.cert.X509Certificate
import javax.net.ssl.*

class WebsocketSelfSignedModule(reactContext: ReactApplicationContext) :
  NativeWebsocketSelfSignedSpec(reactContext) {

  companion object {
    const val NAME = NativeWebsocketSelfSignedSpec.NAME
  }

  // URL -> WebSocket
  private val webSockets = mutableMapOf<String, WebSocket>()
  private val connectionPromises = mutableMapOf<String, Promise>()
  private var listenerCount = 0

  private val client: OkHttpClient by lazy {
    val trustAllCerts = arrayOf<TrustManager>(object : X509TrustManager {
      override fun checkClientTrusted(chain: Array<out X509Certificate>?, authType: String?) {}
      override fun checkServerTrusted(chain: Array<out X509Certificate>?, authType: String?) {}
      override fun getAcceptedIssuers(): Array<X509Certificate> = arrayOf()
    })

    val sslContext = SSLContext.getInstance("SSL")
    sslContext.init(null, trustAllCerts, SecureRandom())

    OkHttpClient.Builder()
      .sslSocketFactory(sslContext.socketFactory, trustAllCerts[0] as X509TrustManager)
      .hostnameVerifier { _, _ -> true }
      .build()
  }



  override fun connect(url: String, headers: ReadableMap?, promise: Promise) {
    if (webSockets.containsKey(url)) {
      promise.reject("AlreadyConnected", "A WebSocket is already connected to this URL.")
      return
    }

    val requestBuilder = Request.Builder().url(url)
    if (headers != null) {
      val iterator = headers.keySetIterator()
      while (iterator.hasNextKey()) {
        val key = iterator.nextKey()
        val value = headers.getString(key)
        if (value != null) requestBuilder.addHeader(key, value)
      }
    }
    val request = requestBuilder.build()

    connectionPromises[url] = promise

    client.newWebSocket(request, object : WebSocketListener() {
      override fun onOpen(ws: WebSocket, response: Response) {
        webSockets[url] = ws
        connectionPromises[url]?.resolve("Connected to $url")
        connectionPromises.remove(url)
        emit("onOpen", mapOf("url" to url))
      }

      override fun onMessage(ws: WebSocket, text: String) {
        emit("onMessage", mapOf("url" to url, "message" to text))
      }

      override fun onMessage(ws: WebSocket, bytes: ByteString) {
        emit("onBinaryMessage", mapOf("url" to url, "message" to bytes.base64()))
      }

      override fun onClosing(ws: WebSocket, code: Int, reason: String) {
        emit("onClose", mapOf("url" to url, "reason" to reason))
        ws.close(1000, null)
      }

      override fun onFailure(ws: WebSocket, t: Throwable, response: Response?) {
        connectionPromises[url]?.reject("WebSocketError", t.message, t)
        connectionPromises.remove(url)

        emit("onError", mapOf("url" to url, "error" to (t.message ?: "Unknown error")))
        webSockets.remove(url)
      }
    })
  }


  /**
    * Send a text message to the specified WebSocket.
    * Example from JS:
    *   WebSocketWithSelfSignedCert.send("wss://your-url", "Hello!")
    */
  override fun send(url: String, message: String) {
    val ws = webSockets[url]
    if (ws == null) {
      emit("onError", mapOf("url" to url, "error" to "WebSocket is not connected"))
      return
    }
    ws.send(message)
  }

  /**
  * Send Base64-encoded binary data to the specified WebSocket.
  * Example from JS:
  *   WebSocketWithSelfSignedCert.sendBinaryBase64("wss://your-url", base64String)
  */
  override fun sendBinaryBase64(url: String, base64String: String) {
    val ws = webSockets[url]
    if (ws == null) {
      emit("onError", mapOf("url" to url, "error" to "WebSocket is not connected"))
      return
    }

    try {
      val bytes = Base64.decode(base64String, Base64.DEFAULT)
      val byteString = bytes.toByteString(0, bytes.size)
      ws.send(byteString)
    } catch (e: IllegalArgumentException) {
      emit("onError", mapOf("url" to url, "error" to "Invalid Base64 binary string"))
    } catch (e: Exception) {
      emit("onError", mapOf("url" to url, "error" to (e.message ?: "Failed to send binary")))
    }
  }


  override fun close(url: String) {
    val ws = webSockets[url]
    if (ws == null) {
      emit("onError", mapOf("url" to url, "error" to "No active WebSocket for this URL"))
      return
    }
    ws.close(1000, "Normal closure")
    webSockets.remove(url)
    emit("onClose", mapOf("url" to url))
  }

  override fun addListener(eventName: String) {
    listenerCount += 1
  }

  override fun removeListeners(count: Double) {
    listenerCount -= count.toInt()
    if (listenerCount < 0) listenerCount = 0
  }

  private fun emit(eventName: String, payload: Map<String, String>) {
    if (listenerCount <= 0) return

    val params: WritableMap = Arguments.createMap()
    payload.forEach { (k, v) -> params.putString(k, v) }

    reactApplicationContext
      .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      .emit(eventName, params)
  }
}
