// vue.config.js
module.exports = {
    // 选项...

    devServer: {
        proxy: {
            '/socket.io': {
                // target: 'http://10.2.0.14:8360',
                target: 'http://127.0.0.1:8360',
                ws: true,
                changeOrigin: true,
                
            },
            "/jsapi": {
                // target: 'http://10.2.0.14:8360',
                target: 'http://127.0.0.1:8360',
                ws: false,
                changeOrigin: true,
                
            },
            '/api': {

                target: 'http://10.2.0.14:18888',
                changeOrigin: true,
            }
        },
    },



    publicPath: "/",
    outputDir: "dist",
    assetsDir: '',
    runtimeCompiler: undefined,
    productionSourceMap: undefined,
    parallel: undefined,
    css: undefined
}