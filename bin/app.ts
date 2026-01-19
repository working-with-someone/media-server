#!/usr/bin/env node

import fs from "fs";
import path from "path";
import config from "./config.js";
import NodeMediaServer from "../src/index";
import { MediaServerConfig } from "../src/config/server.config";

const typedConfig: MediaServerConfig = config as MediaServerConfig;

if (typedConfig.rtmps?.key && !fs.existsSync(typedConfig.rtmps.key)) {
  typedConfig.rtmps.key = path.join(__dirname, typedConfig.rtmps.key);
}
if (typedConfig.rtmps?.cert && !fs.existsSync(typedConfig.rtmps.cert)) {
  typedConfig.rtmps.cert = path.join(__dirname, typedConfig.rtmps.cert);
}

if (typedConfig.https?.key && !fs.existsSync(typedConfig.https.key)) {
  typedConfig.https.key = path.join(__dirname, typedConfig.https.key);
}
if (typedConfig.https?.cert && !fs.existsSync(typedConfig.https.cert)) {
  typedConfig.https.cert = path.join(__dirname, typedConfig.https.cert);
}

const nms = new NodeMediaServer(typedConfig);

nms.run();
