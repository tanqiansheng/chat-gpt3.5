/*
 * @Author: Alex
 * @Date: 2023-04-02 15:53:15
 * @Mail：1790627910@qq.com
 */
import config from "@/config/config";
import myconfig from "@/config/myconfig";
function save() {
    window.localStorage.setItem("n0ts-chatgpt-config", JSON.stringify(config));
    return config;
}

function read() {
    const cache = JSON.parse(
        window.localStorage.getItem("n0ts-chatgpt-config") ?? "{}"
    );
    if (cache.key) {
        if (cache.key == "A1790627910") {
            config.key = myconfig.defaultskey;
        }
        config.key = cache.key;
        config.data = cache.data;
        config.system = cache.system;
        return config;
    }
    return save();
}

export default {
    save,
    read,
    config
};
