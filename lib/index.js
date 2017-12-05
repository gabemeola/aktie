(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('react'), require('prop-types'), require('lodash/debounce')) :
	typeof define === 'function' && define.amd ? define(['exports', 'react', 'prop-types', 'lodash/debounce'], factory) :
	(factory((global.aktie = {}),global.React,global.PropTypes,global.debounce));
}(this, (function (exports,React,PropTypes,debounce) { 'use strict';

var React__default = 'default' in React ? React['default'] : React;
PropTypes = PropTypes && PropTypes.hasOwnProperty('default') ? PropTypes['default'] : PropTypes;
debounce = debounce && debounce.hasOwnProperty('default') ? debounce['default'] : debounce;

class Module {
    constructor({
        moduleName,
        types,
        initialState,
        reducers = [],
        hydrate = []
    }, hydrationState) {
        if (moduleName == null) {
            console.error('[Aktie] Modules must have a "moduleName" field set');
            return;
        }

        this.name = moduleName;
        this.types = types;
        this.initialState = initialState;
        this.store = initialState;
        this._subscribers = [];

        this._updateState = this._updateState.bind(this);
        this.reducers = [...reducers, this._updateState];

        if (hydrate.length !== 0 || hydrationState != null) {
            const hydrateReducers = [...hydrate, this._updateState];
            this._reduce(hydrateReducers, Object.assign({}, this.store, hydrationState || {}));
        }

        // Debounce notifySubscriber
        this._notifySubscribers = debounce(this._notifySubscribers, 200);
    }
    _validateState(state) {
        if (process.env.NODE_ENV !== 'production') {
            // Don't block any critical tasks.
            setTimeout(() => {
                // Check Types
                PropTypes.checkPropTypes(this.types, state, 'state', `[Aktie] ${this.name} Module`);

                const keys = Object.keys(state);
                // Display a Console Error if user adds
                // a key that wasn't declared in initialState.
                for (let i = 0; i < keys.length; i++) {
                    if (this.initialState[keys[i]] == null) {
                        console.error(`[Aktie] ${this.name} Module: ` + `Key "${keys[i]}" doesn't not exist in module's initialState. ` + 'Did you forget to add this?');
                    }
                }
            }, 0);
        }
    }
    _reduce(reducers, state) {
        reducers.reduce((accumulator, reducer) => reducer(accumulator, this), state);
    }
    // TODO: Need a mergeState() to perform your own checks instead of Object.assign.
    _updateState(stateToMerge) {
        /**
         * Promise.resolve will run synchronously if a user has synchronous reducers.
         * If a user uses async / Promise reducers, then this allow a user to decide
         * whether to resolve reduced state async or sync.
         */
        Promise.resolve(stateToMerge).then(resolvedState => {
            if (resolvedState == null) {
                console.error(`[Aktie] ${this.name} Module did not receive a valid state. ` + 'Make sure your reducers return back a state object.');
                return;
            }

            const nextState = Object.assign({}, this.store, resolvedState);
            console.log('nextState', nextState);

            try {
                // Run Checks on merge state.
                this._validateState(nextState);
                this.store = nextState;
                this._notifySubscribers();
            } catch (err) {
                console.error(`[Aktie] Error when updating state in ${this.name}.\n${err}`);
            }
        });
    }
    set(key, value) {
        // If user passes an Object, merge it into state.
        if (typeof key === 'object') return this._reduce(this.reducers, key);

        // Return if value is the same as current value,
        // or if value is null, undefined, or an empty string
        if (value === this.store[key] || value == null) return true;

        return this._reduce(this.reducers, {
            [key]: value
        });
    }
    subscribe(cb) {
        // Push a new Subscriber
        const subscriberLength = this._subscribers.push(cb);

        const unsubscribe = () => this.unsubscribe(subscriberLength - 1);

        // Return an Array with store, subscriber index, and setState function
        return [unsubscribe, this.store];
    }
    unsubscribe(index) {
        // Set the index to undefined.
        // This is a faster OP than using, Array.slice.
        // May change in future if this Array grows too large.
        this._subscribers[index] = undefined;
    }
    _notifySubscribers() {
        // Run on Next Tick
        setTimeout(() => {
            // For Loop for Speed
            for (let i = 0; i < this._subscribers.length; i++) {
                // Check if subscribers is not undefined
                if (typeof this._subscribers[i] !== 'undefined') {
                    const callback = this._subscribers[i];

                    callback(this.store);
                }
            }
        }, 0);
    }
    /**
     * Returns a copy of the store for inspection.
     *
     * @return {Object}
     */
    get inspect() {
        return Object.assign({}, this.store);
    }
}

// function displayError(functionName, msg) {
//     console.error(new Error(`[Aktie] Error in ${functionName}`, msg));
// }


/**
 * Simple Scope Global State Management
 *
 * @module Aktie
 * @class
 */
class Aktie {
    constructor(hydrateState = {}) {
        if (typeof hydrateState !== 'object') {
            console.error('[Aktie] Hydration State must be an object.');
            return;
        }

        this._hydrationStore = hydrateState;
        this._moduleStore = {};
    }
    setModules(moduleDeclaration) {
        if (moduleDeclaration instanceof Array) {
            return moduleDeclaration.map(module => this.setModules(module));
        }
        // Return if it already exists in store
        if (this._moduleStore[moduleDeclaration.moduleName]) return this._moduleStore[moduleDeclaration.moduleName];

        // Create a new Module State from declaration config
        const module = new Module(moduleDeclaration, this._hydrationStore[moduleDeclaration.moduleName]);
        this._moduleStore[moduleDeclaration.moduleName] = module;

        // Letting hydration store modules be garbage collected
        this._hydrationStore[moduleDeclaration.moduleName] = null;

        return module;
    }
    serialize(removeInitialState = true) {
        const modules = Object.keys(this._moduleStore);

        return modules.reduce((accumulator, module) => {
            // If moduleStore hasn't change, continue.
            if (removeInitialState === true && this._moduleStore[module].store === this._moduleStore[module].initialState) {
                return accumulator;
            }

            return Object.assign(accumulator, {
                [module]: this._moduleStore[module].store
            });
        }, {});
    }
    /**
     * Returns a copy of the store for inspection.
     *
     * @return {Object}
     */
    get inspect() {
        return this.serialize(false);
    }
}

/**
 * Top Root Component in charge of passing down
 * Predux store to lower level components using Connect.
 *
 * Takes a required store props which should be an
 * instance of Predux
 *
 * This component uses React Context so be mindful on
 * context API changes with updating React Dependency.
 */
class Provider extends React.Component {
    constructor({ store }) {
        super();

        this.store = store;
    }
    getChildContext() {
        return {
            aktie: this.store
        };
    }
    render() {
        return this.props.children;
    }
}
Provider.propTypes = {
    store: PropTypes.instanceOf(Aktie).isRequired,
    children: PropTypes.element.isRequired
};
Provider.childContextTypes = {
    aktie: PropTypes.object
};

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

/**
 * Higher Order Component for updating components
 * Dynamically from Aktie State.
 * This HOC will give passComponent request Aktie items
 * as props, as well as aktie store instance as a prop.
 *
 *
 * This function takes the stateProps from Aktie
 * that you would like your component to update to.
 *
 * After that this function take the Component that you
 * would like to Render.
 * Normally this is the same component that you would export as default.
 *
 * @param {Array} moduleDeclarations - Array of modules to subscribe to
 * @param PassedComponent - React Passed Component
 */
const connect = (moduleDeclarations = []) => PassedComponent => {
    var _class, _temp;

    return _temp = _class = class WrappedComponent extends React.Component {
        constructor(_props, context) {
            super();

            // Array of ids to unsubscribe
            // from when componentWillUnmount

            this.updateCallback = nextState => {
                this.setState(nextState);
            };

            this.toUnsubscribeFrom = [];

            /**
             * Reduce over the stateProps Array and
             * subscribe to the keys from aktie.
             */
            this.state = moduleDeclarations.reduce((accumulator, moduleDec) => {
                // eslint-disable-next-line no-param-reassign
                if (accumulator.modules == null) accumulator.modules = {};

                // Set Module's State in Aktie Global Store
                const module = context.aktie.setModules(moduleDec);
                // Subscribe and grab the value and subscriberId
                const [unsubscribe, moduleState] = module.subscribe(this.updateCallback);
                // Push the subscriberId to idsToUnsubscribeFrom
                this.toUnsubscribeFrom.push(unsubscribe);

                // Add the subscribed value to the state object
                return Object.assign(accumulator, Object.assign({}, moduleState, {
                    modules: Object.assign(accumulator.modules, {
                        [module.name]: module
                    })
                }));
            }, {});
        }
        /**
         * When component will unmount, un-register all of the subscriptions
         * at the given id (index) from aktie.subscribe stored in this.idsToUnsubscribeFrom
         */
        componentWillUnmount() {
            // For loop for speed
            for (let i = 0; i < this.toUnsubscribeFrom.length; i++) {
                // Invoke the un-subscription
                this.toUnsubscribeFrom[i]();
            }
        }
        /**
         * Callback function for updating the
         * state key value with what changed.
         *
         * @param {Object} nextState
         */

        /**
         * Return the decorated PassedComponent
         */
        render() {
            return React__default.createElement(PassedComponent, _extends({}, this.state, this.props));
        }
    }, _class.displayName = `Connect${PassedComponent.displayName || PassedComponent.name}`, _class.contextTypes = {
        aktie: PropTypes.object
    }, _temp;
};

/**
 * Aktie createion implementation wrapper for
 * creating a new Aktie store.
 *
 * @param {Object} [hydrateState] - Object for modules to hydrate with
 * @return {Aktie} - Returns Aktie Instance
 */
function createStore(hydrateState) {
  return new Aktie(hydrateState);
}

// Re-Exporting for Easier Imports

exports.Provider = Provider;
exports.connect = connect;
exports.createStore = createStore;
exports.Aktie = Aktie;
exports.Module = Module;

Object.defineProperty(exports, '__esModule', { value: true });

})));
