package app.stopscroll.gate

import android.accessibilityservice.AccessibilityService
import android.content.Intent
import android.net.Uri
import android.util.Log
import android.view.accessibility.AccessibilityEvent
import android.view.inputmethod.InputMethodManager

/**
 * Notices when a watched feed app comes to the screen and opens StopScroll's pause in front
 * of it. It only reads the package name of window changes — never the screen content.
 */
class GateAccessibilityService : AccessibilityService() {
  /** The app on screen, ignoring overlays such as the notification shade or the keyboard. */
  private var foreground: String? = null
  private val leftAt = mutableMapOf<String, Long>()
  /** Watched apps the user is currently allowed to be in (after the pause or "open anyway"). */
  private val passed = mutableSetOf<String>()
  private var keyboards: Set<String> = emptySet()

  override fun onServiceConnected() {
    super.onServiceConnected()
    keyboards = enabledKeyboards()
  }

  override fun onAccessibilityEvent(event: AccessibilityEvent?) {
    if (event == null || event.eventType != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) return
    val pkg = event.packageName?.toString() ?: return
    if (pkg == foreground || pkg in OVERLAY_PACKAGES || pkg in keyboards) return

    val now = System.currentTimeMillis()
    foreground?.let { leftAt[it] = now }
    foreground = pkg

    val app = GateStore.watched(this)[pkg] ?: return
    if (GateStore.allowedUntil(this, app) > now) {
      passed.add(pkg)
      return
    }
    // A quick trip to the share sheet or another app and back doesn't restart the pause.
    if (pkg in passed && now - (leftAt[pkg] ?: 0L) < RETURN_GRACE_MS) return
    passed.remove(pkg)
    openPause(app)
  }

  override fun onInterrupt() = Unit

  private fun openPause(app: String) {
    val intent = Intent(Intent.ACTION_VIEW, Uri.parse("stopscroll://gate?app=$app"))
      .setPackage(packageName)
      .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    try {
      startActivity(intent)
    } catch (error: Exception) {
      Log.w(TAG, "Could not open the pause", error)
    }
  }

  private fun enabledKeyboards(): Set<String> {
    val manager = getSystemService(INPUT_METHOD_SERVICE) as? InputMethodManager ?: return emptySet()
    return manager.enabledInputMethodList.map { it.packageName }.toSet()
  }

  companion object {
    private const val TAG = "StopScrollGate"
    private const val RETURN_GRACE_MS = 60_000L
    private val OVERLAY_PACKAGES = setOf("com.android.systemui")
  }
}
