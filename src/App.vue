<!--
 * @Author: Alex
 * @Date: 2023-04-02 15:53:15
 * @Mail：1790627910@qq.com
-->
<template>
    <div id="chatgpt">
        <div id="sidebar" :class="{ sideBarShow: sideBarShow }">
            <div class="btns">
                <div class="btn" @click="newClient">🤓 新建会话</div>
            </div>
            <div id="chats">
                <div
                    v-for="(item, index) in clients"
                    :key="index"
                    @click="clientsIndex = index"
                    :class="{ active: clientsIndex == index }"
                >
                    <p>{{ item.name }}</p>
                    <span @click.stop="removeClient(index)">🗑 删除</span>
                </div>
            </div>
            <div id="bottom">
                <div class="btn" @click="themeUtil.switchTheme">
                    {{
                        themeUtil.themeCache.value == "light"
                            ? "🌃 暗色模式"
                            : "🌇 亮色模式"
                    }}
                </div>
                <div class="btn" @click="settingShow = true">👐 打开配置</div>
                <div class="btn" @click="reloadConfig">👊 重置配置</div>
                <div class="money" v-if="moneyData">
                    余额：{{
                        moneyToFixed(moneyData.total_available, 2)
                    }}
                    $，已用：{{ moneyToFixed(moneyData.total_used, 2) }} $
                </div>
            </div>
            <div id="showBtn" @click="sideBarShow = !sideBarShow">
                {{ sideBarShow ? "👈" : "👉" }}
            </div>
        </div>
        <div id="main">
            <div id="messages" v-if="clients[clientsIndex]">
                <div
                    v-for="(item, index) in clients[clientsIndex].contents"
                    :key="index"
                >
                    <div class="img">
                        <div v-if="item.role == 'system'" class="system">
                            SY
                        </div>
                        <div v-else-if="item.role == 'user'" class="user">
                            Me
                        </div>
                        <div v-else class="ai">AI</div>
                    </div>
                    <div
                        class="content"
                        :class="{
                            end:
                                !loading ||
                                index !=
                                    clients[clientsIndex].contents.length - 1
                        }"
                        v-html="item.content"
                    ></div>
                    <div class="tokens">
                        tokens：{{ item.tokens == 0 ? "..." : item.tokens }}
                    </div>
                </div>
                <div id="stretch"></div>
            </div>
            <div v-else id="home">
                <div>
                    <p>🤪 ChatGPT 基于 gpt-3.5-turbo 开发</p>
                    <div class="content">
                        <p>本项目纯前端自娱自乐，数据仅在本地中读取</p>
                        <p>国内随意访问，解决 api 无法访问问题</p>
                        <p>瞎写一通，功能简单所以代码较臭</p>
                        <p>微信号A1790627910</p>
                        <p>
                            开源地址（求 star）：<a
                                href="https://github.com/tanqiansheng"
                                target="_blank"
                                >github</a
                            >
                        </p>
                        <p>
                            技术交流：<a
                                href="https://qm.qq.com/cgi-bin/qm/qr?k=IqNCMLCBFxzKDQ5al1-BSyNzpAy2wNvR&jump_from=webapi&authKey=sndHtgNtfTwrpxdc1I31H6v/SNXSDpbqDn3DD4xa13XtaMjpOSGRGojUBK6oc83e"
                                >ChatGPT交流群</a
                            >
                        </p>
                    </div>
                </div>
            </div>
            <div id="input">
                <!-- <p>tokens 总和：{{ tokensCountNum }}</p> -->
                <textarea
                    v-model="message"
                    @keydown="keydown"
                    @keyup="keyup"
                    :style="{ height: textareaHeight + 'px' }"
                ></textarea>
            </div>
        </div>
    </div>

    <DialogCom title="输入 key" :show="okKeyDialog">
        <template #center>
            <p>请在下方输入你的 key</p>
            <p>
                申请地址：<a
                    href="https://platform.openai.com/account/api-keys"
                    target="_blank"
                    >去官网获取秘钥</a
                >
            </p>
            <p>或者加A1790627910微信号获取秘钥</p>
            <input v-model="confirmKey" @keydown.enter="okKey" />
            <p class="tips">key 会保存在本地浏览器中，只供本地使用</p>
        </template>
        <template #bottom>
            <button class="success" @click="okKey">提交</button>
        </template>
    </DialogCom>

    <DialogCom title="设置" :show="settingShow">
        <template #center>
            <div class="panel">
                <div>
                    <p>key：</p>
                    <input type="text" v-model="config.key" />
                </div>
                <p class="tips">OpenAI 申请的 Key</p>
                <div>
                    <p>行为设定：</p>
                    <input type="text" v-model="config.system" />
                </div>
                <p class="tips">
                    <span>给 OpenAI 设定一个行为，比如：</span>
                    <br />
                    <span>“你是一直猫，每句话后面加个 喵~”</span>
                    <br />
                    <span>又或者</span>
                    <br />
                    <span
                        v-html="
                            '“当你要发送图片时，请使用 markdown，不要用代码块，并且从 Unsplash API 中“https://source.unsplash.com/960x640/?<关键词>” 获取”'
                        "
                    ></span>
                </p>
            </div>
        </template>
        <template #bottom>
            <button class="success" @click="toggleSetting">保存</button>
        </template>
    </DialogCom>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick, watch } from "vue";
