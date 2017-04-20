'use strict';

let path = require('path');
let webpack = require('webpack');
let ExtractTextPlugin = require("extract-text-webpack-plugin");
let OptimizeCSSPlugin = require('optimize-css-assets-webpack-plugin');
let ParallelUglifyPlugin = require('webpack-parallel-uglify-plugin');
let CleanWebpackPlugin = require('clean-webpack-plugin');
let os = require('os');
let HappyPack = require('happypack');   //loader 多进程处理

let getHappyPackConfig = require('./happypack');

let prodConfig = require('./webpack.base.config');
let config = require('../config');

prodConfig.module.rules.unshift({
    test:/\.less$/,
    use: ExtractTextPlugin.extract({
        fallback: "vue-style-loader",
        use: ['happypack/loader?id=less-prod']
    })
}, {
    test:/\.css$/,
    use: ExtractTextPlugin.extract({
        fallback: "vue-style-loader",
        use: ['happypack/loader?id=css-prod']
    })
});

prodConfig.plugins = (prodConfig.plugins || []).concat([
    new CleanWebpackPlugin(['dist'], {
        root: path.join(__dirname, '../'),
        verbose: true,
        dry: false
    }),

    new webpack.DefinePlugin({
        'process.env': config.build.env
    }),

    new ExtractTextPlugin({
        filename: "[name].[contenthash:8].css"
    }),

    new HappyPack(getHappyPackConfig({
        id: 'less-prod',
        loaders: ['css-loader', {
            path: 'postcss-loader',
            options: {
                sourceMap: "inline"
            }
        }, 'less-loader']
    })),

    new HappyPack(getHappyPackConfig({
        id: 'css-prod',
        loaders: ['css-loader', {
            path: 'postcss-loader',
            options: {
                sourceMap: "inline"
            }
        }]
    })),

    // Compress extracted CSS. We are using this plugin so that possible
    // duplicated CSS from different components can be deduped.
    new OptimizeCSSPlugin({
        cssProcessorOptions: {
            safe: true
        }
    }),

    new webpack.optimize.CommonsChunkPlugin({
        name:"vendor",
        filename:"vendor.js"
    }),

    new ParallelUglifyPlugin({
        workerCount: os.cpus().length,
        cacheDir: '.cache/',
        uglifyJS: {
            compress: {
                warnings: false,
                drop_debugger: true,
                drop_console: true
            },
            comments: false,
            sourceMap: true,
            mangle: true
        }
    })
]);

module.exports = Object.assign({},prodConfig,{
    entry: {
        app: path.resolve(__dirname, '../src/page/index.js'),
        vendor: ['vue', 'vuex', 'vue-router', 'vuex-router-sync']
    },
    output: {
        filename: "[name].[chunkhash:8].js",
        path: config.build.assetsRoot,
        publicPath: config.build.assetsPublicPath,
        sourceMapFilename: '[file].map',
        chunkFilename: "[name].[chunkhash:8].js"
    },
    devtool:'source-map'
});