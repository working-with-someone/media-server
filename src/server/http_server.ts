//
//  Created by Chen Mingliang on 23/12/01.
//  illuspas@msn.com
//  Copyright (c) 2023 Nodemedia. All rights reserved.
//

import fs from "fs";
import http from "http";
import http2 from "http2";
import express from "express";
import cors from "cors";
import logger from "../core/logger";
import http2Express from "http2-express-bridge";
import FlvSession from "../session/flv_session";

/* eslint-disable */

class NodeHttpServer {
  config: any;
  httpServer: http.Server | undefined;
  httpsServer: http2.Http2SecureServer | undefined;

  constructor(config: any) {
    this.config = config;
    const app = http2Express(express);

    if (config.static?.router && config.static?.root) {
      app.use(config.static.router, express.static(config.static.root));
    }

    app.use(cors());

    app.all("/:app/:name.flv", this.handleFlv);

    if (this.config.http?.port) {
      this.httpServer = http.createServer(app);
    }
    if (this.config.https?.port) {
      const opt = {
        key: fs.readFileSync(this.config.https.key),
        cert: fs.readFileSync(this.config.https.cert),
        allowHTTP1: true
      };
      this.httpsServer = http2.createSecureServer(opt, app);
    }

  }

  run = () => {
    this.httpServer?.listen(this.config.http.port, this.config.bind, () => {
      logger.info(`HTTP server listening on port ${this.config.bind}:${this.config.http.port}`);
    });
    this.httpsServer?.listen(this.config.https.port, this.config.bind, () => {
      logger.info(`HTTPS server listening on port ${this.config.bind}:${this.config.https.port}`);
    });
  };

  handleFlv = (req: express.Request, res: express.Response) => {
    const session = new FlvSession(req, res);
    session.run();
  };
}

export default NodeHttpServer;
