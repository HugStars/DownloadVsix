const vscode = require('vscode')
const fs = require('fs')
const path = require('path')
const os = require('os')


function activate(context) {
    vscode.window.showInformationMessage('🎉 插件已激活，欢迎使用 DownLoadVsix 插件来下载 vsix 文件！')

    let disposable = vscode.commands.registerCommand('downloadvsix.downloadExtension', function () {
        vscode.window.showInformationMessage('🎉 插件命令触发成功！')
        const panel = vscode.window.createWebviewPanel(
            'downloadVsixWebview',
            '已安装扩展列表',
            vscode.ViewColumn.One,
            { enableScripts: true }
        )

        const htmlPath = path.join(context.extensionPath, 'webview.html')
        const htmlContent = fs.readFileSync(htmlPath, 'utf8')

        const extensions = getInstalledExtensionsFromFs()

        extensions.sort((a, b) => {
            const aIsZh = isChinese(a.name)
            const bIsZh = isChinese(b.name)

            if (aIsZh && !bIsZh) return -1
            if (!aIsZh && bIsZh) return 1

            return a.name.localeCompare(b.name, 'zh-Hans-CN')
        })

        panel.webview.onDidReceiveMessage(async message => {
            if (message.command === 'download') {
                const uri = await vscode.window.showSaveDialog({
                    defaultUri: vscode.Uri.file(message.filename)
                })
                if (uri) {
                    const res = await fetch(message.url)
                    vscode.window.showInformationMessage("下载中...")
                    const arrayBuffer = await res.arrayBuffer()
                    const buffer = Buffer.from(arrayBuffer)
                    fs.writeFileSync(uri.fsPath, buffer)
                    vscode.window.showInformationMessage("下载完成！")
                }
            }
            if (message.command === 'alert') {
                vscode.window.showInformationMessage(message.message)
            }
        })

        panel.webview.html = htmlContent.replace('<!-- EXTENSION_DATA -->', `<script>const extensions = ${JSON.stringify(extensions)}</script>`)
    })

    vscode.commands.executeCommand('downloadvsix.downloadExtension').then(() => {
        // vscode.window.showInformationMessage('命令 downloadvsix.downloadExtension 已成功执行！')
    }, (error) => {
        // vscode.window.showErrorMessage(`执行命令时出错: ${error.message}`)
    })

    context.subscriptions.push(disposable)
}


function deactivate() { }


function getMarketplaceIconUrl(pkg) {
    return `https://marketplace.visualstudio.com/_apis/public/gallery/publisher/${pkg.publisher}/extension/${pkg.name}/${pkg.version}/assetbyname/Microsoft.VisualStudio.Services.Icons.Default`
}


function getInstalledExtensionsFromFs() {
    const extPath = path.join(os.homedir(), '.vscode', 'extensions')
    const dirs = fs.readdirSync(extPath).filter(name => !name.startsWith('.'))

    return dirs.map(folder => {
        const packageJsonPath = path.join(extPath, folder, 'package.json')
        if (fs.existsSync(packageJsonPath)) {
            const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))

            // 处理 displayName 是本地化占位符的情况
            let displayName = pkg.displayName
            if (typeof displayName === 'string' && displayName.startsWith('%') && displayName.endsWith('%')) {
                const key = displayName.slice(1, -1)
                const nlsPath = path.join(extPath, folder, 'package.nls.zh-cn.json')
                const fallbackNlsPath = path.join(extPath, folder, 'package.nls.json')

                let nls = {}
                if (fs.existsSync(nlsPath)) nls = JSON.parse(fs.readFileSync(nlsPath, 'utf-8'))
                else if (fs.existsSync(fallbackNlsPath)) nls = JSON.parse(fs.readFileSync(fallbackNlsPath, 'utf-8'))

                if (nls[key]) displayName = nls[key];
            }

            return {
                id: `${pkg.publisher}.${pkg.name}`,
                name: displayName || pkg.name,
                version: pkg.version,
                description: pkg.description || '',
                icon: pkg.icon ? getMarketplaceIconUrl(pkg) : '',
                folderName: folder
            }
        }
        return null
    }).filter(Boolean)
}


function isChinese(str) {
    return /^[\u4e00-\u9fa5]/.test(str)
}


module.exports = {
    activate,
    deactivate
}
