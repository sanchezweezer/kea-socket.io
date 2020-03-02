import { getPluginContext, setPluginContext } from 'kea';

import { defaultsOptions } from './config';
import { observe } from './observe';
import { patchSocket, emitterActions } from './actions';
import { getEmitters } from './utils';

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

    beforeMount(logic) {
      const { emitters, options = {} } = getPluginContext('kea-socket.io');
      const { emitterActions: additionalActions } = options;

      logic.emitters = { ...emitters };
      logic.getEmitters = getEmitters;
      logic.emitterActions = { ...emitterActions, ...additionalActions };
    },

    beforeCloseContext(context) {
      /** reset context ? */
      setPluginContext('kea-socket.io', { emitters: {}, options: { ...defaultsOptions } });
    }
  },

  buildOrder: {
    socketSubscribe: { after: 'thunks' }
  },

  buildSteps: {
    socketSubscribe(logic, input) {
      if (input.socketPrefix) {
        logic.socketPrefix = input.socketPrefix;
      }
    }
  }
});

export default localStoragePlugin;