import axios from "axios";
import DialogCom from "@/components/dialogCom.vue";
import messageUtil from "@/utils/messageUtil";
import { marked } from "marked";
import hljs from "highlight.js";
import Clipboard from "clipboard";
import Viewer from "viewerjs";
import "viewerjs/dist/viewer.css";
import themeUtil from "@/utils/themeUtil";
import cacheUtil from "@/utils/cacheUtil";
import myconfig from "@/config/myconfig";
const { config, read, save } = cacheUtil;
// 读取配置
read();

// 输入 key dialog
const okKeyDialog = ref(config.key == "");

// 获取聊天窗口 dom
let messageDom: Element | null = null;
// Viewer
let viewer: any = null;

onMounted(() => {
    viewer = new Viewer(document.querySelector("#main") as HTMLElement);
    messageDom = document.querySelector("#messages");
    themeUtil.load();

    if (config.key) {
        getMoeny();
    }
    // MathJax.initMathjaxConfig();
});

/**
 * 确认 key
 */
const confirmKey = ref("");
function okKey() {
    if (confirmKey.value == "") {
        return messageUtil({
            type: "warning",
            content: "key 不能为空"
        });
    }
    /*  if (confirmKey.value.startsWith("A1790627910")) {
        config.key = myconfig.defaultskey;
    } else {
        config.key = confirmKey.value;
    }*/
    config.key = confirmKey.value;
    confirmKey.value = "";
    save();

    okKeyDialog.value = false;
    messageUtil({
        type: "success",
        content: "key 存储成功，开始提问吧"
    });

    getMoeny();
}

// 是否正在加载
const loading = ref(false);

/**
 * 提交问题
 */
async function submit() {
    loading.value = true;
    if (config.key == "A1790627910") {
        config.key = myconfig.defaultskey;
    }
    fetch("https://node.fatshady.cn/chatgpt-stream", {
        method: "POST",
        body: JSON.stringify({
            key: config.key,
            model: config.data.model,
            messages: clients[clientsIndex.value].contents.map((item) => {
                return {
                    role: item.role,
                    content: item.stream
                };
            }),
            timeout: 60000
        }),
        headers: {
            "Content-Type": "application/json"
        }
    })
        .then((res: any) => {
            pushResult("assistant", "");

            const reader = res.body.getReader();
            const decoder = new TextDecoder("utf-8");
            let streamCache = "";

            reader.read().then(async function processText(res: any) {
                if (res.done) {
                    return;
                }

                const decodeContent = decoder.decode(res.value);

                // error
                if (decodeContent.includes(`"error": {\n`)) {
                    loading.value = false;
                    return errorHandle(decodeContent);
                }

                // done
                if (decodeContent.includes("data: [DONE]")) {
                    loading.value = false;
                    const client =
                        clients[clientsIndex.value].contents[
                            clients[clientsIndex.value].contents.length - 1
                        ];
                    client.tokens = await computedToken(client.content);

                    saveMessage();
                    await nextTick();
                    hljsInit();
                    viewer.update();
                    return;
                }

                decodeContent
                    .replaceAll("data: ", "")
                    .split("\n")
                    .filter(Boolean)
                    .forEach(async (item: string) => {
                        const itemObj = JSON.parse(item);
                        if (!itemObj.choices[0].delta.content) {
                            return;
                        }
                        const str = itemObj.choices[0].delta.content;
                        // const pattern = /```/g;
                        // const blockCodeArr = streamCache.match(pattern);
                        // if (blockCodeArr && blockCodeArr.length > 0) {
                        //     isBlockCode = Boolean(blockCodeArr.length % 2);
                        // }
                        streamCache += str;

                        clients[clientsIndex.value].contents[
                            clients[clientsIndex.value].contents.length - 1
                        ].content = marked.parse(streamCache);
                        clients[clientsIndex.value].contents[
                            clients[clientsIndex.value].contents.length - 1
                        ].stream = streamCache;
                        await nextTick();
                        hljsInit();
                    });

                return reader.read().then(processText);
            });
        })
        .catch(() => {
            loading.value = false;
        });
}

