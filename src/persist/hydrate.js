import supportsDisk from './supportsDisk';


export default function persistHyrdation(state, module) {
    if (supportsDisk === true) {
        const persisted = localStorage.getItem(`aktiePersist-${module.name}`);

        return Object.assign(state, JSON.parse(persisted));
    }

    return state;
}
