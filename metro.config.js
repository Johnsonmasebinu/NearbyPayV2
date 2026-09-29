// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
config.maxWorkers = 2;
config.cacheStores = [];   // disables the on-disk transform cache

module.exports = config;