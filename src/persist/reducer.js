import supportsDisk from './supportsDisk';


export default function persistReducer(state, module) {
    if (supportsDisk === true) {
        Promise.resolve(state).then((res) => {
            localStorage.setItem(`aktiePersist-${module.name}`, JSON.stringify(res));
        });
    }


    return state;
}
