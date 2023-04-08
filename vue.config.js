/*
 * @Author: Alex
 * @Date: 2023-04-02 15:53:15
 * @Mail：1790627910@qq.com
 */

const { defineConfig } = require("@vue/cli-service");
module.exports = defineConfig({
    transpileDependencies: true,
    devServer: {
        host: "0.0.0.0",
        // https:true,
        port: 6103,
        client: {
            webSocketURL: "ws://0.0.0.0:6103/ws"
        },
        headers: {
            "Access-Control-Allow-Origin": "*"
        }
    }
});
