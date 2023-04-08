/*
 * @Author: Alex
 * @Date: 2023-04-02 15:53:15
 * @Mail：1790627910@qq.com
 */

let MathJax: any = null;
const initMathjaxConfig = () => {
    if (!MathJax) {
        return true;
    }
    MathJax = {
        tex: {
            inlineMath: [
                ["$", "$"],
                ["\\(", "\\)"]
            ], // ⾏内公式选择符
            displayMath: [
                ["$$", "$$"],
                ["\\[", "\\]"]
            ] // 段内公式选择符
        },
        chtml: {
            scale: 1 //缩放比例
        },
        options: {
            skipHtmlTags: [
                "script",
                "noscript",
                "style",
                "textarea",
                "pre",
                "code",
                "a"
            ], // 避开某些标签
            ignoreHtmlClass: "tex2jax_ignore",
            processHtmlClass: "tex2jax_process"
        }
    };
    return false;
};
const TypeSet = async function () {
    if (!MathJax) {
        return;
    }
    MathJax.startup.promise = MathJax.startup.promise
        .then(() => {
            return MathJax.typesetPromise();
        })
        .catch((err: any) => console.log("Typeset failed: " + err.message));
    return MathJax.startup.promise;
};
export default {
    initMathjaxConfig,
    TypeSet
};
