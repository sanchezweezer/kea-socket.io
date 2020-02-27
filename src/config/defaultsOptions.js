export const defaultsOptions = Object.freeze({
  prefix: 'socket_',
  ERROR_EVENTS: ['error', 'api-error'],
  errorHandler: ({ error, logic, input, socket } = {}) => {
    console.error('[kea-socket.io] ' + error);
    console.error(socket);
    console.error(logic);
  },
  mapSocketEventToStore: ({ name }) => name,
  emitterActions: {}
});
