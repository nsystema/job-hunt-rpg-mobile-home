# Android APK Build (EAS Preview Profile)

Follow these steps to produce an installable Android APK using your existing `preview` EAS build profile.

## 1. Prerequisites
- **EAS CLI** installed globally (`npm install -g eas-cli`).
- Signed in to Expo (`eas login`).
- Android credentials (keystore) already configured for the `preview` profile.

## 2. Confirm the profile outputs an APK
In `eas.json`, the `preview` profile should request an APK build:

```json
{
  "build": {
    "preview": {
      "android": {
        "buildType": "apk"
      }
    }
  }
}
```

If you already have additional settings in the profile, keep them—just make sure `android.buildType` is set to `apk`.

## 3. Run the build
From the project root, trigger the Android build with the preview profile:

```bash
eas build --platform android --profile preview
```

Add `--local` if you prefer to build on your machine instead of Expo's cloud workers.

## 4. Download the artifact
Once the build finishes, follow the URL printed in the terminal (or open it from the Expo dashboard) to download the generated APK. Share it with testers or install it directly on devices.

