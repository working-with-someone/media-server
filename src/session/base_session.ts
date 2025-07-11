//
//  Created by Chen Mingliang on 23/11/30.
//  illuspas@msn.com
//  Copyright (c) 2023 Nodemedia. All rights reserved.
//

/* eslint-disable */

import crypto from "crypto";

function generateRandomId(): string {
  let result = Date.now().toString(36);
  const characters = "0123456789abcdefghijklmnopqrstuvwxyz";
  const charactersLength = characters.length;
  const randomValues = new Uint32Array(8);
  crypto.getRandomValues(randomValues);
  for (let i = 0; i < 8; i++) {
    result += characters[randomValues[i] % charactersLength];
  }
  return result;
}

class BaseSession {
  id: string;
  ip: string;
  protocol: string;
  streamHost: string;
  streamApp: string;
  streamName: string;
  streamPath: string;
  streamQuery: any;
  createTime: number;
  endTime: number;
  videoCodec: number;
  videoWidth: number;
  videoHeight: number;
  videoFramerate: number;
  videoDatarate: number;
  audioCodec: number;
  audioChannels: number;
  audioSamplerate: number;
  audioDatarate: number;
  inBytes: number;
  outBytes: number;
  filePath: string;

  constructor() {
    this.id = generateRandomId();
    this.ip = "";
    this.protocol = "";
    this.streamHost = "";
    this.streamApp = "";
    this.streamName = "";
    this.streamPath = "";
    this.streamQuery = {};
    this.createTime = Date.now();
    this.endTime = 0;

    this.videoCodec = 0;
    this.videoWidth = 0;
    this.videoHeight = 0;
    this.videoFramerate = 0;
    this.videoDatarate = 0;
    this.audioCodec = 0;
    this.audioChannels = 0;
    this.audioSamplerate = 0;
    this.audioDatarate = 0;

    this.inBytes = 0;
    this.outBytes = 0;

    this.filePath = "";
  }

  sendBuffer = (buffer: Buffer) => {
  };

  close = () => {

  };
}

export default BaseSession;
