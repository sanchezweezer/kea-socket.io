import { getPluginContext } from 'kea';
import { observe } from './observe';

export const isFunction = (obj) => typeof obj === 'function';

export const isSocketIo = (obj) =>
  !!obj &&
  ((isFunction(obj.on) && isFunction(obj.emit)) || (Array.isArray(obj) && obj.every((item) => isSocketIo(item))));

export const trimNamespace = (namespaced) => namespaced.split('/').pop();

export const getEmitters = (name) => {
  const { emitters = {} } = getPluginContext('kea-socket.io');
  if (name) {
    return emitters[name];
  }
  return emitters;
};

export const getCurrentName = (name, prefix = '') => {
  if (name.indexOf(prefix) === 0) {
    return name.replace(prefix, '');
  }
  return name;
};

export const addSystemObserve = (socket) => {
  const { options = {} } = getPluginContext('kea-socket.io');
  const { SYSTEM_EVENTS = [] } = options;

  SYSTEM_EVENTS.forEach((eventName) => {
    const type = eventName;
    socket.on(type, (payload) => {
      observe({ type, payload, socket });
    });
  });
};
