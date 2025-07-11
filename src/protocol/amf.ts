/**
 * Created by delian on 3/12/14.
 * This module provides encoding and decoding of the AMF0 format
 */

/* eslint-disable */

import logger from "../core/logger";

const amf0dRules: any = {
  0x00: amf0decNumber,
  0x01: amf0decBool,
  0x02: amf0decString,
  0x03: amf0decObject,
  //    0x04: amf0decMovie, // Reserved
  0x05: amf0decNull,
  0x06: amf0decUndefined,
  0x07: amf0decRef,
  0x08: amf0decArray,
  // 0x09: amf0decObjEnd, // Should never happen normally
  0x0A: amf0decSArray,
  0x0B: amf0decDate,
  0x0C: amf0decLongString,
  //    0x0D: amf0decUnsupported, // Has been never originally implemented by Adobe!
  //    0x0E: amf0decRecSet, // Has been never originally implemented by Adobe!
  0x0F: amf0decXmlDoc,
  0x10: amf0decTypedObj,
};

const amf0eRules: any = {
  "string": amf0encString,
  "integer": amf0encNumber,
  "double": amf0encNumber,
  "xml": amf0encXmlDoc,
  "object": amf0encObject,
  "array": amf0encArray,
  "sarray": amf0encSArray,
  "binary": amf0encString,
  "true": amf0encBool,
  "false": amf0encBool,
  "undefined": amf0encUndefined,
  "null": amf0encNull
};

/**
 *
 * @param o
 */
function amfType(o: any): string {
  const jsType = typeof o;

  if (o === null) return "null";
  if (jsType == "undefined") return "undefined";
  if (jsType == "number") {
    if (parseInt(o) == o) return "integer";
    return "double";
  }
  if (jsType == "boolean") return o ? "true" : "false";
  if (jsType == "string") return "string";
  if (jsType == "object") {
    if (o instanceof Array) {
      if ((o as any).sarray) return "sarray";
      return "array";
    }
    return "object";
  }
  throw new Error("Unsupported type!");
}

// AMF0 Implementation

/**
 *
 * @param buf
 */
function amf0decNumber(buf: Buffer): { len: number, value: any } {
  return { len: 9, value: buf.readDoubleBE(1) };
}

/**
 *
 * @param num
 */
function amf0encNumber(num: number): Buffer {
  const buf = Buffer.alloc(9);
  buf.writeUInt8(0x00, 0);
  buf.writeDoubleBE(num, 1);
  return buf;
}

/**
 *
 * @param buf
 */
function amf0decBool(buf: Buffer): { len: number, value: boolean } {
  return { len: 2, value: (buf.readUInt8(1) != 0) };
}

/**
 *
 * @param num
 */
function amf0encBool(num: number): Buffer {
  const buf = Buffer.alloc(2);
  buf.writeUInt8(0x01, 0);
  buf.writeUInt8((num ? 1 : 0), 1);
  return buf;
}

/**
 *
 */
function amf0decNull(): { len: number, value: null } {
  return { len: 1, value: null };
}

/**
 *
 */
function amf0encNull(): Buffer {
  const buf = Buffer.alloc(1);
  buf.writeUInt8(0x05, 0);
  return buf;
}

/**
 *
 */
function amf0decUndefined(): { len: number, value: undefined } {
  return { len: 1, value: undefined };
}

/**
 *
 */
function amf0encUndefined(): Buffer {
  const buf = Buffer.alloc(1);
  buf.writeUInt8(0x06, 0);
  return buf;
}

/**
 *
 * @param buf
 */
function amf0decDate(buf: Buffer): { len: number, value: any } {
  //    let s16 = buf.readInt16BE(1);
  const ts = buf.readDoubleBE(3);
  return { len: 11, value: ts };
}

/**
 *
 * @param ts
 */
function amf0encDate(ts: number): Buffer {
  const buf = Buffer.alloc(11);
  buf.writeUInt8(0x0B, 0);
  buf.writeInt16BE(0, 1);
  buf.writeDoubleBE(ts, 3);
  return buf;
}

/**
 *
 * @param buf
 */
