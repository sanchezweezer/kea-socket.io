/* global test, expect, beforeEach */
import { kea, resetContext, getStore, activatePlugin, getContext } from 'kea';
import thunkPlugin from 'kea-thunk';
import socketPlugin from '../index'; // install the plugin

import './helper/jsdom';
import React from 'react';
import PropTypes from 'prop-types';
import { mount, configure } from 'enzyme';
import { Provider } from 'react-redux';
import Adapter from 'enzyme-adapter-react-16';

configure({ adapter: new Adapter() });

beforeEach(() => {
  resetContext();
  activatePlugin(thunkPlugin);
  activatePlugin(socketPlugin);
});

test('thunks are bound as actions', () => {
  const store = getStore();

  let emitterTest = false;

  const socketLogic = kea({
    path: () => ['scenes', 'sockets', 'first'],
    actions: ({ constants }) => ({
      updateName: (name) => ({ name })
    }),
    thunks: ({ actions, dispatch, getState, emitters }) => ({
      updateNameAsync: (name) => {
        emitterTest = { ...emitters };
        actions.updateName(name);
      }
    }),
    reducers: ({ actions, constants, emitter }) => ({
      name: [
        'chirpy',
        PropTypes.string,
        {
          [actions.updateName]: (state, payload) => payload.name
        }
      ]
    })
  });

  expect(getContext().plugins.activated.map((p) => p.name)).toEqual(['core', 'thunk', 'kea-socket.io']);
  expect(socketLogic._isKea).toBe(true);
  expect(socketLogic._isKeaWithKey).toBe(false);

  const SampleComponent = ({ name, actions: { updateName, updateNameAsync } }) => (
    <div>
      <div className="name">{name}</div>
      <div className="updateName" onClick={() => updateName('george')}>
        updateName
      </div>
      <div className="updateNameAsync" onClick={() => updateNameAsync('michael')}>
        updateNameAsync
      </div>
    </div>
  );
  const ConnectedComponent = socketLogic(SampleComponent);

  const wrapper = mount(
    <Provider store={store}>
      <ConnectedComponent id={12} />
    </Provider>
  );

  expect(Object.keys(socketLogic.actions)).toEqual(['updateName', 'updateNameAsync']);
  expect(Object.keys(socketLogic.selectors).sort()).toEqual(['name']);

  expect(!!emitterTest).toBe(false);

  wrapper
    .find('.updateNameAsync')
    .props()
    .onClick();

  expect(!!emitterTest).toBe(true);

  wrapper.unmount();
});
