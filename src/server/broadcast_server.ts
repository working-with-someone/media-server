//
//  Created by Chen Mingliang on 23/11/30.
//  illuspas@msn.com
//  Copyright (c) 2023 NodeMedia. All rights reserved.
//

/* eslint-disable */

import crypto from "node:crypto";
import Flv from "../protocol/flv";
import Rtmp from "../protocol/rtmp";
import AVPacket from "../core/avpacket";
import BaseSession from "../session/base_session";
import Context from "../core/context";

class BroadcastServer {
  publisher: BaseSession | null = null;
  subscribers: Map<string, BaseSession> = new Map();
  flvHeader: Buffer = Flv.createHeader(true, true);
  flvMetaData: Buffer | null = null;
  flvAudioHeader: Buffer | null = null;
  flvVideoHeader: Buffer | null = null;
  rtmpMetaData: Buffer | null = null;
  rtmpAudioHeader: Buffer | null = null;
  rtmpVideoHeader: Buffer | null = null;
  flvGopCache: Set<Buffer> | null = null;
  rtmpGopCache: Set<Buffer> | null = null;

  constructor() {
  }

  verifyAuth = (authKey: string, session: BaseSession): boolean => {
    if (authKey === "") {
      return true;
    }
    let signStr = session.streamQuery?.sign;
    if (signStr?.split("-")?.length !== 2) {
      return false;
    }
    let now = Date.now() / 1000 | 0;
    let exp = parseInt(signStr.split("-")[0]);
    let shv = signStr.split("-")[1];
    let str = session.streamPath + "-" + exp + "-" + authKey;
    if (exp < now) {
      return false;
    }
    let md5 = crypto.createHash("md5");
    let ohv = md5.update(str).digest("hex");
    return shv === ohv;
  };

  postPlay = (session: BaseSession): string | null => {
    if (Context.config.auth?.play && session.ip !== "") {
      if (!this.verifyAuth(Context.config.auth?.secret, session)) {
        return `play stream ${session.streamPath} authentication verification failed`;
      }
    }
    if (session.ip !== "") {
      Context.eventEmitter.emit("postPlay", session);
    }
    switch (session.protocol) {
      case "flv":
        session.sendBuffer(this.flvHeader);
        if (this.flvMetaData !== null) {
          session.sendBuffer(this.flvMetaData);
        }
        if (this.flvAudioHeader !== null) {
          session.sendBuffer(this.flvAudioHeader);
        }
        if (this.flvVideoHeader !== null) {
          session.sendBuffer(this.flvVideoHeader);
        }
        if (this.flvGopCache !== null) {
          this.flvGopCache.forEach((v) => {
            session.sendBuffer(v);
          });
        }
        break;
      case "rtmp":
        if (this.rtmpMetaData != null) {
          session.sendBuffer(this.rtmpMetaData);
        }
        if (this.rtmpAudioHeader != null) {
          session.sendBuffer(this.rtmpAudioHeader);
        }
        if (this.rtmpVideoHeader != null) {
          session.sendBuffer(this.rtmpVideoHeader);
        }
        if (this.rtmpGopCache !== null) {
          this.rtmpGopCache.forEach((v) => {
            session.sendBuffer(v);
          });
        }
    }

    this.subscribers.set(session.id, session);
    return null;
  };

  donePlay = (session: BaseSession) => {
    session.endTime = Date.now();
    if (session.ip !== "") {
      Context.eventEmitter.emit("donePlay", session);
    }
    this.subscribers.delete(session.id);
  };

  postPublish = (session: BaseSession): string | null => {
    if (Context.config.auth?.publish) {
      if (!this.verifyAuth(Context.config.auth?.secret, session)) {
        return `publish stream ${session.streamPath} authentication verification failed`;
      }
    }

    Context.eventEmitter.emit("postPublish", session);
    if (this.publisher == null) {
      this.publisher = session;
    } else {
      return `streamPath=${session.streamPath} already has a publisher`;
    }
    return null;
  };

  donePublish = (session: BaseSession) => {
    if (session === this.publisher) {
      session.endTime = Date.now();
      Context.eventEmitter.emit("donePublish", session);
      this.publisher = null;
      this.flvMetaData = null;
      this.flvAudioHeader = null;
      this.flvVideoHeader = null;
      this.rtmpMetaData = null;
      this.rtmpAudioHeader = null;
      this.rtmpVideoHeader = null;
      this.flvGopCache?.clear();
      this.rtmpGopCache?.clear();
    }
  };

  broadcastMessage = (packet: AVPacket) => {
    const flvMessage = Flv.createMessage(packet);
    const rtmpMessage = Rtmp.createMessage(packet);
    switch (packet.flags) {
      case 0:
        this.flvAudioHeader = Buffer.from(flvMessage);
        this.rtmpAudioHeader = Buffer.from(rtmpMessage);
        break;
      case 1:
        this.flvGopCache?.add(flvMessage);
        this.rtmpGopCache?.add(rtmpMessage);
        break;
      case 2:
        this.flvVideoHeader = Buffer.from(flvMessage);
        this.rtmpVideoHeader = Buffer.from(rtmpMessage);
        break;
      case 3:
        this.flvGopCache?.clear();
        this.rtmpGopCache?.clear();
        this.flvGopCache = new Set();
        this.rtmpGopCache = new Set();
        this.flvGopCache.add(flvMessage);
        this.rtmpGopCache.add(rtmpMessage);
        break;
      case 4:
        this.flvGopCache?.add(flvMessage);
        this.rtmpGopCache?.add(rtmpMessage);
        break;
      case 5:
        this.flvMetaData = Buffer.from(flvMessage);
        this.rtmpMetaData = Buffer.from(rtmpMessage);
        break;
    }
    if (this.flvGopCache && this.flvGopCache.size > 4096) {
      this.flvGopCache.clear();
    }
    if (this.rtmpGopCache && this.rtmpGopCache.size > 4096) {
      this.rtmpGopCache.clear();
    }
    this.subscribers.forEach((v, k) => {
      switch (v.protocol) {
        case "flv":
          v.sendBuffer(flvMessage);
          break;
        case "rtmp":
          v.sendBuffer(rtmpMessage);
      }
    });
  };
}

export default BroadcastServer;
