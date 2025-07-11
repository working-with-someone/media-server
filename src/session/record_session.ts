//
//  Created by Chen Mingliang on 25/04/24.
//  illuspas@msn.com
//  Copyright (c) 2025 Nodemedia. All rights reserved.
//

import fs from "node:fs";
import path from "node:path";
import logger from "../core/logger";
import BaseSession from "./base_session";
import BroadcastServer from "../server/broadcast_server";
import Context from "../core/context";

class NodeRecordSession extends BaseSession {
  fileStream: fs.WriteStream;
  broadcast: BroadcastServer;

  constructor(session: BaseSession, filePath: string) {
    super();
    this.protocol = "flv";
    this.streamApp = session.streamApp;
    this.streamName = session.streamName;
    this.streamPath = session.streamPath;
    this.filePath = filePath;
    this.fileStream = this.createWriteStreamWithDirsSync(filePath);
    this.broadcast = Context.broadcasts.get(this.streamPath) ?? new BroadcastServer();
    Context.broadcasts.set(this.streamPath, this.broadcast);
  }

  createWriteStreamWithDirsSync(filePath: string): fs.WriteStream {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    return fs.createWriteStream(filePath);
  }

  run() {
    this.broadcast.postPlay(this);
    logger.info(`Record session ${this.id} ${this.streamPath} start record ${this.filePath}`);
    Context.eventEmitter.on("donePublish", (session: BaseSession) => {
      if (session.streamPath === this.streamPath) {
        this.fileStream.close();
        this.broadcast.donePlay(this);
        logger.info(`Record session ${this.id} ${this.streamPath} done record ${this.filePath}`);
        Context.eventEmitter.emit("doneRecord", this);
      }
    });
  }

  sendBuffer = (buffer: Buffer) => {
    this.outBytes += buffer.length;
    this.fileStream.write(buffer);
  };

};

export default NodeRecordSession;
