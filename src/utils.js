export const isFunction = (obj) => typeof obj === 'function';

export const isSocketIo = (obj) =>
  !!obj &&
  ((isFunction(obj.on) && isFunction(obj.emit)) || (Array.isArray(obj) && obj.every((item) => isSocketIo(item))));

export const trimNamespace = (namespaced) => namespaced.split('/').pop();

export const errorHandle = (socket, store, { errorHandler, errorEvents }) => {
  errorEvents.forEach((eventName) => {
    socket.on(eventName, (error) => errorHandler(error, socket, store));
  });
};
