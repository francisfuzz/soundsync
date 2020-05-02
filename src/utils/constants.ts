export const CONTROLLER_CHANNEL_ID = 42;
export const OPUS_ENCODER_RATE = 48000;
export const OPUS_ENCODER_CHUNKS_PER_SECONDS = 100;
export const OPUS_ENCODER_CHUNK_DURATION = 1000 / OPUS_ENCODER_CHUNKS_PER_SECONDS;
export const OPUS_ENCODER_CHUNK_SAMPLES_COUNT = OPUS_ENCODER_RATE / OPUS_ENCODER_CHUNKS_PER_SECONDS; // 100 samples per second = 10ms per sample
export const NO_RESPONSE_TIMEOUT = 5000; // if there if no response from a wrtc peer during this time, assume connection is lost
export const HEARTBEAT_INTERVAL = 300; // send a heartbeat every 300 ms
export const HEARTBEAT_JITTER = 100; // randomize heartbeat sending interval between peers
export const AUDIO_CHANNEL_OPTIONS: RTCDataChannelInit = {
  ordered: false,
  maxPacketLifeTime: 500,
};
export const ICE_GATHERING_TIMEOUT = 20000;

export const TIMEKEEPER_REFRESH_INTERVAL = 10000;
export const FORCED_STREAM_LATENCY = 200;
export const SOUNDSYNC_VERSION = '0.1.0';

// if more than 10ms between real position and emitted position than resync stream, this will emit an audible glitch
export const MIN_SKEW_TO_RESYNC_AUDIO = 10;

export const RENDEZVOUS_SERVICE_URL = 'http://127.0.0.1:6612';
export const RENDEZVOUS_SERVICE_REGISTER_INTERVAL = 1000 * 60 * 60 * 4; // every 4 hours
