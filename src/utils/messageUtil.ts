/*
 * @Author: Alex
 * @Date: 2023-04-02 15:53:15
 * @Mail：1790627910@qq.com
 */

interface IType {
    type: "success" | "warning" | "danger" | "info";
    content: string;
}

let index = 0;

function message(type: IType) {
    const bodyDom = document.querySelector("body");
    const div = document.createElement("div");
    div.id = "messageBox";
    div.className = `messageBox-${++index}`;
    div.innerHTML = `<div class="${type.type}">${type.content}</div>`;
    bodyDom?.appendChild(div);

    setTimeout(() => {
        index--;
        div.remove();
    }, 3000);
}

export default message;
