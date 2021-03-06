import { resolve } from 'path';
import { promises as fsPromises, createWriteStream, createReadStream } from 'fs';

import debug from 'debug';
import { Extract } from 'unzipper';
import { getConfigDir } from '../coordinator/config';
import { sha1sum, once } from './misc';

// fsPromise is undefined when executed in a web browser context
const { readFile, chmod } = fsPromises || {};

const l = debug(`soundsync:depsDownloader`);
import request = require('superagent');

const deps = {
  librespot: {
    isZip: false,
    executableName: null,
    'linux-x64': {
      url: 'https://github.com/geekuillaume/librespot/releases/download/v0.1.1/librespot-linux-x64-featureless',
      sha1: 'ef8a32d0e846e8708b389460282545be3383bb05',
    },
    'linux-arm': {
      url: 'https://github.com/geekuillaume/librespot/releases/download/v0.1.1/librespot-linux-arm-featureless',
      sha1: '95a3414d546bd106145f87943d6ed83bc347f339',
    },
  },
  shairport: {
    isZip: true,
    executableName: 'shairport-sync',
    'linux-x64': {
      url: 'https://github.com/geekuillaume/shairport-sync/releases/download/20200428/shairport-sync-Linux-x64.zip',
      sha1: 'ee8594c0b8387b1a1c85c083dbf74ee3e1e85ffd',
    },
    'linus-arm': {
      url: 'https://github.com/geekuillaume/shairport-sync/releases/download/20200428/shairport-sync-Linux-arm.zip',
      sha1: 'e1575248de0dd17d627212b44d999025197061e2',
    },
    'darwin-x64': {
      url: 'https://github.com/geekuillaume/shairport-sync/releases/download/20200428/shairport-sync-macOS-x64.zip',
      sha1: 'e981afabe08bad1aafab1ea98769aab97ede56e8',
    },
  },
};

const depPath = <T extends keyof typeof deps>(depName: T) => resolve(getConfigDir(), depName);

export const ensureDep = async <T extends keyof typeof deps>(depName: T) => {
  const dep = deps[depName];
  const downloadInfo = dep[`${process.platform}-${process.arch}`];
  if (!downloadInfo) {
    throw new Error('Arch or os is not supported');
  }
  let path = depPath(depName);
  if (dep.isZip) {
    path = `${path}.zip`;
  }
  try {
    l(`Ensuring dep ${depName} at ${path}`);
    const file = await readFile(path);
    const sha1 = sha1sum(file);
    if (sha1 !== downloadInfo.sha1) {
      throw new Error('Hash do not match');
    }
  } catch (e) {
    // TODO: on error, remove zip folder
    l(`Dep is not suitable, downloading from ${downloadInfo.url}`, e.message);
    const req = request.get(downloadInfo.url);
    const writeStream = createWriteStream(path);
    req.pipe(writeStream);
    await once(writeStream, 'finish');
    if (deps[depName].isZip) {
      const zipStream = createReadStream(path);
      const unzipStream = Extract({
        path: depPath(depName),
      });
      zipStream.pipe(unzipStream);
      await once(unzipStream, 'finish');
      const executablePath = resolve(depPath(depName), dep.executableName);
      await chmod(executablePath, '555');
    } else {
      await chmod(path, '555');
    }
    l(`Downloaded dep to ${path}`);
  }
  if (dep.isZip) {
    return resolve(depPath(depName), dep.executableName);
  }
  return path;
};
