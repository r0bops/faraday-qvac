const { withAndroidManifest } = require("expo/config-plugins");

function stripInternetPermission(config) {
  const evidenceBuild = process.env.EVIDENCE_BUILD === "true";

  if (!evidenceBuild) {
    return config;
  }

  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults;

    const usesPerms = manifest.manifest["uses-permission"];
    if (usesPerms) {
      const filtered = usesPerms.filter(
        (perm) => perm.$?.["android:name"] !== "android.permission.INTERNET"
      );

      if (Array.isArray(manifest.manifest["uses-permission"])) {
        manifest.manifest["uses-permission"] = filtered;
      } else {
        delete manifest.manifest["uses-permission"];
      }
    }

    return cfg;
  });
}

module.exports = stripInternetPermission;
