import { getContext, getPluginContext, setPluginContext } from 'kea';
import wildcardMiddleware from 'socketio-wildcard';
import io from 'socket.io-client';

import { isSocketIo } from './utils';
import { observe } from './observe';

export const patchSocket = wildcardMiddleware(io.Manager);

export const forAllLogic = (cb) => {
  /** inject to all currentLogic */
  const keaContext = getContext();

  const { mount: { mounted = {} } = {} } = keaContext;

  Object.keys(mounted).forEach((logicKey) => {
    const logic = mounted[logicKey];

    cb(logic);
  });
};

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

    /** inject to all currentLogic */
    forAllLogic((logic) => {
      logic.emitters = { ...newEmitters };
    });
  },
  addNewEmitter: ({ socket }) => {
    const { emitters = {}, ...rest } = getPluginContext('kea-socket.io');

    const newEmitters = { ...emitters };
    patchSocket(socket);
    socket.on('*', ({ data } = {}) => {
      const [type, payload] = data;
      observe({ type, payload, socket });
    });
    newEmitters[socket.nsp.substr(1) || 'default'] = socket;
    setPluginContext('kea-socket.io', {
      ...rest,
      emitters: newEmitters
    });

    /** inject to all currentLogic */
    forAllLogic((logic) => {
      logic.emitters = { ...newEmitters };
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
