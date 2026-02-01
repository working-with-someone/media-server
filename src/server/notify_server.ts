//
//  Created by Chen Mingliang on 25/04/26.
//  illuspas@msn.com
//  Copyright (c) 2025 NodeMedia. All rights reserved.
//
import Context from "../core/context";
import BaseSession from "../session/base_session";

/* eslint-disable */

class NodeNotifyServer {
  config: any;

  constructor(config: any) {
    this.config = config;
  }

  run() {
    if (!this.config.notify?.url) {
      return;
    }

    Context.eventEmitter.on("postPlay", (session: BaseSession) => {
      this.notify("postPlay", session);
    });

    Context.eventEmitter.on("donePlay", (session: BaseSession) => {
      this.notify("donePlay", session);
    });

    Context.eventEmitter.on("postPublish", (session: BaseSession) => {
      this.notify("postPublish", session);
    });

    Context.eventEmitter.on("donePublish", (session: BaseSession) => {
      this.notify("donePublish", session);
    });

    Context.eventEmitter.on("doneRecord", (session: BaseSession) => {
      this.notify("doneRecord", session);
    });
  }

  notify(action: string, session: BaseSession) {
    fetch(new URL("/notify", this.config.notify.url).href, {
      method: "POST",
      headers: {
        "Content-Type": "application/json", // 이 부분이 중요합니다!
        Accept: "application/json",
      },
      body: JSON.stringify({
        id: session.id,
        ip: session.ip,
        app: session.streamApp,
        name: session.streamName,
        query: session.streamQuery,
        protocol: session.protocol,
        createtime: session.createTime,
        endtime: session.endTime,
        inbytes: session.inBytes,
        outbytes: session.outBytes,
        filePath: session.filePath,
        action: action,
      }),
    })
      .then((res) => {
        if (res.status !== 200) {
          session.close();
        }
      })
      .catch((err) => {});
  }
}

export default NodeNotifyServer;
