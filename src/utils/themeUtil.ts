/*
 * @Author: Alex
 * @Date: 2023-04-02 15:53:15
 * @Mail：1790627910@qq.com
 */
import { ref } from "vue";

const themeCache = ref<any>("");

function setLocalStorage(theme: string) {
    window.localStorage.setItem("n0ts-chatgpt-theme", theme);
    themeCache.value = theme;
}

function load() {
    const cache = window.localStorage.getItem("n0ts-chatgpt-theme");
    if (!cache) {
        setLocalStorage("light");
    } else {
        themeCache.value = cache;
    }
    document.documentElement.setAttribute("theme", cache || "light");
}

function switchTheme() {
    themeCache.value = window.localStorage.getItem("n0ts-chatgpt-theme");
    themeCache.value = themeCache.value === "light" ? "dark" : "light";
    setLocalStorage(themeCache.value);
    load();
}

export default {
    switchTheme,
    load,
    themeCache
};
