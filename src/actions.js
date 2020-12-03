import { getPluginContext, setPluginContext } from 'kea';
import io from 'socket.io-client';

import { addSystemObserve, isSocketIo, wildcardMiddleware } from './utils';
import { observe } from './observe';

export const patchSocket = wildcardMiddleware(io.Manager);

export const emitterActions = Object.freeze({
  removeEmitterByNameSpace: ({ name, options = {} }) => {
    const { emitters = {}, ...rest } = getPluginContext('kea-socket.io');

    const { [name]: deletedEmitter, ...newEmitters } = emitters;
    const { stopEmitter = true } = options;
    if (stopEmitter) {
      if (deletedEmitter && deletedEmitter.connected) {
        deletedEmitter.close();
      }
    }
    setPluginContext('kea-socket.io', {
      ...rest,
      emitters: newEmitters
    });
  },
  addNewEmitter: ({ socket }) => {
    const { emitters = {}, ...rest } = getPluginContext('kea-socket.io');

    const newEmitters = { ...emitters };
    patchSocket(socket);
    addSystemObserve(socket);
    socket.on('*', ({ data } = {}) => {
      const [type, payload] = data;
      observe({ type, payload, socket });
    });
    newEmitters[socket.nsp.substr(1) || 'default'] = socket;
    setPluginContext('kea-socket.io', {
      ...rest,
      emitters: newEmitters
    });
  },
  disconnectAll: () => {
    const { emitters } = getPluginContext('kea-socket.io');
    for (let name in emitters) {
      if (emitters.hasOwnProperty(name)) {
        let socket = emitters[name];
        if (isSocketIo(socket) && socket.io.readyState === 'open') socket.disconnect();
      }
    }
  },

  reconnectAll: () => {
    const { emitters } = getPluginContext('kea-socket.io');
    for (let name in emitters) {
      if (emitters.hasOwnProperty(name)) {
        let socket = emitters[name];
        if (isSocketIo(socket) && socket.io.readyState !== 'open') {
          socket.io.reconnecting = undefined;
          socket.io._reconnection = true;
          socket.connect();
        }
      }
    }
  }
});
