import { getContext, getPluginContext } from 'kea';
import { trimNamespace, getCurrentName } from './utils';

const callActions = (logic, currentPrefix, storeActionName, payload) => {
  const currentName = currentPrefix ? getCurrentName(storeActionName, currentPrefix) : storeActionName;
  if (Object.keys(logic.actions).includes(currentName)) {
    /** call action */
    const func = logic.actions[currentName];
    if (typeof func === 'function') {
      func({ payload });
    }
  }
};

export const observe = ({ type, payload, socket }) => {
  /** error handle */
  const { options = {} } = getPluginContext('kea-socket.io');
  const { errorHandler, ERROR_EVENTS = [], SYSTEM_EVENTS = [], mapSocketEventToStore, prefix = '' } = options;
  if (ERROR_EVENTS.includes(type)) {
    errorHandler({ error: payload, getKeaContext: getContext, socket });
  }

  const keaContext = getContext();

  const { mount: { mounted = {} } = {} } = keaContext;

  /** action type logic */
  const namespace = trimNamespace(socket.nsp);
  let storeActionName = type;
  if (SYSTEM_EVENTS.includes(type)) {
    storeActionName = 'sys_' + storeActionName;
  }
  storeActionName = namespace ? namespace + '_' + storeActionName : storeActionName;
  storeActionName = prefix ? prefix + storeActionName : storeActionName;
  storeActionName = mapSocketEventToStore({ name: storeActionName });

  /** find action */
  Object.keys(mounted).forEach((logicKey) => {
    const logic = mounted[logicKey];
    if (logic) {
      const logicPrefix =
        typeof logic.socketPrefix === 'function' ? logic.socketPrefix({ socket, nsp: namespace }) : logic.socketPrefix;
      /** make prefix look like array */
      const prefixArray = Array.isArray(logicPrefix) ? logicPrefix : [logicPrefix];

      prefixArray.forEach((item) => callActions(logic, item, storeActionName, payload));
    }
  });
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
