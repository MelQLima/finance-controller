package com.financecontroller.mobile.notifications

import android.app.Notification
import android.os.Bundle
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.util.Log
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.modules.core.DeviceEventManagerModule

class FinancialNotificationListenerService : NotificationListenerService() {
  companion object {
    private const val TAG = "FCNotificationListener"

    @Volatile
    var listeningEnabled: Boolean = false

    @Volatile
    var allowedPackages: Set<String> = emptySet()

    @Volatile
    var reactContext: ReactApplicationContext? = null
  }

  override fun onNotificationPosted(sbn: StatusBarNotification) {
    if (!listeningEnabled) {
      Log.d(TAG, "skip posted=${sbn.packageName} listeningEnabled=false")
      return
    }

    val packageName = sbn.packageName ?: return
    if (allowedPackages.isNotEmpty() && !allowedPackages.contains(packageName)) {
      Log.d(TAG, "skip posted=$packageName not in allowlist")
      return
    }

    val extras = sbn.notification.extras
    val merged = extras.mergeUserVisibleNotificationText()
    val title = merged.lineSequence().firstOrNull { it.isNotBlank() }?.take(240)?.trim()
    val body = merged.trim().take(8000)
    val postedAt = sbn.postTime.toString()

    Log.d(TAG, "emit pkg=$packageName titleLen=${title?.length ?: 0} bodyLen=${body.length} preview=${body.take(160)}")

    val payload = Arguments.createMap().apply {
      putString("packageName", packageName)
      putString("postedAt", postedAt)
      if (!title.isNullOrEmpty()) putString("title", title)
      if (body.isNotEmpty()) putString("body", body)
    }

    val ctx = reactContext
    if (ctx == null) {
      Log.w(TAG, "reactContext is null — open the app and call startListener() so JS can receive events")
      return
    }

    ctx
      .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      .emit("financialNotification", payload)
  }
}

private fun Bundle.mergeUserVisibleNotificationText(): String {
  val chunks = linkedSetOf<String>()

  fun addKey(key: String) {
    val v = getCharSequence(key)?.toString()?.trim() ?: return
    if (v.isNotEmpty()) chunks.add(v)
  }

  listOf(
    Notification.EXTRA_TITLE_BIG,
    Notification.EXTRA_TITLE,
    Notification.EXTRA_TEXT,
    Notification.EXTRA_BIG_TEXT,
    Notification.EXTRA_SUB_TEXT,
    Notification.EXTRA_SUMMARY_TEXT,
    "android.title",
    "android.text",
    "android.bigText",
    "android.subText",
    "android.summaryText",
  ).forEach { addKey(it) }

  val lineKeys = listOf(Notification.EXTRA_TEXT_LINES, "android.textLines")
  for (key in lineKeys) {
    val lines = getCharSequenceArray(key) ?: continue
    for (seq in lines) {
      val v = seq?.toString()?.trim() ?: continue
      if (v.isNotEmpty()) chunks.add(v)
    }
  }

  return chunks.joinToString("\n")
}
