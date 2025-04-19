import typescript from '@rollup/plugin-typescript';
import postcss from 'rollup-plugin-postcss';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';

export default {
    input: 'src/index.ts',
    output: [
        {
            file: 'dist/index.js',
            format: 'esm',
            sourcemap: true
        },
        {
            file: 'dist/index.cjs.js',
            format: 'cjs',
            sourcemap: true
        }
    ],
    external: ['react', 'react-dom'],
    plugins: [
        peerDepsExternal(),
        nodeResolve(),
        commonjs(),
        typescript({ tsconfig: './tsconfig.json' }),
        postcss({
            extensions: ['.css'],
            minimize: true,
            inject: {
                insertAt: 'top'
            }
        })
    ]
}; 