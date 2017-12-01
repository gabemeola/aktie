/* eslint-disable no-param-reassign */
import persistReducer from './reducer';
import persistHydrate from './hydrate';
import supportsDisk from './supportsDisk';


export default function persistAdapter(dec) {
    if (supportsDisk === true) {
        if (dec.reducers == null) dec.reducers = [];
        dec.reducers.push(persistReducer);

        if (dec.hydrate == null) dec.hydrate = [];
        dec.hydrate.push(persistHydrate);
    }


    return dec;
}
