//
//  Created by Chen Mingliang on 24/11/28.
//  illuspas@msn.com
//  Copyright (c) 2023 NodeMedia. All rights reserved.
//

/* eslint-disable */

import EventEmitter from "node:events";
import BaseSession from "../session/base_session";
import BroadcastServer from "../server/broadcast_server";

const Context = {
  config: {} as any,

  sessions: new Map<string, BaseSession>(),

  broadcasts: new Map<string, BroadcastServer>(),

  eventEmitter: new EventEmitter()
};

export default Context;
