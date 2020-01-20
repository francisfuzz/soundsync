import { RtAudio } from 'audify';

let rtAudio: RtAudio;

export const getRtAudio = () => {
  if (!rtAudio) {
    rtAudio = new RtAudio();
  }
  return rtAudio;
}

export const getAudioDevices = () => {
  return getRtAudio().getDevices();
}