function amf0decObject(buf: Buffer): { len: number, value: any } { // TODO: Implement references!
  const obj: any = {};
  let iBuf = buf.slice(1);
  let len = 1;
  //    logger.debug('ODec',iBuf.readUInt8(0));
  while (iBuf.readUInt8(0) != 0x09) {
    // logger.debug('Field', iBuf.readUInt8(0), iBuf);
    const prop = amf0decUString(iBuf);
    // logger.debug('Got field for property', prop);
    len += prop.len;
    if (iBuf.length < prop.len) {
      break;
    }
    if (iBuf.slice(prop.len).readUInt8(0) == 0x09) {
      len++;
      // logger.debug('Found the end property');
      break;
    } // END Object as value, we shall leave
    if (prop.value == "") break;
    const val = amf0DecodeOne(iBuf.slice(prop.len));
    // logger.debug('Got field for value', val);
    obj[prop.value] = val.value;
    len += val.len;
    iBuf = iBuf.slice(prop.len + val.len);
  }
  return { len: len, value: obj };
}

/**
 *
 * @param o
 */
function amf0encObject(o: any): Buffer | null {
  if (typeof o !== "object") return null;

  let data = Buffer.alloc(1);
  data.writeUInt8(0x03, 0); // Type object
  let k;
  for (k in o) {
    data = Buffer.concat([data, amf0encUString(k), amf0EncodeOne(o[k])]);
  }
  const termCode = Buffer.alloc(1);
  termCode.writeUInt8(0x09, 0);
  return Buffer.concat([data, amf0encUString(""), termCode]);
}

/**
 *
 * @param buf
 */
function amf0decRef(buf: Buffer): { len: number, value: string } {
  const index = buf.readUInt16BE(1);
  return { len: 3, value: "ref" + index };
}

/**
 *
 * @param index
 */
function amf0encRef(index: number): Buffer {
  const buf = Buffer.alloc(3);
  buf.writeUInt8(0x07, 0);
  buf.writeUInt16BE(index, 1);
  return buf;
}

/**
 *
 * @param buf
 */
function amf0decString(buf: Buffer): { len: any, value: any } {
  const sLen = buf.readUInt16BE(1);
  return { len: 3 + sLen, value: buf.toString("utf8", 3, 3 + sLen) };
}

/**
 *
 * @param buf
 */
function amf0decUString(buf: Buffer): { len: any, value: any } {
  const sLen = buf.readUInt16BE(0);
  return { len: 2 + sLen, value: buf.toString("utf8", 2, 2 + sLen) };
}

/**
 *
 * @param str
 */
function amf0encUString(str: string): Buffer {
  const data = Buffer.from(str, "utf8");
  const sLen = Buffer.alloc(2);
  sLen.writeUInt16BE(data.length, 0);
  return Buffer.concat([sLen, data]);
}

/**
 *
 * @param str
 */
function amf0encString(str: string): Buffer {
  const buf = Buffer.alloc(3);
  buf.writeUInt8(0x02, 0);
  buf.writeUInt16BE(str.length, 1);
  return Buffer.concat([buf, Buffer.from(str, "utf8")]);
}

/**
 *
 * @param buf
 */
function amf0decLongString(buf: Buffer): { len: any, value: any } {
  const sLen = buf.readUInt32BE(1);
  return { len: 5 + sLen, value: buf.toString("utf8", 5, 5 + sLen) };
}

/**
 *
 * @param str
 */
function amf0encLongString(str: string): Buffer {
  const buf = Buffer.alloc(5);
  buf.writeUInt8(0x0C, 0);
  buf.writeUInt32BE(str.length, 1);
  return Buffer.concat([buf, Buffer.from(str, "utf8")]);
}

/**
 *
 * @param buf
 */
function amf0decArray(buf: Buffer): { len: any, value: any } {
  //    let count = buf.readUInt32BE(1);
  const obj = amf0decObject(buf.slice(4));
  return { len: 5 + obj.len, value: obj.value };
}

/**
 *
 * @param a
 */
function amf0encArray(a: any[]): Buffer {
  let l = 0;
  if (a instanceof Array) l = a.length; else l = Object.keys(a).length;
  logger.debug(`Array encode ${l} ${a}`);
  const buf = Buffer.alloc(5);
  buf.writeUInt8(8, 0);
  buf.writeUInt32BE(l, 1);
  const data = amf0encObject(a);
  return Buffer.concat([buf, (data as Buffer).subarray(1)]);
}

/**
 *
 * @param aData
 */
function amf0cnletray2Object(aData: Buffer): Buffer {
  const buf = Buffer.alloc(1);
  buf.writeUInt8(0x3, 0); // Object id
  return Buffer.concat([buf, aData.slice(5)]);
}

/**
 *
 * @param oData
 */
