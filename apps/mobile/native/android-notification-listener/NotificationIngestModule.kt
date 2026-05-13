package com.financecontroller.mobile.notifications

import android.content.Intent
import android.provider.Settings
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray

class NotificationIngestModule(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "NotificationIngestModule"

  @ReactMethod
  fun isAvailable(promise: Promise) {
    promise.resolve(true)
  }

  @ReactMethod
  fun hasPermission(promise: Promise) {
    val enabledListeners = Settings.Secure.getString(
      reactContext.contentResolver,
      "enabled_notification_listeners"
    ) ?: ""
    val granted = enabledListeners.contains(reactContext.packageName)
    promise.resolve(granted)
  }

  @ReactMethod
  fun openNotificationAccessSettings(promise: Promise) {
    try {
      val intent = Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS)
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      reactContext.startActivity(intent)
      promise.resolve(null)
    } catch (error: Throwable) {
      promise.reject("OPEN_SETTINGS_ERROR", error)
    }
  }

  @ReactMethod
  fun requestPermission(promise: Promise) {
    openNotificationAccessSettings(promise)
  }

  @ReactMethod
  fun setAllowedPackages(packages: ReadableArray, promise: Promise) {
    val parsed = mutableSetOf<String>()
    for (index in 0 until packages.size()) {
      val value = packages.getString(index)
      if (!value.isNullOrBlank()) parsed.add(value)
    }
    FinancialNotificationListenerService.allowedPackages = parsed
    promise.resolve(null)
  }

  @ReactMethod
  fun startListener(promise: Promise) {
    FinancialNotificationListenerService.listeningEnabled = true
    FinancialNotificationListenerService.reactContext = reactContext
    promise.resolve(null)
  }

  @ReactMethod
  fun stopListener(promise: Promise) {
    FinancialNotificationListenerService.listeningEnabled = false
    promise.resolve(null)
  }

  @ReactMethod
  fun addListener(eventName: String?) {
    // Required for React Native's NativeEventEmitter contract.
  }

  @ReactMethod
  fun removeListeners(count: Double) {
    // Required for React Native's NativeEventEmitter contract.
  }
}
