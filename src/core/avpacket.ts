//  Created by Chen Mingliang on 23/12/01.
//  illuspas@msn.com
//  Copyright (c) 2023 NodeMedia. All rights reserved.
//

class AVPacket {
  codec_id: number = 0;
  codec_type: number = 0;
  duration: number = 0;
  flags: number = 0;
  pts: number = 0;
  dts: number = 0;
  size: number = 0;
  offset: number = 0;
  data: Buffer = Buffer.alloc(0);

  constructor() {
  }
}

export default AVPacket;
