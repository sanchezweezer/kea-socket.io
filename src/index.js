import { getPluginContext, setPluginContext } from 'kea';

import { defaultsOptions } from './config';
import { observe } from './observe';
import { emitterActions, patchSocket } from './actions';

const localStoragePlugin = ({ sockets = [], ...options } = {}) => ({
  name: 'kea-socket.io',

  events: {
    afterPlugin() {
      const emitters = {};

      /** add all named and default sockets + options to context  */
      sockets.forEach((socket) => {
        patchSocket(socket);
        emitters[socket.nsp.substr(1) || 'default'] = socket;
        socket.on('*', ({ data } = {}) => {
          const [type, payload] = data;
          observe({ type, payload, socket });
        });
      });
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
    socketEmitter: { after: 'thunks' },
    socketSubscribe: { after: 'socketEmitter' }
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
      if (input.socketPrefix) {
        logic.socketPrefix = input.socketPrefix;
      }
    }
  }
});

export default localStoragePlugin;
