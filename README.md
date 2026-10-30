# AI 作图素材库 · 中文版（脸 / 姿势 / 服装）

<img width="2866" height="1858" alt="Image" src="https://github.com/user-attachments/assets/7d511229-c4a4-4694-b8bd-43c2d8c98a3a" />

把作者 **あぎ / ギア（[@giaaibusi](https://x.com/giaaibusi)）** 公开的三套 AI 作图参考素材，做成了一个中文检索界面：

| 库 | 内容 | 数量 | 源站 |
| --- | --- | --- | --- |
| 脸库 | 正面向、纯色背景的头部参考（脸部特写 893 / 造型 606） | 1,499 张 | <https://ai-portrait-gallery.pages.dev/> |
| 姿势库 | 无脸灰色人偶线稿，每姿势 5 个机位 | 288 姿势 / 1,439 图 | <https://ai-pose-gallery.pages.dev/> |
| 服装库 | 无人物、只有服装的参考图（8 个分类） | 1,407 套 | <https://ai-costume-gallery.pages.dev/> |

中文版做的事：分类与标签全部译成中文、中英双语搜索、一键复制作图指令、三库统一入口。

## 打开方式

**直接双击 index.html** 即可（本地 file:// 就能跑，不需要服务器）。

如果浏览器限制本地脚本，也可以在目录里起个静态服务：

    python3 -m http.server 8080

然后访问 http://localhost:8080 。

## 原图怎么来

仓库里**只有缩略图**（内嵌在 data/*.js 里，所以任何环境都不会裂图）。点「下载原图」时按这个顺序：

1. config.js 里配了本地目录、且文件存在、且使用 file:// 打开 → 直接用本地原图（快、离线可用）
    * 下载原图后，放置本目录的上层目录，和 config.js 配置一致即可
2. 否则 → 跳转作者源站的对应文件，国内访问会比较慢，推荐下载原图

附原图下载地址（网盘下载仅为本地预览高清图）：

**AI 作图脸库**

[https://pan.baidu.com/s/1rxqVp0qkxCQf-8Z8DXI6HA?pwd=jR2P](https://pan.baidu.com/s/1rxqVp0qkxCQf-8Z8DXI6HA?pwd=jR2P)

[https://pan.quark.cn/s/469084c4f0fa](https://pan.quark.cn/s/469084c4f0fa)

**AI 服装库**

[https://pan.baidu.com/s/1bsGuveiCBRbucS-17tpTrg?pwd=s39e](https://pan.baidu.com/s/1bsGuveiCBRbucS-17tpTrg?pwd=s39e)

[https://pan.quark.cn/s/492b9782ab78](https://pan.quark.cn/s/492b9782ab78)

**AI 作图姿势库**

[https://pan.quark.cn/s/6b1004add615](https://pan.quark.cn/s/6b1004add615)

[https://pan.baidu.com/s/1rY8E88d19xabnoBGhex4zg?pwd=vsf6](https://pan.baidu.com/s/1rY8E88d19xabnoBGhex4zg?pwd=vsf6)

## 授权（请务必看清）

| 库 | 授权 | 能否再分发图片 |
| --- | --- | --- |
| 脸库 | **CC0**（放弃著作权） | ✅ 可以 |
| 姿势库 | 免费商用、可修改、可参考 | ❌ 禁止再分发图片本体（含改过的版本） |
| 服装库 | 同上 | ❌ 禁止再分发图片本体 |

- 三个库都**不涉及真实人物**（全部 AI 生成）
- 服装库作者做过品牌相似度检查，但**不保证不侵权**，商用前请自行判断
- 本仓库只收录缩略图用于检索，原图请走源站下载；**请勿把原图打包再分发**

## 免责

素材版权归原作者所有，本仓库仅为个人使用的中文检索界面，按原样提供、无担保。
