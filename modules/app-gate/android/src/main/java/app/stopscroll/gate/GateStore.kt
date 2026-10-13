package app.stopscroll.gate

import android.content.Context
import android.content.SharedPreferences

/** What the service needs from the app: which packages to pause and which are let through. */
internal object GateStore {
  private const val PREFS = "stopscroll_gate"
  private const val KEY_PACKAGES = "packages"
  private const val KEY_ALLOWED_PREFIX = "allowed_until_"

  private fun prefs(context: Context): SharedPreferences =
    context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

  /** Package name → StopScroll app id ("tiktok", "reels", "shorts"). */
  fun setWatched(context: Context, packages: Map<String, String>) {
    prefs(context)
      .edit()
      .putStringSet(KEY_PACKAGES, packages.map { (pkg, app) -> "$pkg=$app" }.toSet())
      .apply()
  }

  fun watched(context: Context): Map<String, String> =
    prefs(context)
      .getStringSet(KEY_PACKAGES, emptySet())
      .orEmpty()
      .mapNotNull { entry ->
        val parts = entry.split('=', limit = 2)
        if (parts.size == 2) parts[0] to parts[1] else null
      }
      .toMap()

  /** After "open anyway" the app opens without a pause until `untilMs`. */
  fun allow(context: Context, app: String, untilMs: Long) {
    prefs(context).edit().putLong(KEY_ALLOWED_PREFIX + app, untilMs).apply()
  }

  fun allowedUntil(context: Context, app: String): Long =
    prefs(context).getLong(KEY_ALLOWED_PREFIX + app, 0L)
}
