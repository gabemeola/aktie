import PropTypes from 'prop-types';
import debounce from 'lodash/debounce';


export default class Module {
    constructor({
        moduleName,
        types,
        initialState,
        reducers = [],
        hydrate = [],
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
            this._reduce(
                hydrateReducers,
                Object.assign({}, this.store, hydrationState || {})
            );
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
                        console.error(
                            `[Aktie] ${this.name} Module: `
                             + `Key "${keys[i]}" doesn't not exist in module's initialState. `
                             + 'Did you forget to add this?'
                        );
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
        Promise.resolve(stateToMerge)
            .then((resolvedState) => {
                if (resolvedState == null) {
                    console.error(
                        `[Aktie] ${this.name} Module did not receive a valid state. `
                        + 'Make sure your reducers return back a state object.'
                    );
                    return;
                }

                const nextState = Object.assign(
                    {},
                    this.store,
                    resolvedState,
                );
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
            [key]: value,
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
        return { ...this.store };
    }
}
