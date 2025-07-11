//
//  Created by Chen Mingliang on 24/11/30.
//  illuspas@msn.com
//  Copyright (c) 2024 Nodemedia. All rights reserved.
//

/* eslint-disable */

import net from "net";
import Rtmp from "../protocol/rtmp";
import logger from "../core/logger";
import Context from "../core/context";
import AVPacket from "../core/avpacket";
import BaseSession from "./base_session";
import BroadcastServer from "../server/broadcast_server";

class RtmpSession extends BaseSession {
  socket: net.Socket;
  rtmp: Rtmp;
  broadcast: BroadcastServer;
  isPublisher: boolean | undefined;

  constructor(socket: net.Socket) {
    super();
    this.socket = socket;
    this.ip = socket.remoteAddress + ":" + socket.remotePort;
    this.protocol = "rtmp";
    this.rtmp = new Rtmp();
    this.broadcast = new BroadcastServer();
  }

  run = () => {
    this.rtmp.onConnectCallback = this.onConnect;
    this.rtmp.onPlayCallback = this.onPlay;
    this.rtmp.onPushCallback = this.onPush;
    this.rtmp.onOutputCallback = this.onOutput;
    this.rtmp.onPacketCallback = this.onPacket;
    this.socket.on("data", this.onData);
    this.socket.on("close", this.onClose);
    this.socket.on("error", this.onError);
  };

  onConnect = (req: { app: string; name: string; host: string; query: any; }) => {
    this.streamApp = req.app;
    this.streamName = req.name;
    this.streamHost = req.host;
    this.streamPath = "/" + req.app + "/" + req.name;
    this.streamQuery = req.query;
    this.broadcast = Context.broadcasts.get(this.streamPath) ?? new BroadcastServer();
    Context.broadcasts.set(this.streamPath, this.broadcast);
  };


  onPlay = () => {
    const err = this.broadcast.postPlay(this);
    if (err != null) {
      logger.error(`RTMP session ${this.id} ${this.ip} play ${this.streamPath} error, ${err}`);
      this.socket.end();
      return;
    }
    this.isPublisher = false;
    logger.info(`RTMP session ${this.id} ${this.ip} start play ${this.streamPath}`);
  };

  onPush = () => {
    const err = this.broadcast.postPublish(this);
    if (err != null) {
      logger.error(`RTMP session ${this.id} ${this.ip} push ${this.streamPath} error, ${err}`);
      this.socket.end();
      return;
    }
    this.isPublisher = true;
    logger.info(`RTMP session ${this.id} ${this.ip} start push ${this.streamPath}`);
  };

  onOutput = (buffer: Buffer) => {
    this.socket.write(buffer);
  };

  onPacket = (packet: AVPacket) => {
    this.broadcast.broadcastMessage(packet);
  };

  onData = (data: Buffer) => {
    this.inBytes += data.length;
    let err = this.rtmp.parserData(data);
    if (err != null) {
      logger.error(`RTMP session ${this.id} ${this.ip} parserData error, ${err}`);
      this.socket.end();
    }
  };

  onClose = () => {
    logger.info(`RTMP session ${this.id} close`);
    if (this.isPublisher) {
      this.broadcast.donePublish(this);
    } else {
      this.broadcast.donePlay(this);
    }
  };

  onError = (error: Error) => {
    logger.info(`RTMP session ${this.id} socket error, ${error.name}: ${error.message}`);
  };

  sendBuffer = (buffer: Buffer) => {
    this.outBytes += buffer.length;
    this.socket.write(buffer);
  };

  close = () => {
    this.socket.end();
  };
}

export default RtmpSession;
