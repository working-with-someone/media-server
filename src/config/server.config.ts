export interface MediaServerConfig {
  bind: string;
  notify: {
    url: string;
  };
  auth: {
    play: boolean;
    publish: boolean;
    secret: string;
  };
  rtmp: RtmpServerConfig;
  rtmps: RtmpsServerConfig;
  http: HttpServerConfig;
  https: HttpsServerConfig;
  tus: TusServerConfig;
  static: StaticServerConfig;
  record: RecordServerConfig;
}

export interface RtmpServerConfig {
  port: number;
}

export interface RtmpsServerConfig {
  port: number;
  key: string;
  cert: string;
}

export interface HttpServerConfig {
  port: number;
}

export interface HttpsServerConfig {
  port: number;
  key: string;
  cert: string;
}

export interface TusServerConfig {
  port: number;
}

export interface StaticServerConfig {
  router: string;
  root: string;
}

export interface RecordServerConfig {
  path: string;
}