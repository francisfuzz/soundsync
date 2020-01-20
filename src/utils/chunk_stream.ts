import { Readable, Transform } from 'stream';
import { performance } from 'perf_hooks';

export interface AudioChunkStreamOutput {
  i: number;
  chunk: Buffer;
}

export class AudioChunkStream extends Readable {
  interval: number;
  sampleSize: number;
  sourceStream: NodeJS.ReadableStream;
  readInterval: NodeJS.Timeout;
  creationTime: number = performance.now();
  lastEmitTime: number;

  constructor(sourceStream: NodeJS.ReadableStream, interval: number, sampleSize: number) {
    super({
      objectMode: true,
    });
    this.sourceStream = sourceStream;
    this.interval = interval;
    this.sampleSize = sampleSize;
  }

  // TODO handle close of this stream

  _read() {
    if (this.readInterval) {
      return;
    }
    this.lastEmitTime = this.now();
    this.readInterval = setInterval(this._pushNecessaryChunks, this.interval);
  }

  now = () => performance.now() - this.creationTime;

  _pushNecessaryChunks = () => {
    const chunksToEmit = Math.floor((this.now() - this.lastEmitTime) / this.interval);
    for (let i = 0; i < chunksToEmit; i++) {
      const chunkGlobalIndex = Math.floor((this.lastEmitTime / this.interval) + 1);
      const chunk = <Buffer>this.sourceStream.read(this.sampleSize);
      if (chunk === null) {
        break;
      }
      const chunkOutput: AudioChunkStreamOutput = {
        i: chunkGlobalIndex,
        chunk,
      }
      const canPush = this.push(chunkOutput);
      this.lastEmitTime = this.interval * chunkGlobalIndex;
      if (!canPush) {
        clearInterval(this.readInterval);
        break;
      }
    }
  }
}

export class AudioChunkStreamEncoder extends Transform {
  constructor() {
    super({
      writableObjectMode: true,
    });
  }
  _transform(d: AudioChunkStreamOutput, encoding, callback) {
    const encodedChunk = Buffer.alloc(
      4 // Index: UInt32
      + d.chunk.length
    );
    encodedChunk.writeUInt32LE(d.i, 0);
    d.chunk.copy(encodedChunk, 4);
    callback(null, encodedChunk);
  }
}

export class AudioChunkStreamDecoder extends Transform {
  constructor() {
    super({
      readableObjectMode: true,
    });
  }
  _transform(d: Buffer, encoding, callback) {
    callback(null, {
      i: d.readUInt32LE(0),
      chunk: d.subarray(4),
    });
  }
}