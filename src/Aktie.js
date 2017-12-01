import Module from './Module';


// function displayError(functionName, msg) {
//     console.error(new Error(`[Aktie] Error in ${functionName}`, msg));
// }


/**
 * Simple Scope Global State Management
 *
 * @module Aktie
 * @class
 */
export default class Aktie {
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
            return moduleDeclaration.map((module) => this.setModules(module));
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
            if (
                removeInitialState === true &&
                this._moduleStore[module].store === this._moduleStore[module].initialState
            ) {
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
