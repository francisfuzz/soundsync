import SpeexResampler from 'speex-resampler';
import { Transform } from 'stream';
import { OpusEncoder, OpusApplication, OpusDecoder } from './opus';
import {
  AudioChunkStream, AudioChunkStreamOutput, AudioChunkStreamEncoder, AudioChunkStreamDecoder,
} from './chunk_stream';
import { OPUS_ENCODER_RATE, OPUS_ENCODER_CHUNK_SAMPLES_COUNT, OPUS_ENCODER_CHUNK_DURATION } from './constants';

export class OpusEncodeStream extends Transform {
  encoder: OpusEncoder;

  constructor(sampleRate: number, channels: number, application: OpusApplication) {
    super({
      objectMode: true,
    });
    this.encoder = new OpusEncoder(sampleRate, channels, application);
  }

  async _transform(data: AudioChunkStreamOutput, encoding, callback) {
    const frame = await this.encoder.encode(data.chunk);
    callback(null, {
      i: data.i,
      chunk: frame,
    });
  }
}

export class OpusDecodeStream extends Transform {
  decoder: OpusDecoder;

  constructor(sampleRate: number, channels: number) {
    super({
      objectMode: true,
    });
    this.decoder = new OpusDecoder(sampleRate, channels);
  }

  async _transform(data: AudioChunkStreamOutput, encoding, callback) {
    const decodedFrame = await this.decoder.decodeFloat(data.chunk);
    const output: AudioChunkStreamOutput = {
      i: data.i,
      chunk: Buffer.from(decodedFrame),
    };
    callback(null, output);
  }
}

export const createAudioEncodedStream = (sourceStream: NodeJS.ReadableStream, sourceRate: number, channels: number) => {
  let source = sourceStream;
  if (sourceRate !== OPUS_ENCODER_RATE) {
    const resampler = new SpeexResampler.TransformStream(channels, sourceRate, OPUS_ENCODER_RATE);
    source = source.pipe(resampler);
  }
  const chunkStream = new AudioChunkStream(
    source,
    OPUS_ENCODER_CHUNK_DURATION,
    OPUS_ENCODER_CHUNK_SAMPLES_COUNT * channels * 2,
  ); // *2 because this is 16bits so 2 bytes
  const opusEncoderStream = new OpusEncodeStream(OPUS_ENCODER_RATE, channels, OpusApplication.OPUS_APPLICATION_AUDIO);
  const chunkEncoder = new AudioChunkStreamEncoder();
  return chunkStream
    .pipe(opusEncoderStream)
    .pipe(chunkEncoder);
};

export const createAudioDecodedStream = (encodedStream: NodeJS.ReadableStream, channels: number) => {
  const chunkDecoderStream = new AudioChunkStreamDecoder();
  const opusDecoderStream = new OpusDecodeStream(OPUS_ENCODER_RATE, channels);
  return encodedStream
    .pipe(chunkDecoderStream)
    .pipe(opusDecoderStream);
};
