## 下载 Vsix 文件

## 🚀 快速开始
1. 在VSCode 中 按下 `Ctrl+Shift+P` 输入 `vsix` 打开`vsix 下载`页面


## ❓ 可能遇到的问题
- 打开webView时，提示 `加载 Web 视图时出错: Error: Could not register service worker: InvalidStateError: Failed to register a ServiceWorker: The document is in an invalid state..`

    解决方法：
    在控制台输入以下命令
    ```sh
    code --no-sandbox
    ```
- 下载后长时间无反应
    可能是网络问题，尝试重新下载，或者使用浏览器下载
    下载完成后会在VSCode中通知的
    