const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  devServer: {
    port: 8081,
    proxy: {
      '/tutoring': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        onProxyReq(proxyReq) {
          // Same-origin through the dev proxy; the backend only allows ports 3000 and 5173
          proxyReq.removeHeader('origin')
        }
      }
    }
  }
})