/**
 * 存入数据
 */
async function pushResult(
    role: "user" | "assistant" | "system",
    content: string,
    errContent?: string
) {
    const resultContent = errContent ? errContent : content;
    const contentData = {
        role,
        content: resultContent,
        tokens: 0,
        stream: resultContent
    };
    clients[clientsIndex.value].contents.push(contentData);
    contentData.tokens = await computedToken(contentData.content);
    saveMessage();
    await nextTick();
    hljsInit();
    viewer.update();
}

/**
 * 保存会话
 */
function saveMessage() {
    window.localStorage.setItem("message-data", JSON.stringify(clients));
    tokensCount();
}

// 消息框内容
const message = ref("");

/**
 * 发送消息
 */
function send() {
    if (message.value == "" || message.value.trim() == "" || loading.value) {
        return;
    }

    // 没有对话时
    if (clientsIndex.value == -1) {
        clients.unshift({
            name: "",
            contents: []
        });
        clientsIndex.value = 0;
    }

    // 是否设置了行为
    if (config.system && clients[clientsIndex.value].contents.length == 0) {
        pushResult("system", config.system);
    }

    pushResult("user", message.value);

    // 第一句对话修改标题
    if (
        clients[clientsIndex.value].contents.length == 1 ||
        (clients[clientsIndex.value].contents[0].role == "system" &&
            clients[clientsIndex.value].contents.length == 2)
    ) {
        const cacheName = message.value;
        let num = 1;
        clients.forEach((item) => {
            if (item.name.indexOf(cacheName) == 0) {
                num++;
            }
        });
        clients[clientsIndex.value].name =
            cacheName + (num == 1 ? "" : ` #${num}`);
        document.title = cacheName + " | ChatGPT";
    }

    // 清空输入框
    message.value = "";

    submit();
}

/**
 * 滚动到底部
 */
let scrollLock = false;
function scrollToBottom() {
    if (scrollLock) {
        return;
    }
    scrollLock = true;
    setTimeout(() => {
        scrollLock = false;
        messageDom = document.querySelector("#messages");
        if (messageDom) {
            // const childrens = messageDom.children;
            // let height = 0;
            // if (childrens[childrens.length - 1]) {
            //     height += childrens[childrens.length - 1].clientHeight;
            // }
            // if (childrens[childrens.length - 2]) {
            //     height += childrens[childrens.length - 2].clientHeight;
            // }
            messageDom.scrollTo({
                top: messageDom.scrollHeight,
                behavior: "smooth"
            });
        } else {
            scrollToBottom();
        }
    }, 300);
}

// shift 是否按住
let shiftDown = false;

/**
 * 消息框键盘按下
 */
function keydown(event: KeyboardEvent) {
    // shift 是否按下
    if (event.keyCode === 16) {
        shiftDown = true;
    }
    // shift 不按住与 enter 按下，则发送
    if (!shiftDown && event.keyCode === 13) {
        send();
        event.preventDefault();
        return false;
    }
}

/**
 * 消息框键盘抬起
 */
function keyup(event: KeyboardEvent) {
    // shift 是否取消按下
    if (event.keyCode === 16) {
        shiftDown = false;
    }
}

// 消息框高度
const textareaHeight = ref(24);

