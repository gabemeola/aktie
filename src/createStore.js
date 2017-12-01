import Predux from './Predux';


/**
 * Predux createion implementation wrapper for
 * creating a new Predux store.
 *
 * @param {Object} [hydrateState] - Object for modules to hydrate with
 * @return {Predux} - Returns Predux Instance
 */
export default function createStore(hydrateState) {
    return new Predux(hydrateState);
}
