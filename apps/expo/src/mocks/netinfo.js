// Mock for @react-native-community/netinfo
// Used by pusher-js React Native build for network type detection.
// Pusher has its own reconnection logic so this minimal mock is sufficient.
"use strict";

const NetInfo = {
  fetch: () =>
    Promise.resolve({ isConnected: true, isInternetReachable: true, type: "wifi" }),
  addEventListener: () => () => {},
  configure: () => {},
};

module.exports = NetInfo;
module.exports.default = NetInfo;
module.exports.fetch = NetInfo.fetch;
module.exports.addEventListener = NetInfo.addEventListener;
