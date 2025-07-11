//
//  Created by Chen Mingliang on 23/12/01.
//  illuspas@msn.com
//  Copyright (c) 2023 NodeMedia. All rights reserved.
//

class Logger {
  levels: string[];
  level: string;

  constructor(level = "info") {
    this.levels = ["trace", "debug", "info", "warn", "error"];
    this.level = this.levels.includes(level) ? level : "info";
  }

  log(message: string, logLevel = "info") {
    const messageLevel = this.levels.indexOf(logLevel);
    const currentLevel = this.levels.indexOf(this.level);

    if (messageLevel >= currentLevel) {
      console.log(`[${this.getTime()}] [${logLevel.toUpperCase()}] ${message}`);
    }
  }

  getTime() {
    const now = new Date();
    return now.toLocaleString();
  }

  trace(message: string) {
    this.log(message, "trace");
  }

  debug(message: string) {
    this.log(message, "debug");
  }

  info(message: string) {
    this.log(message, "info");
  }

  warn(message: string) {
    this.log(message, "warn");
  }

  error(message: string) {
    this.log(message, "error");
  }
}

export default new Logger("debug");
