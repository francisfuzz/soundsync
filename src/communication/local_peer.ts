import _ from 'lodash';
import { ControllerMessage } from './messages';
import { Peer } from './peer';
import { getConfigField } from '../coordinator/config';

class LocalPeer extends Peer {
  constructor({ uuid, name }) {
    super({uuid, name});
    this.state = "connected";
    this.emit('connected');
  }

  sendControllerMessage(message: ControllerMessage) {
    this.emit(`controllerMessage:all`, {peer: this, message});
    this.emit(`controllerMessage:${message.type}`, {peer: this, message});
  }
}

let localPeer;
export const getLocalPeer = () => {
  if (!localPeer) {
    localPeer = new LocalPeer({
      name: getConfigField('name'),
      uuid: getConfigField('uuid'),
    });
  }
  return localPeer;
}