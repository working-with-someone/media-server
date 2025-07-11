//
//  Created by Chen Mingliang on 23/11/30.
//  illuspas@msn.com
//  Copyright (c) 2023 NodeMedia. All rights reserved.
//

/* eslint-disable */
import express from "express";
import Flv from "../protocol/flv";
import logger from "../core/logger";
import Context from "../core/context";
import AVPacket from "../core/avpacket";
import BaseSession from "./base_session";
import BroadcastServer from "../server/broadcast_server";

class FlvSession extends BaseSession {
  req: express.Request;
  res: express.Response;
  flv: Flv;
  broadcast: BroadcastServer;
  isPublisher: boolean | undefined;

  constructor(req: express.Request, res: express.Response) {
    super();
    this.req = req;
    this.res = res;
    this.ip = req.socket.remoteAddress + ":" + req.socket.remotePort;
    this.flv = new Flv();
    this.protocol = "flv";
    this.streamHost = req.hostname;
    this.streamApp = req.params.app;
    this.streamName = req.params.name;
    this.streamPath = "/" + this.streamApp + "/" + this.streamName;
    this.streamQuery = req.query;
    this.broadcast = Context.broadcasts.get(this.streamPath) ?? new BroadcastServer();
    Context.broadcasts.set(this.streamPath, this.broadcast);
  }

  run = () => {
    this.req.on("data", this.onData);
    this.req.on("error", this.onError);
    this.req.socket.on("close", this.onClose);
    if (this.req.method === "GET") {
      this.onPlay();
    } else if (this.req.method === "POST") {
      this.onPush();
    }
  };

  onPlay = () => {
    const err = this.broadcast.postPlay(this);
    if (err != null) {
      logger.error(`FLV session ${this.id} ${this.ip} play ${this.streamPath} error, ${err}`);
      this.res.end();
      return;
    }
    this.isPublisher = false;
    logger.info(`FLV session ${this.id} ${this.ip} start play ${this.streamPath}`);
  };

  onPush = () => {
    const err = this.broadcast.postPublish(this);
    if (err != null) {
      logger.error(`FLV session ${this.id} ${this.ip} push ${this.streamPath} error, ${err}`);
      this.res.end();
      return;
    }
    this.isPublisher = true;
    this.flv.onPacketCallback = this.onPacket;
    logger.info(`FLV session ${this.id} ${this.ip} start push ${this.streamPath}`);
  };

  onData = (data: Buffer) => {
    this.inBytes += data.length;
    let err = this.flv.parserData(data);
    if (err != null) {
      logger.error(`FLV session ${this.id} ${this.ip} parserData error, ${err}`);
      this.res.end();
    }
  };

  onClose = () => {
    logger.info(`FLV session ${this.id} close`);
    if (this.isPublisher) {
      this.broadcast.donePublish(this);
    } else {
      this.broadcast.donePlay(this);
    }
  };

  onError = (err: string) => {
    logger.error(`FLV session ${this.id} ${this.ip} socket error, ${err}`);
  };

  onPacket = (packet: AVPacket) => {
    this.broadcast.broadcastMessage(packet);
  };

  sendBuffer = (buffer: Buffer) => {
    if (this.res.writableEnded) {
      return;
    }
    this.outBytes += buffer.length;
    this.res.write(buffer);
  };

  close = () => {
    this.res.end();
  };
}

export default FlvSession;
