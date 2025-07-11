//
//  Created by Chen Mingliang on 23/12/01.
//  illuspas@msn.com
//  Copyright (c) 2023 Nodemedia. All rights reserved.
//

import fs from "fs";
import net from "net";
import tls from "tls";
import logger from "../core/logger";
import RtmpSession from "../session/rtmp_session";

/* eslint-disable */

class NodeRtmpServer {
  config: any;
  tcpServer: net.Server | undefined;
  tlsServer: tls.Server | undefined;

  constructor(config: any) {
    this.config = config;
    if (this.config.rtmp?.port) {
      this.tcpServer = net.createServer(this.handleRequest);
    }
    if (this.config.rtmps?.port) {
      const opt = {
        key: fs.readFileSync(this.config.rtmps.key),
        cert: fs.readFileSync(this.config.rtmps.cert),
      };
      this.tlsServer = tls.createServer(opt, this.handleRequest);
    }
  }

  run = () => {
    this.tcpServer?.listen(this.config.rtmp.port, this.config.bind, () => {
      logger.log(`Rtmp Server listening on port ${this.config.bind}:${this.config.rtmp.port}`);
    });
    this.tlsServer?.listen(this.config.rtmps.port, this.config.bind, () => {
      logger.log(`Rtmps Server listening on port ${this.config.bind}:${this.config.rtmps.port}`);
    });
  };

  handleRequest = (socket: net.Socket) => {
    const session = new RtmpSession(socket);
    session.run();
  };
}

export default NodeRtmpServer;
