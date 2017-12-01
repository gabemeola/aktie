import { Component } from 'react';
import PropTypes from 'prop-types';
import Aktie from './Aktie';


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
export default class Provider extends Component {
    static propTypes = {
        store: PropTypes.instanceOf(Aktie).isRequired,
        children: PropTypes.element.isRequired,
    }
    static childContextTypes = {
        aktie: PropTypes.object,
    }
    constructor({ store }) {
        super();

        this.store = store;
    }
    getChildContext() {
        return {
            aktie: this.store,
        };
    }
    render() {
        return this.props.children;
    }
}
