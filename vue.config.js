// vue.config.js
module.exports = {
    // 选项...

    devServer: {

        proxy: {
            '/ws': {
                target: 'http://127.0.0.1:8360',
                ws: true,
                changeOrigin: true,
                pathRewrite: {
                    '^/ws': '/socket.io'
                }
            },
            "/jsapi": {
                target: 'http://127.0.0.1:8360',
                ws: true,
                changeOrigin: true,
                pathRewrite: {
                    '^/ws': '/socket.io'
                }
            },
            '/api': {

                target: 'http://192.168.63.27:8080',
                changeOrigin: true,
            }
        },
    },



    publicPath: "/static",
    outputDir: "dist",
    assetsDir: '',
    runtimeCompiler: undefined,
    productionSourceMap: undefined,
    parallel: undefined,
    css: undefined
}