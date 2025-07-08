const { Server } = require("@tus/server");
const { FileStore } = require("@tus/file-store");
const path = require("node:path");
const logger = require("../core/logger");

class TusServer {
  constructor(config) {
    this.config = config;

    if (this.config.tus?.port) {
      this.tusServer = new Server({
        path: "/video",
        datastore: new FileStore({ directory: path.join(process.cwd(), "video") })
      });
    }
  }

  run = () => {
    this.tusServer.listen(this.config.tus.port, this.config.bind, () => {
      logger.info(`TUS server listening on port ${this.config.bind}:${this.config.tus.port}`);
    });
  };
}

module.exports = TusServer;