// 监听消息框内容变化改变高度
watch(
    () => message.value,
    () => {
        // 根据换行符计算高度
        const lines = message.value.split("\n").length;
        textareaHeight.value = lines * 24;
    }
);

// 消息列表
interface IMessage {
    role: "user" | "assistant" | "system";
    content: string;
    tokens: number;
    stream: string;
}
// 回话列表
interface IClient {
    name: string;
    contents: Array<IMessage>;
}
const cacheClients = window.localStorage.getItem("message-data");
const clients: Array<IClient> = reactive(
    cacheClients ? JSON.parse(cacheClients) : []
);
const clientsIndex = ref(-1);

// 会话索引切换
watch(
    () => clientsIndex.value,
    async () => {
        if (clients[clientsIndex.value]) {
            document.title = clients[clientsIndex.value].name + " | 🤪ChatGPT";
            await nextTick();
            tokensCount();
            hljsInit();
            viewer.update();
            // MathJax.TypeSet();
        }
    }
);

/**
 * 创建新会话
 */
function newClient() {
    saveMessage();
    let num = 1;
    clients.forEach((item) => {
        if (item.name.indexOf("新会话") == 0) {
            num++;
        }
    });
    clients.unshift({
        name: "新会话" + (num == 1 ? "" : ` #${num}`),
        contents: []
    });
    message.value = "";
    clientsIndex.value = 0;
}

/**
 * 删除会话
 */
function removeClient(i: number) {
    // 删除会话
    document.title = "🤪ChatGPT";
    clients.splice(i, 1);
    clientsIndex.value = -1;
    saveMessage();
}

/**
 * 代码高亮
 */
async function hljsInit() {
    const dom: any = [];
    const codeBlocks = document.querySelectorAll("#messages pre code");
    codeBlocks.forEach((item) => {
        if (item.getAttribute("class")?.includes("hljs")) {
            return;
        }
        const copyBtn = document.createElement("div");
        copyBtn.className = "copyBtn";
        copyBtn.innerHTML = "复制";
        copyBtn.setAttribute("code", item.innerHTML);
        copyBtn.addEventListener("click", (e) => {
            copyCode(e);
        });
        item.parentElement?.appendChild(copyBtn);
        hljs.highlightElement(item as HTMLElement);
        dom.push(item);
    });
    addCodeNum(dom);
    scrollToBottom();
}

/**
 * 添加代码行号
 */
function addCodeNum(dom: any) {
    for (let i = 0; i < dom.length; i++) {
        const enter = dom[i].innerHTML.replace(/\n/g, "</li><li>");
        dom[i].innerHTML = `<ol><li>${enter}</li></ol>`.replace(
            "<li></li></ol>",
            "</ol>"
        );
    }
}

// 侧边栏显示
const sideBarShow = ref(false);

/**
 * 复制代码块
 */
function copyCode(el: MouseEvent) {
    const code = (el.target as HTMLElement).getAttribute("code");
    if (code) {
        Clipboard.copy(code);
        messageUtil({
            type: "success",
            content: "复制成功"
        });
    }
}

/**
 * 重置配置
 */
function reloadConfig() {
    window.localStorage.removeItem("message-data");
    window.localStorage.removeItem("n0ts-chatgpt-theme");
    window.localStorage.removeItem("n0ts-chatgpt-config");
    window.location.reload();
}

// 设置显示
const settingShow = ref(false);
/**
 * 确认设定
 */
function toggleSetting() {
    settingShow.value = !settingShow.value;
    save();
    messageUtil({
        type: "success",
        content: "设置已保存"
    });
}

/**
 * 获取余额
 */
const moneyData: any = ref(null);
async function getMoeny() {
    const { data } = await axios({
        method: "post",
        url: "https://node.fatshady.cn/cors",
        data: {
            method: "GET",
            url: "https://api.openai.com/dashboard/billing/credit_grants",
            headers: {
                authorization: `Bearer ${config.key}`
            }
        }
    });
    moneyData.value = data.data;
}

/**
 * 保留两位
 */
function moneyToFixed(num: any, fixed: number) {
    return Number(num.toFixed(fixed));
}

/**
 * 错误处理
 */
