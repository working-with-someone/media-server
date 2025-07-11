//
//  Created by Chen Mingliang on 25/04/24.
//  illuspas@msn.com
//  Copyright (c) 2025 Nodemedia. All rights reserved.
//

import fs from "node:fs";
import path from "node:path";
import logger from "../core/logger";
import Context from "../core/context";
import NodeRecordSession from "../session/record_session";
import BaseSession from "../session/base_session.js";

/* eslint-disable */

class NodeRecordServer {
  config: any;

  constructor(config: any) {
    this.config = config;
  }

  run() {
    if (this.config.record?.path) {
      try {
        fs.mkdirSync(this.config.record.path, { recursive: true });
        fs.accessSync(this.config.record.path, fs.constants.W_OK);
      } catch (error) {
        logger.error(`record path ${this.config.record.path} has no write permission. ${error}`);
        return;
      }
      logger.info(`Record server start on the path ${this.config.record.path}`);
      Context.eventEmitter.on("postPublish", (session: BaseSession) => {
        let filePath = path.join(this.config.record.path, session.streamPath, Date.now() + ".flv");
        let sess = new NodeRecordSession(session, filePath);
        sess.run();
      });
    }
  }

};

export default NodeRecordServer;
