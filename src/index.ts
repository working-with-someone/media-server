//
//  Created by Chen Mingliang on 24/11/28.
//  illuspas@msn.com
//  Copyright (c) 2024 NodeMedia. All rights reserved.
//

import logger from "./core/logger";
import Package from "../package.json";
import Context from "./core/context";
import BaseSession from "./session/base_session";
import NodeHttpServer from "./server/http_server";
import NodeRtmpServer from "./server/rtmp_server";
import NodeRecordServer from "./server/record_server";
import NodeNotifyServer from "./server/notify_server";
import TusServer from "./server/tus_server";

import { MediaServerConfig } from "./config/server.config";

class NodeMediaServer {
  httpServer: NodeHttpServer;
  rtmpServer: NodeRtmpServer;
  recordServer: NodeRecordServer;
  notifyServer: NodeNotifyServer;
  tusServer: TusServer;

  constructor(config: MediaServerConfig) {
    logger.level = "debug";
    logger.info(`Node-Media-Server v${Package.version}`);
    logger.info(`Homepage: ${Package.homepage}`);
    logger.info(`License: ${Package.license}`);
    logger.info(`Author: ${Package.author}`);

    Context.config = config;
    this.httpServer = new NodeHttpServer(config);
    this.rtmpServer = new NodeRtmpServer(config);
    this.recordServer = new NodeRecordServer(config);
    this.notifyServer = new NodeNotifyServer(config);
    this.tusServer = new TusServer(config);
  }

  /**
   * 
   * @param {string} eventName 
   * @param {(session:BaseSession)=>void} listener 
   */
  on(eventName: string, listener: (session: BaseSession) => void) {
    Context.eventEmitter.on(eventName, listener);
  }

  run() {
    this.httpServer.run();
    this.rtmpServer.run();
    this.recordServer.run();
    this.notifyServer.run();
    this.tusServer.run();
  }
}

export default NodeMediaServer;
