import { getPluginContext } from 'kea';
import { SYSTEM_EVENTS } from './config';
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
    name.replace(prefix, '');
  }
  return name;
};

export const addSystemObserve = (socket) => {
  SYSTEM_EVENTS.forEach((eventName) => {
    const type = eventName;
    socket.on(type, (payload) => {
      observe({ type, payload, socket });
    });
  });
};
