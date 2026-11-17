const {
  withAndroidManifest,
  withMainActivity,
  withMainApplication,
  withDangerousMod,
} = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

const PIP_MODULE_KT_CONTENT = `package tuk.tuk.app

import android.app.Activity
import android.app.PictureInPictureParams
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.util.Rational
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule

class PipModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "PipModule"

    companion object {
        private var instance: PipModule? = null
        private var lastKnownInPip: Boolean = false

        fun onPipModeChanged(isInPipMode: Boolean) {
            lastKnownInPip = isInPipMode
            instance?.sendPipEvent(isInPipMode)
        }
    }

    init {
        instance = this
    }

    private fun sendPipEvent(isInPipMode: Boolean) {
        try {
            if (!reactContext.hasActiveReactInstance()) return
            val params = Arguments.createMap().apply {
                putBoolean("isInPipMode", isInPipMode)
            }
            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit("onPipModeChanged", params)
        } catch (_: Exception) {
            // React instance might be detached or transitioning
        }
    }

    @ReactMethod
    fun isPipSupported(promise: Promise) {
        try {
            val supported = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O &&
                    reactContext.packageManager.hasSystemFeature(PackageManager.FEATURE_PICTURE_IN_PICTURE)
            promise.resolve(supported)
        } catch (_: Exception) {
            promise.resolve(false)
        }
    }

    @ReactMethod
    fun isInPipMode(promise: Promise) {
        val activity: Activity? = reactContext.currentActivity
        if (activity != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            promise.resolve(activity.isInPictureInPictureMode)
        } else {
            promise.resolve(lastKnownInPip)
        }
    }

    @ReactMethod
    fun enterPipMode(aspectRatioNumerator: Int, aspectRatioDenominator: Int, promise: Promise) {
        val activity: Activity? = reactContext.currentActivity
        if (activity == null) {
            promise.reject("NO_ACTIVITY", "Current activity is null")
            return
        }

        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            promise.reject("UNSUPPORTED_VERSION", "Android 8.0 (API 26) or higher is required for Picture-in-Picture")
            return
        }

        if (!reactContext.packageManager.hasSystemFeature(PackageManager.FEATURE_PICTURE_IN_PICTURE)) {
            promise.reject("NOT_SUPPORTED", "Picture-in-Picture is not supported on this device")
            return
        }

        activity.runOnUiThread {
            try {
                var num = if (aspectRatioNumerator > 0) aspectRatioNumerator else 9
                var den = if (aspectRatioDenominator > 0) aspectRatioDenominator else 16

                // Android limits aspect ratio between 1:2.39 (0.41841) and 2.39:1 (2.39)
                val ratio = num.toFloat() / den.toFloat()
                if (ratio < 0.41841f) {
                    num = 100
                    den = 239
                } else if (ratio > 2.39f) {
                    num = 239
                    den = 100
                }

                val rational = Rational(num, den)
                val builder = PictureInPictureParams.Builder().apply {
                    setAspectRatio(rational)
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                        setSeamlessResizeEnabled(true)
                    }
                }

                val entered = activity.enterPictureInPictureMode(builder.build())
                promise.resolve(entered)
            } catch (e: Exception) {
                promise.reject("PIP_ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun maximizePip(promise: Promise) {
        val activity: Activity? = reactContext.currentActivity
        if (activity == null) {
            promise.reject("NO_ACTIVITY", "Current activity is null")
            return
        }

        activity.runOnUiThread {
            try {
                val intent = Intent(activity, activity.javaClass).apply {
                    flags = Intent.FLAG_ACTIVITY_REORDER_TO_FRONT or Intent.FLAG_ACTIVITY_SINGLE_TOP
                }
                activity.startActivity(intent)
                promise.resolve(true)
            } catch (e: Exception) {
                promise.reject("PIP_MAXIMIZE_ERROR", e.message, e)
            }
        }
    }
}
`;

const PIP_PACKAGE_KT_CONTENT = `package tuk.tuk.app

import android.view.View
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ReactShadowNode
import com.facebook.react.uimanager.ViewManager

class PipPackage : ReactPackage {
    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
        return listOf(PipModule(reactContext))
    }

    override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<View, ReactShadowNode<*>>> {
        return emptyList()
    }
}
`;

