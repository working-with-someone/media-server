import { Server, Upload } from "@tus/server";
import { FileStore } from "@tus/file-store";
import path from "node:path";
import logger from "../core/logger";
import { MediaServerConfig, TusServerConfig } from "../config/server.config";
import type { ServerRequest as Request } from "srvx/types";

class TusServer {
  config: TusServerConfig;
  bind: string;
  tusServer: Server | undefined;

  constructor(mediaServerConfig: MediaServerConfig) {
    this.config = mediaServerConfig.tus;
    this.bind = mediaServerConfig.bind;

    if (this.config.port) {
      this.tusServer = new Server({
        path: "/video",
        datastore: new FileStore({
          directory: path.join(process.cwd(), "media/video"),
        }),
        onUploadFinish: async (req: Request, upload: Upload) => {
          const body = JSON.stringify({
            video_id: upload.id,
          });

          return {
            status_code: 200,
            body,
          };
        },
      });
    }
  }

  run = () => {
    this.tusServer?.listen({ port: this.config.port, host: this.bind }, () => {
      logger.info(
        `TUS server listening on port ${this.bind}:${this.config.port}`,
      );
    });
  };
}

export default TusServer;
