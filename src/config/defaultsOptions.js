import { SYSTEM_EVENTS } from './constants';

export const defaultsOptions = Object.freeze({
  prefix: 'socket_',
  ERROR_EVENTS: ['error', 'api-error'],
  SYSTEM_EVENTS,
  errorHandler: ({ error, getKeaContext, socket } = {}) => {
    console.error('[kea-socket.io] ' + error);
    console.error(socket);
    console.error(getKeaContext());
  },
  mapSocketEventToStore: ({ name }) => name,
  emitterActions: {}
});