const MAIN_ACTIVITY_PIP_SNIPPET = `  override fun onPictureInPictureModeChanged(
    isInPictureInPictureMode: Boolean,
    newConfig: Configuration
  ) {
    super.onPictureInPictureModeChanged(isInPictureInPictureMode, newConfig)
    PipModule.onPipModeChanged(isInPictureInPictureMode)
  }

  override fun finish() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N && isInPictureInPictureMode) {
      // User tapped close 'X' button in PiP window: move task to back so
      // Voice Party and Agora audio remain active in the background.
      moveTaskToBack(true)
      return
    }
    super.finish()
  }

  override fun onStop() {
    super.onStop()
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N && !isInPictureInPictureMode) {
      PipModule.onPipModeChanged(false)
    }
  }
`;

function modifyMainActivity(contents) {
  let modified = contents;

  // Ensure necessary imports
  if (!modified.includes("android.content.res.Configuration")) {
    modified = modified.replace(
      /package\s+tuk\.tuk\.app\s*\n/,
      "package tuk.tuk.app\nimport android.content.res.Configuration\n"
    );
  }
  if (!modified.includes("android.os.Build")) {
    modified = modified.replace(
      /package\s+tuk\.tuk\.app\s*\n/,
      "package tuk.tuk.app\nimport android.os.Build\n"
    );
  }

  // Inject PiP callbacks into MainActivity class
  if (!modified.includes("onPictureInPictureModeChanged")) {
    modified = modified.replace(
      /class\s+MainActivity\s*:\s*ReactActivity\(\)\s*\{/,
      `class MainActivity : ReactActivity() {\n${MAIN_ACTIVITY_PIP_SNIPPET}`
    );
  }

  return modified;
}

function modifyMainApplication(contents) {
  let modified = contents;

  // Add PipPackage() to getPackages() list
  if (!modified.includes("PipPackage()")) {
    if (modified.includes("PackageList(this).packages.apply {")) {
      modified = modified.replace(
        "PackageList(this).packages.apply {",
        "PackageList(this).packages.apply {\n              add(PipPackage())"
      );
    } else if (modified.includes("PackageList(this).packages")) {
      modified = modified.replace(
        "PackageList(this).packages",
        "PackageList(this).packages.apply {\n              add(PipPackage())\n            }"
      );
    }
  }

  return modified;
}

/**
 * Expo Config Plugin to enable Android Picture-in-Picture (PiP) support
 * on the main application activity and inject the native PipModule.
 */
module.exports = function withAndroidPip(config) {
  // 1. Configure AndroidManifest.xml
  config = withAndroidManifest(config, (modConfig) => {
    const mainActivity = modConfig.modResults.manifest.application?.[0]?.activity?.find(
      (a) => a.$["android:name"] === ".MainActivity"
    );

    if (mainActivity) {
      mainActivity.$["android:supportsPictureInPicture"] = "true";
      mainActivity.$["android:resizeableActivity"] = "true";

      const requiredConfigChanges = [
        "keyboard",
        "keyboardHidden",
        "orientation",
        "screenSize",
        "screenLayout",
        "uiMode",
        "smallestScreenSize",
      ];

      const current = (mainActivity.$["android:configChanges"] || "")
        .split("|")
        .map((s) => s.trim())
        .filter(Boolean);

      const merged = Array.from(new Set([...current, ...requiredConfigChanges]));
      mainActivity.$["android:configChanges"] = merged.join("|");
    }

    return modConfig;
  });

  // 2. Configure MainActivity.kt
  config = withMainActivity(config, (modConfig) => {
    modConfig.modResults.contents = modifyMainActivity(modConfig.modResults.contents);
    return modConfig;
  });

  // 3. Configure MainApplication.kt
  config = withMainApplication(config, (modConfig) => {
    modConfig.modResults.contents = modifyMainApplication(modConfig.modResults.contents);
    return modConfig;
  });

  // 4. Write native Kotlin source files during prebuild
  config = withDangerousMod(config, [
    "android",
    async (modConfig) => {
      const targetDir = path.join(
        modConfig.modRequest.platformProjectRoot,
        "app",
        "src",
        "main",
        "java",
        "tuk",
        "tuk",
        "app"
      );

      fs.mkdirSync(targetDir, { recursive: true });

      const pipModulePath = path.join(targetDir, "PipModule.kt");
      const pipPackagePath = path.join(targetDir, "PipPackage.kt");

      fs.writeFileSync(pipModulePath, PIP_MODULE_KT_CONTENT, "utf8");
      fs.writeFileSync(pipPackagePath, PIP_PACKAGE_KT_CONTENT, "utf8");

      return modConfig;
    },
  ]);

  return config;
};
