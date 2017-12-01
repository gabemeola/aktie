import React, { Component } from 'react';
import PropTypes from 'prop-types';


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
const connect = (moduleDeclarations = []) => (PassedComponent) =>
    class WrappedComponent extends Component {
        static displayName = `Connect${PassedComponent.displayName || PassedComponent.name}`
        static contextTypes = {
            aktie: PropTypes.object,
        }
        constructor(_props, context) {
            super();

            // Array of ids to unsubscribe
            // from when componentWillUnmount
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
                return Object.assign(accumulator, {
                    ...moduleState,
                    modules: Object.assign(accumulator.modules, {
                        [module.name]: module
                    })
                });
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
        updateCallback = (nextState) => {
            this.setState(nextState);
        }
        /**
         * Return the decorated PassedComponent
         */
        render() {
            return <PassedComponent {...this.state} {...this.props} />;
        }
    };


export default connect;