function errorHandle(error: string) {
    const errorObj = JSON.parse(
        error.replace("未知错误，请联系站长解决！", "")
    );
    console.error("报错了哥们", errorObj);
    clients[clientsIndex.value].contents[
        clients[clientsIndex.value].contents.length - 1
    ].content = error;

    if (errorObj.error.code == "invalid_api_key") {
        messageUtil({
            type: "danger",
            content: "API Key 错误，请重新配置"
        });
        config.key = "";
        save();
        okKeyDialog.value = true;
    }
}

/**
 * token 计算
 */
async function computedToken(content: string) {
    if (!content) {
        return 0;
    }
    const { data } = await axios({
        method: "GET",
        url: "https://node.fatshady.cn/chatgpt/encoder",
        params: {
            content
        }
    });
    if (data.status == 400) {
        return 0;
    }
    return data.data.tokens / 2;
}

/**
 * tokens 总和
 */
const tokensCountNum = ref(0);
function tokensCount() {
    if (!clients[clientsIndex.value]) {
        return;
    }
    let count = 0;
    clients[clientsIndex.value].contents.forEach((item) => {
        count += item.tokens;
    });
    tokensCountNum.value = count;
}
</script>

<style scoped lang="less">
@import url("https://cdn.bootcdn.net/ajax/libs/firacode/6.2.0/fira_code.min.css");