function amf0cnvObject2Array(oData: Buffer): Buffer {
  const buf = Buffer.alloc(5);
  const o = amf0decObject(oData);
  const l = Object.keys(o).length;
  buf.writeUInt32BE(l, 1);
  return Buffer.concat([buf, oData.slice(1)]);
}

/**
 *
 * @param buf
 */
function amf0decXmlDoc(buf: Buffer): { len: any, value: any } {
  const sLen = buf.readUInt16BE(1);
  return { len: 3 + sLen, value: buf.toString("utf8", 3, 3 + sLen) };
}

/**
 *
 * @param str
 */
function amf0encXmlDoc(str: string): Buffer { // Essentially it is the same as string
  const buf = Buffer.alloc(3);
  buf.writeUInt8(0x0F, 0);
  buf.writeUInt16BE(str.length, 1);
  return Buffer.concat([buf, Buffer.from(str, "utf8")]);
}

/**
 *
 * @param buf
 */
function amf0decSArray(buf: Buffer): { len: number, value: any[] } {
  const a: any[] = [];
  let len = 5;
  let ret;
  for (let count = buf.readUInt32BE(1); count; count--) {
    ret = amf0DecodeOne(buf.slice(len));
    a.push(ret.value);
    len += ret.len;
  }
  return { len: len, value: amf0markSArray(a) };
}

/**
 *
 * @param a
 */
function amf0encSArray(a: any[]): Buffer {
  logger.debug("Do strict array!");
  let buf = Buffer.alloc(5);
  buf.writeUInt8(0x0A, 0);
  buf.writeUInt32BE(a.length, 1);
  let i;
  for (i = 0; i < a.length; i++) {
    buf = Buffer.concat([buf, amf0EncodeOne(a[i])]);
  }
  return buf;
}

/**
 *
 * @param a
 */
function amf0markSArray(a: any[]): any[] {
  Object.defineProperty(a, "sarray", { value: true });
  return a;
}

/**
 *
 * @param buf
 */
function amf0decTypedObj(buf: Buffer): { len: number, value: any } {
  const className = amf0decString(buf);
  const obj = amf0decObject(buf.slice(className.len - 1));
  obj.value.__className__ = className.value;
  return { len: className.len + obj.len - 1, value: obj.value };
}

/**
 *
 */
function amf0encTypedObj() {
  throw new Error("Error: SArray encoding is not yet implemented!"); // TODO: Error
}

/**
 *
 * @param rules
 * @param buffer
 */
function amfXDecodeOne(rules: any[], buffer: Buffer): any {
  if (!rules[buffer.readUInt8(0)]) {
    logger.error(`Unknown field ${buffer.readUInt8(0)}`,);
    return null;
  }
  return rules[buffer.readUInt8(0)](buffer);
}

/**
 *
 * @param buffer
 */
function amf0DecodeOne(buffer: Buffer): any {
  return amfXDecodeOne(amf0dRules, buffer);
}

/**
 *
 * @param rules
 * @param buffer
 */
function amfXDecode(rules: any[], buffer: Buffer): any[] {
  // We shall receive clean buffer and will respond with an array of values
  const resp: any[] = [];
  let res;
  for (let i = 0; i < buffer.length;) {
    res = amfXDecodeOne(rules, buffer.slice(i));
    i += res.len;
    resp.push(res.value); // Add the response
  }
  return resp;
}

/**
 *
 * @param buffer
 */
function amf0Decode(buffer: Buffer): any[] {
  return amfXDecode(amf0dRules, buffer);
}

/**
 *
 * @param rules
 * @param o
 */
function amfXEncodeOne(rules: any, o: any): any {
  //    logger.debug('amfXEncodeOne type',o,amfType(o),rules[amfType(o)]);
  const f = rules[amfType(o)];
  if (f) return f(o);
  throw new Error("Unsupported type for encoding!");
}

/**
 *
 * @param o
 */
function amf0EncodeOne(o: any): any {
  return amfXEncodeOne(amf0eRules, o);
}

/**
 *
 * @param a
 */
function amf0Encode(a: any[]): Buffer {
  let buf = Buffer.alloc(0);
  a.forEach(function (o) {
    buf = Buffer.concat([buf, amf0EncodeOne(o)]);
  });
  return buf;
}

