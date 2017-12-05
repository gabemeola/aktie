const path = require('path');
const pkg = require('./package.json');
import babel from 'rollup-plugin-babel';


const external = Object.keys(pkg.dependencies);

module.exports = {
    input: path.join(__dirname, 'src', 'index.js'),
    output: {
        format: 'cjs',
        file: path.join(__dirname, 'lib', 'index.js'),
    },
    external,
    name: 'aktie',
    plugins: [
        babel({
            exclude: 'node_modules/**'
        }),
    ],
};
