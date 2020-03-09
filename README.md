![NPM Version](https://img.shields.io/npm/v/kea-socket.io.svg)

Socket.io binding for Kea store

- kea-socket.io 0.1 works with kea 1.0+

# Documentation

[Read the documentation for Kea](https://kea.js.org/)

# Installation

Install via yarn or npm

```sh
npm install --save kea-socket.io
yarn add kea-socket.io
```

Then add it to the context:

```js
import socketPlugin from 'kea-socket.io';
// thunk or saga plugin needed to emit socket.io events
import thunkPlugin from 'kea-thunk';
import { resetContext } from 'kea';

resetContext({
  plugins: [thunkPlugin, socketPlugin]
});
```

# Usage

To use socket.emit, make sure your logic store has thunk or saga plugin. Then just take emitters from params `{ getEmitters }` and use it in your code.
Emitters is a object than contain all named sockets you pass to plugin. So default socket have `nsp === "/"`. Or you can pass to `getEmitters` param `name` and get needed socket directly.
<br/>
<br/>

To use event subscription just name your event like socket event. Add to it name prefix (`by default prefix === "socket_"`) and nsp without forward slash.
For example:

```sh
 socket event: testEvent
 prefix: socket_

 result action name: socket_testEvent

 if event pass from namespaced socket you should add nsp:
 nsp: /testNsp

 result action name: socket_testNsp_testEvent

 if event is reseve by socket.io to name you need to add sys_:
 socket_testNsp_sys_testEvent
```

Also, you can use global funcs for sockets. Right now there are two of them:

- reconnectAll - reconnect all sockets in plugin
- disconnectAll - disconnect all sockets in plugin

You can add your own global funcs.

<br/>
<br/>
So you can use this plugin, like so:

```js
const someLogic = kea({
  path: () => ['scenes', 'something', 'foobar'], // NEEDED!

  actions: () => ({
    socket_testEvent: ({ payload }) => payload,
    change: (value) => ({ value })
  }),

  reducers: ({ actions }) => ({
    persistedValue: [
      0,
      PropTypes.number,
      { persist: true },
      {
        [actions.change]: (_, payload) => payload.value
      }
    ]
  }),
  thunks: ({ getEmitters, emitterActions }) => ({
    testEmit: () => {
      // emit event to socket with default nsp ('/')
      getEmitters().default.emit('message', 'hello world');
      emitterActions.disconnectAll();
    },
    socket_anotherTestEvent: ({ payload }) => {
      // this is data from socket event
      console.log(payload);
    }
  })
});
```

if you don't want add prefix to your actions, you can add socketPrefix prop to your logic, it can be string, array or func (func({socket, nsp}) => return array or string):

```js
const someLogic = kea({
  path: () => ['scenes', 'something', 'foobar'], // NEEDED!
  socketPrefix: 'socket_', // this can be array or sync function({socket, nsp}) also
  actions: () => ({
    testEvent: ({ payload }) => payload,
    change: (value) => ({ value })
  }),

  reducers: ({ actions }) => ({
    persistedValue: [
      0,
      PropTypes.number,
      { persist: true },
      {
        [actions.change]: (_, payload) => payload.value
      }
    ]
  }),
  thunks: ({ getEmitters, emitterActions }) => ({
    testEmit: () => {
      // emit event to socket with default nsp ('/')
      getEmitters('default').emit('message', 'hello world');
      emitterActions.disconnectAll();
    },
    anotherTestEvent: ({ payload }) => {
      // this is data from socket event
      console.log(payload);
    }
  })
});
```

if you want to access to system socket.io events like `connect`, you need to add `sys_` to action name.

```js
// list of system events that reserve in socket.io
export const SYSTEM_EVENTS = [
  'connect',
  'error',
  'disconnect',
  'reconnect',
  'reconnect_attempt',
  'reconnecting',
  'reconnect_error',
  'reconnect_failed',
  'connect_error',
  'connect_timeout',
  'connecting',
  'ping',
  'pong'
];

// so to access:
const someLogic = kea({
  // other logic stuff
  thunks: () => ({
    socket_sys_connect: ({ payload }) => {
      // this is data from socket system event
      console.log(payload);
    }
  })
});
```

# Options

You may optionally configure the plugin by passing in some options:

```js
import socketPlugin from 'kea-socket.io';
import { resetContext } from 'kea';

resetContext({
  plugins: [
    socketPlugin({
      // in case you want to replace this, e.g. for tests or non browser environments
      sockets: [socketIo('http://localhost:9066', { path: '/api/sockets' })],

      // added to all events names before all
      prefix: 'example_',

      // to change on witch events connector need to call error handle
      ERROR_EVENTS: ['error', 'api-error'],

      // to change the error handle, func({ error, logic, input, socket })
      // if func return === false, then event handle stop
      errorHandler: ({ error, socket, getKeaContext } = {}) => {
        console.error('[kea-socket.io] ' + error);
        console.error(socket);
        console.error(getKeaContext());
      },
      // to change mapping of events from socket to store, func({ name })
      mapSocketEventToStore: ({ name }) => name,

      // to add your own global funcs to sockets, funcs don't have any params
      emitterActions: {}
    })
  ]
});
```

# EmitterActions

- disconnectAll()
- reconnectAll()
- addNewEmitter({socket}) - pass socket from socket.io to function
- removeEmitterByNameSpace({name, options}) - pass name of socket (like: `default` or `namespaced`)
  - options
    - stopEmitter - by default true, if you don't need to disconnect pass `false`

For access to emitters in your emitterActions you can use:

```js
const { emitters, options } = getPluginContext('kea-socket.io');
```
