import { getPluginContext, setPluginContext } from 'kea';
import io from 'socket.io-client';
import wildcardMiddleware from 'socketio-wildcard';

import { isSocketIo, trimNamespace } from './utils';
import { SYSTEM_EVENTS, defaultsOptions } from './config';

const patch = wildcardMiddleware(io.Manager);

const emitters = {};

const emitterActions = Object.freeze({
  addNewEmitter: (socket) => {
    const { emitters = {}, ...rest } = getPluginContext('kea-socket.io');
    const newEmitters = { ...emitters };
    patch(socket);
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

const observe = ({ type, payload, logic, input, socket }) => {
  /** error handle */
  const { options = {} } = getPluginContext('kea-socket.io');
  const { errorHandler, ERROR_EVENTS = [], mapSocketEventToStore, prefix = '' } = options;
  if (ERROR_EVENTS.includes(type)) {
    errorHandler({ error: payload, logic, input, socket });
  }

  /** action type logic */
  const namespace = trimNamespace(socket.nsp);
  let storeActionName = namespace ? namespace + '_' + type : type;
  if (SYSTEM_EVENTS.includes(type)) {
    storeActionName = 'sys_' + storeActionName;
  }
  if (SYSTEM_EVENTS.includes(type)) {
    storeActionName = 'sys_' + type;
  }
  if (prefix !== logic.socketPrefix) {
    storeActionName = prefix + storeActionName;
  }
  storeActionName = mapSocketEventToStore({ name: storeActionName });

  /** call action */
  const func = logic.actions[storeActionName];
  if (typeof func === 'function') {
    func({ payload });
  }
};

const localStoragePlugin = ({ sockets = [], ...options } = {}) => ({
  name: 'kea-socket.io',

  events: {
    afterPlugin() {
      /** add all named and default sockets + options to context  */
      if (!Object.keys(emitters).length) {
        sockets.forEach((socket) => {
          patch(socket);
          emitters[socket.nsp.substr(1) || 'default'] = socket;
        });
      }
      setPluginContext('kea-socket.io', {
        emitters: { ...emitters },
        options: { ...defaultsOptions, ...options }
      });
    },

    beforeCloseContext(context) {
      /** reset context ? */
      setPluginContext('kea-socket.io', { emitters: {}, options: { ...defaultsOptions } });
    }
  },

  buildOrder: {
    socketEmitter: { after: 'thunk' },
    socketSubscribe: { after: 'socketSubscribe' }
  },

  buildSteps: {
    socketEmitter(logic, input) {
      if (!(input.thunks || input.sagas || (input.connect && input.connect.sagas))) {
        return;
      }

      const { emitters, options = {} } = getPluginContext('kea-socket.io');
      const { emitterActions: additionalActions } = options;

      logic.emitters = { ...emitters };
      logic.emitterActions = { ...emitterActions, ...additionalActions };
    },
    socketSubscribe(logic, input) {
      if (!input.actions) {
        return;
      }

      if (input.socketPrefix) {
        logic.socketPrefix = input.socketPrefix;
      }

      const { emitters } = getPluginContext('kea-socket.io');

      Object.keys(emitters).forEach((socketKey) => {
        const socket = emitters[socketKey];
        socket.on('*', ({ data } = {}) => {
          const [type, payload] = data;
          observe({ type, payload, logic, input, socket });
        });
      });
    },
    socketSystemSubscribe(logic, input) {}
  }
});

export default localStoragePlugin;