#chatgpt {
    height: 100%;
    display: flex;
    background-color: var(--background-color-1);
    color: var(--text-color);
    font-size: 0.9rem;

    > div {
        width: 100%;
    }

    #sidebar {
        width: 350px;
        height: 100%;
        background-color: #202123;
        position: relative;
        left: 0;
        top: 0;
        z-index: 1;
        color: white;
        display: flex;
        flex-direction: column;

        .btns {
            padding: 10px 10px 0;
        }

        .btn {
            border: 1px solid #ffffff33;
            padding: 10px 0 10px 30px;
            margin-bottom: 10px;
            border-radius: 5px;
            cursor: pointer;
            user-select: none;

            &:hover {
                background-color: #2b2c2f;
            }
        }

        #chats {
            overflow-y: scroll;
            height: 100%;

            &::-webkit-scrollbar {
                width: 10px;
                height: 1px;
            }

            &::-webkit-scrollbar-thumb {
                border-radius: 10px;
                box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.2);
                background: #444653;
            }

            &::-webkit-scrollbar-track {
                box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.2);
                border-radius: 10px;
            }

            > div {
                padding: 10px 0 10px 30px;
                overflow: hidden;
                margin-bottom: 10px;
                position: relative;
                border-radius: 5px;

                p {
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    cursor: pointer;
                    overflow: hidden;
                    width: 70%;
                }

                span {
                    font-size: 0.8rem;
                    color: gray;
                    opacity: 0;
                    visibility: hidden;
                    position: absolute;
                    right: 20px;
                    top: 50%;
                    transform: translate(10px, -50%);
                    cursor: pointer;

                    &:hover {
                        color: red;
                    }
                }

                &:hover {
                    background-color: #2b2c2f;
                }

                &:hover span {
                    opacity: 1;
                    visibility: visible;
                    transform: translate(0, -50%);
                }
            }

            .active {
                background-color: #2b2c2f;
            }
        }

        #showBtn {
            position: absolute;
            top: 10%;
            right: 0;
            transform: translateX(100%);
            padding: 10px 15px;
            background-color: #202123;
            cursor: pointer;
            z-index: 1;
            user-select: none;
            visibility: hidden;
        }

        #bottom {
            border-top: 1px solid #ffffff33;
            width: 100%;
            padding: 10px 10px 0;
            box-sizing: border-box;

            .btn {
                border: none;
            }

            .money {
                padding: 10px 5px;
            }
        }
    }

    .sideBarShow {
        transform: translateX(0) !important;
    }

    #main {
        position: relative;

        #input {
            position: absolute;
            bottom: 0;
            left: 0;
            width: 100%;
            height: 20%;
            display: flex;
            justify-content: center;
            background-image: linear-gradient(
                to bottom,
                transparent,
                var(--background-color-2) 40%
            );
            padding-top: 50px;
            box-sizing: border-box;

            textarea {
                position: absolute;
                left: 50%;
                bottom: 30%;
                transform: translateX(-50%);
                width: 80%;
                border-radius: 6px;
                border: 1px solid var(--background-color-1);
                background: var(--background-color-1);
                outline: none;
                resize: none;
                padding: 15px 20px;
                color: var(--text-color);
                max-height: 150px;
                overflow-y: auto;
                box-shadow: 0 0 5px rgba(0, 0, 0, 0.1);
                font-size: 1rem;

                &::-webkit-scrollbar {
                    width: 8px;
                    height: 1px;
                }

                &::-webkit-scrollbar-thumb {
                    border-radius: 10px;
                    box-shadow: none;
                    background: #565868;
                }

                &::-webkit-scrollbar-track {
                    box-shadow: none;
                    border-radius: 10px;
                    background: transparent;
                }
            }

            p {
                position: absolute;
                left: 50%;
                bottom: 10%;
                transform: translateX(-50%);
                font-size: 0.8rem;
                opacity: 0.5;
            }
        }

        #messages {
            height: 100%;
            overflow-y: auto;

            &::-webkit-scrollbar {
                width: 10px;
                height: 1px;
            }

            &::-webkit-scrollbar-thumb {
                border-radius: 10px;
                box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.2);
                background: #444653;
            }

            &::-webkit-scrollbar-track {
                box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.2);
                border-radius: 10px;
                background: var(--background-color-1);
            }

            #stretch {
                height: 15%;
                border-bottom: none;
            }

            > div:nth-child(odd) {
                background-color: var(--background-color-1);
            }

            > div:nth-child(even) {
                background-color: var(--background-color-2);
            }

            > div {
                padding: 25px 100px;
                display: flex;
                flex-wrap: nowrap;
                border-bottom: 1px solid rgba(0, 0, 0, 0.1);
                position: relative;

                .tokens {
                    position: absolute;
                    right: 20px;
                    top: 10px;
                    opacity: 0.4;
                }

                .img {
                    border-radius: 5px;
                    min-width: 40px;
                    width: 40px;
                    height: 40px;
                    overflow: hidden;
                    user-select: none;
                    color: white;

                    div {
                        height: 100%;
                        text-align: center;
                        line-height: 40px;
                        font-size: 1.1rem;
                        text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
                    }

                    .system {
                        background-color: #8b8b8b;
                    }

                    .user {
                        background-color: #81679f;
                    }

                    .ai {
                        background-color: #679f92;
                    }
                }
            }

            .content {
                padding-left: 20px;
                flex: 1;
            }

            :deep(.content:last-child)
                > :not(ol):not(ul):not(pre):last-child:after,
            :deep(.content:last-child) > ol:last-child li:last-child:after,
            :deep(.content:last-child) > pre:last-child code:after,
            :deep(.content:last-child) > ul:last-child li:last-child:after {
                content: "";
                display: inline-block;
                width: 8px;
                height: 15px;
                background-color: var(--text-color);
                animation: blink 1s steps(5, start) infinite;
                transform: translateY(3px);
            }

            @keyframes blink {
                to {
                    visibility: hidden;
                }
            }

            :deep(.end) * {
                &::after {
                    display: none !important;
                }
            }
        }

        #home {
            height: 100%;
            display: flex;
            justify-content: center;
            text-align: center;
            align-items: center;

            > div {
                transform: translateY(-150px);

                > p {
                    font-size: 2rem;
                    margin-bottom: 20px;
                    color: var(--text-color);
                }

                .content {
                    a {
                        color: rgb(0, 174, 255);
                    }
                }
            }
        }
    }
}

@media screen and (max-width: 1200px) {
    #sidebar {
        position: absolute !important;
        transform: translateX(-100%);

        #showBtn {
            visibility: visible !important;
        }
    }

    #messages {
        > div {
            padding: 25px 50px !important;
        }
    }
}

@media screen and (max-width: 700px) {
    #messages {
        > div {
            padding: 25px 20px !important;
        }
    }

    #chats .list > div span {
        opacity: 1 !important;
        visibility: visible !important;
        transform: translateX(0) !important;
        color: red !important;
    }
}

@media screen and (max-width: 450px) {
    #messages {
        > div {
            padding: 25px 10px !important;
        }
    }
}
</style>
