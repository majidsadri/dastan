// Metro config — disables Watchman.
//
// The system Watchman install on this machine is broken: `watchman
// get-sockname` spawns but never creates its state socket, so every
// Metro startup hangs on `Waiting for Watchman watch-project...`
// indefinitely. Until Watchman itself is repaired (or reinstalled),
// fall back to Node's native file watching. Slower on huge repos,
// fine for this app.

const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

config.resolver.useWatchman = false;

module.exports = config;
