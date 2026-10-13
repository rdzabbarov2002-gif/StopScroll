package app.stopscroll.gate

import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.provider.Settings
import android.text.TextUtils
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/** JS side of the pause before feed apps on Android (see GateAccessibilityService). */
class AppGateModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("AppGate")

    Function("isServiceEnabled") {
      isServiceEnabled()
    }

    Function("openServiceSettings") {
      context.startActivity(
        Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      )
    }

    Function("setWatchedApps") { packages: Map<String, String> ->
      GateStore.setWatched(context, packages)
    }

    Function("allowApp") { app: String, untilMs: Double ->
      GateStore.allow(context, app, untilMs.toLong())
    }

    Function("openApp") { packages: List<String> ->
      val launch = packages.firstNotNullOfOrNull { context.packageManager.getLaunchIntentForPackage(it) }
      if (launch != null) {
        context.startActivity(launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
      }
      launch != null
    }
  }

  private fun isServiceEnabled(): Boolean {
    val enabled = Settings.Secure.getString(
      context.contentResolver,
      Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
    ) ?: return false
    val expected = ComponentName(context, GateAccessibilityService::class.java)
    val services = TextUtils.SimpleStringSplitter(':').apply { setString(enabled) }
    return services.any { ComponentName.unflattenFromString(it) == expected }
  }
}
