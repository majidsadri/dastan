/** @type {import('@bacons/apple-targets/app.plugin').Config} */
module.exports = {
  type: "widget",
  name: "dastan-widget",
  displayName: "Dastan",
  icon: "../../assets/icon.png",
  deploymentTarget: "17.0",
  frameworks: ["SwiftUI", "WidgetKit"],
  colors: {
    // The single gilded accent shared with the app itself.
    $accent: "#b89a5b",
    // Cream paper background — matches the app's bg token.
    $widgetBackground: "#faf7f0",
  },
};
