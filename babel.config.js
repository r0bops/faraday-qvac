module.exports = function (api) {
  api.cache(true);
  return {
    // babel-preset-expo (SDK 54) handles JSX, TypeScript, expo-router, and
    // auto-adds the reanimated/worklets plugin when those packages are installed.
    presets: ["babel-preset-expo"],
  };
};
