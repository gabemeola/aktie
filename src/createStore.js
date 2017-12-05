import Aktie from './Aktie';


/**
 * Aktie createion implementation wrapper for
 * creating a new Aktie store.
 *
 * @param {Object} [hydrateState] - Object for modules to hydrate with
 * @return {Aktie} - Returns Aktie Instance
 */
export default function createStore(hydrateState) {
    return new Aktie(hydrateState);
}