const rtmpCmdCode: any = {
  "_result": ["transId", "cmdObj", "info"],
  "_error": ["transId", "cmdObj", "info", "streamId"], // Info / Streamid are optional
  "onStatus": ["transId", "cmdObj", "info"],
  "releaseStream": ["transId", "cmdObj", "streamName"],
  "getStreamLength": ["transId", "cmdObj", "streamId"],
  "getMovLen": ["transId", "cmdObj", "streamId"],
  "FCPublish": ["transId", "cmdObj", "streamName"],
  "FCUnpublish": ["transId", "cmdObj", "streamName"],
  "FCSubscribe": ["transId", "cmdObj", "streamName"],
  "onFCPublish": ["transId", "cmdObj", "info"],
  "connect": ["transId", "cmdObj", "args"],
  "call": ["transId", "cmdObj", "args"],
  "createStream": ["transId", "cmdObj"],
  "close": ["transId", "cmdObj"],
  "play": ["transId", "cmdObj", "streamName", "start", "duration", "reset"],
  "play2": ["transId", "cmdObj", "params"],
  "deleteStream": ["transId", "cmdObj", "streamId"],
  "closeStream": ["transId", "cmdObj"],
  "receiveAudio": ["transId", "cmdObj", "bool"],
  "receiveVideo": ["transId", "cmdObj", "bool"],
  "publish": ["transId", "cmdObj", "streamName", "type"],
  "seek": ["transId", "cmdObj", "ms"],
  "pause": ["transId", "cmdObj", "pause", "ms"]
};

const rtmpDataCode: any = {
  "@setDataFrame": ["method", "dataObj"],
  "onFI": ["info"],
  "onMetaData": ["dataObj"],
  "|RtmpSampleAccess": ["bool1", "bool2"],
};

/**
 *
 * @param dbuf
 */
function decodeAmf0Data(dbuf: Buffer): any {
  let buffer = dbuf;
  const resp: any = {};

  const cmd = amf0DecodeOne(buffer);
  if (cmd) {
    resp.cmd = cmd.value;
    buffer = buffer.slice(cmd.len);

    if (rtmpDataCode[cmd.value]) {
      rtmpDataCode[cmd.value].forEach(function (n: string) {
        if (buffer.length > 0) {
          const r = amf0DecodeOne(buffer);
          if (r) {
            buffer = buffer.slice(r.len);
            resp[n] = r.value;
          }
        }
      });
    } else {
      logger.error(`Unknown command ${resp}`);
    }
  }

  return resp;
}

/**
 *
 * @param dbuf
 */
function decodeAmf0Cmd(dbuf: Buffer): any {
  let buffer = dbuf;
  const resp: any = {};

  const cmd = amf0DecodeOne(buffer);
  if (!cmd) {
    logger.error("Failed to decode AMF0 command");
    return resp;
  }

  resp.cmd = cmd.value;
  buffer = buffer.slice(cmd.len);

  if (rtmpCmdCode[cmd.value]) {
    rtmpCmdCode[cmd.value].forEach(function (n: string) {
      if (buffer.length > 0) {
        const r = amf0DecodeOne(buffer);
        buffer = buffer.slice(r.len);
        resp[n] = r.value;
      }
    });
  } else {
    logger.error(`Unknown command${resp}`);
  }
  return resp;
}

/**
 *
 * @param opt
 */
function encodeAmf0Cmd(opt: any): any {
  let data = amf0EncodeOne(opt.cmd);

  if (rtmpCmdCode[opt.cmd]) {
    rtmpCmdCode[opt.cmd].forEach(function (n: string) {
      if (Object.prototype.hasOwnProperty.call(opt, n))
        data = Buffer.concat([data, amf0EncodeOne(opt[n])]);
    });
  } else {
    logger.error(`Unknown command${opt}`);
  }
  // logger.debug('Encoded as',data.toString('hex'));
  return data;
}

/**
 *
 * @param opt
 */
function encodeAmf0Data(opt: any): Buffer {
  let data = amf0EncodeOne(opt.cmd);

  if (rtmpDataCode[opt.cmd]) {
    rtmpDataCode[opt.cmd].forEach(function (n: string) {
      if (Object.prototype.hasOwnProperty.call(opt, n))
        data = Buffer.concat([data, amf0EncodeOne(opt[n])]);
    });
  } else {
    logger.error(`Unknown data ${opt}`);
  }
  // logger.debug('Encoded as',data.toString('hex'));
  return data;
}

export {
  decodeAmf0Cmd,
  encodeAmf0Cmd,
  decodeAmf0Data,
  encodeAmf0Data,
  amf0Encode,
  amf0EncodeOne,
  amf0Decode,
  amf0DecodeOne,
};
