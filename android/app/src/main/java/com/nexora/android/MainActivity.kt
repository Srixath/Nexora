package com.nexora.android

import android.app.Activity
import android.os.Bundle
import android.widget.Button
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.TextView
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.WebSocket
import okhttp3.WebSocketListener
import org.json.JSONObject

class MainActivity : Activity() {
    private val client = OkHttpClient()
    private var socket: WebSocket? = null
    private lateinit var status: TextView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val layout = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(48, 72, 48, 32)
        }
        val title = TextView(this).apply { text = "Connect Nexora"; textSize = 28f }
        val instructions = TextView(this).apply {
            text = "Enter the Windows computer's local IP address and the six-digit pairing code."
            textSize = 16f
        }
        val host = EditText(this).apply { hint = "Windows IP, e.g. 192.168.1.25" }
        val code = EditText(this).apply { hint = "Pairing code"; inputType = 2; maxLines = 1 }
        val button = Button(this).apply { text = "Connect to Windows" }
        status = TextView(this).apply { text = "Not connected"; textSize = 15f }
        button.setOnClickListener { pair(host.text.toString().trim(), code.text.toString().trim()) }
        layout.addView(title)
        layout.addView(instructions)
        layout.addView(host)
        layout.addView(code)
        layout.addView(button)
        layout.addView(status)
        setContentView(layout)
    }

    private fun pair(host: String, code: String) {
        if (host.isBlank() || !code.matches(Regex("\\d{6}"))) {
            status.text = "Enter a Windows IP address and six-digit code."
            return
        }
        status.text = "Connecting..."
        val request = Request.Builder().url("ws://$host:8787").build()
        socket?.close(1000, "reconnecting")
        socket = client.newWebSocket(request, object : WebSocketListener() {
            override fun onOpen(webSocket: WebSocket, response: okhttp3.Response) {
                val message = JSONObject()
                    .put("version", 1)
                    .put("type", "pair")
                    .put("code", code)
                    .put("deviceId", "android-${System.currentTimeMillis()}")
                    .put("deviceName", "Android phone")
                webSocket.send(message.toString())
            }

            override fun onMessage(webSocket: WebSocket, text: String) {
                val message = JSONObject(text)
                runOnUiThread {
                    status.text = when (message.optString("type")) {
                        "paired" -> "Connected to Windows"
                        "error" -> message.optString("message", "Pairing failed")
                        else -> status.text
                    }
                }
            }

            override fun onFailure(webSocket: WebSocket, t: Throwable, response: okhttp3.Response?) {
                runOnUiThread { status.text = "Could not reach Windows: ${t.message ?: "connection failed"}" }
            }
        })
    }

    override fun onDestroy() {
        socket?.close(1000, "app closed")
        client.dispatcher.executorService.shutdown()
        super.onDestroy()
    }
}
