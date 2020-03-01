export const defaultsOptions = Object.freeze({
  prefix: 'socket_',
  ERROR_EVENTS: ['error', 'api-error'],
  errorHandler: ({ error, getKeaContext, socket } = {}) => {
    console.error('[kea-socket.io] ' + error);
    console.error(socket);
    console.error(getKeaContext());
  },
  mapSocketEventToStore: ({ name }) => name,
  emitterActions: {}
});
