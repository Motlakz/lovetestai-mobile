const {
  AndroidConfig,
  withAndroidManifest,
  withGradleProperties,
  withStringsXml,
} = require('@expo/config-plugins');

const AD_ID_PERMISSION = 'com.google.android.gms.permission.AD_ID';
const ADMOB_METADATA_NAME = 'com.google.android.gms.ads.APPLICATION_ID';
const TEST_ADMOB_APP_ID = 'ca-app-pub-1422001850914649~1593954742';

function setGradleProperty(modResults, key, value) {
  const existing = modResults.find((item) => item.type === 'property' && item.key === key);
  if (existing) {
    existing.value = value;
  } else {
    modResults.push({ type: 'property', key, value });
  }
}

function withAdMobAndroid(config, options = {}) {
  const admobAppId =
    process.env.EXPO_PUBLIC_ADMOB_ANDROID_APP_ID ||
    options.androidAppId ||
    TEST_ADMOB_APP_ID;

  config = withAndroidManifest(config, (modConfig) => {
    AndroidConfig.Permissions.addPermission(modConfig.modResults, AD_ID_PERMISSION);

    const application = modConfig.modResults.manifest.application?.[0];
    if (application) {
      application['meta-data'] = application['meta-data'] || [];
      const metadata = application['meta-data'];
      const existing = metadata.find((item) => item.$?.['android:name'] === ADMOB_METADATA_NAME);
      const attrs = {
        'android:name': ADMOB_METADATA_NAME,
        'android:value': '@string/admob_app_id',
      };

      if (existing) {
        existing.$ = { ...existing.$, ...attrs };
      } else {
        metadata.push({ $: attrs });
      }
    }

    return modConfig;
  });

  config = withStringsXml(config, (modConfig) => {
    modConfig.modResults.resources.string = modConfig.modResults.resources.string || [];
    const strings = modConfig.modResults.resources.string;
    const existing = strings.find((item) => item.$?.name === 'admob_app_id');
    const value = {
      _: admobAppId,
      $: { name: 'admob_app_id', translatable: 'false' },
    };

    if (existing) {
      existing._ = value._;
      existing.$ = value.$;
    } else {
      strings.push(value);
    }

    return modConfig;
  });

  config = withGradleProperties(config, (modConfig) => {
    setGradleProperty(modConfig.modResults, 'android.enableMinifyInReleaseBuilds', 'false');
    setGradleProperty(modConfig.modResults, 'android.enableShrinkResourcesInReleaseBuilds', 'false');
    return modConfig;
  });

  return config;
}

module.exports = withAdMobAndroid;
