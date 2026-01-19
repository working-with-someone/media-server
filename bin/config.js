module.exports = {
  bind: "::",
  notify: {
    url: process.env.LIVE_SESSION_HUB_SERVER_URL,
  },
  auth: {
    play: false,
    publish: false,
    secret: "nodemedia2017privatekey",
  },
  rtmp: {
    port: 1935,
  },
  rtmps: {
    port: 1936,
    key: "./key.pem",
    cert: "./cert.pem",
  },
  http: {
    port: 8010,
  },
  https: {
    port: 8443,
    key: "./key.pem",
    cert: "./cert.pem",
  },
  tus: {
    port: 1080,
  },
  static: {
    router: "/",
    root: "./video",
  },
  record: {
    path: "./video/record",
  },
};
