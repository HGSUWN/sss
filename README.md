<p align="center">
  <img src="docs/public/N.svg" alt="NetProxy Logo" width="120" />
</p>

<h1 align="center">NetProxy</h1>

<p align="center">
  <strong>Android Root 设备上的 sing-box eBPF 透明代理模块</strong><br>
  纯 eBPF · Rule 规则分流 · 节点与订阅 Provider · 分应用代理 · 共享网络
</p>

<p align="center">
  <a href="https://github.com/Fanju6/NetProxy-Magisk/releases"><img src="https://img.shields.io/github/v/release/Fanju6/NetProxy-Magisk?style=flat-square&label=Release" alt="Latest Release" /></a>
  <a href="https://github.com/Fanju6/NetProxy-Magisk/releases"><img src="https://img.shields.io/github/downloads/Fanju6/NetProxy-Magisk/total?style=flat-square" alt="Downloads" /></a>
  <img src="https://img.shields.io/badge/Core-sing--box-blueviolet?style=flat-square" alt="sing-box Core" />
</p>

<p align="center">
  <a href="https://github.com/Fanju6/NetProxy-Magisk/releases">下载模块 ZIP</a> ·
  <a href="https://www.netproxy.store/">使用文档</a> ·
  <a href="https://t.me/NetProxy_Magisk">Telegram</a>
</p>

<p align="center"><a href="README_EN.md">English</a></p>

---

## 项目简介

NetProxy 面向已 Root 的 Android 设备，支持 Magisk、KernelSU 与 APatch。项目只使用 sing-box eBPF 入站，不包含 TUN 后端、Wi-Fi 自动切换或设备遥测。

日常管理通过 Root 管理器内的模块 WebUI 或 `netproxyctl` CLI 完成。节点与订阅在服务停止时仍可维护。

## 主要功能

- **eBPF 透明代理**：接管 TCP/UDP，分别配置本机和共享网络路径。
- **节点与订阅**：导入、编辑、导出、删除、测速节点，支持订阅筛选、请求头与自动更新。
- **Provider 管理**：订阅只维护 sing-box Local Provider，不自动生成代理出站或节点选择器。
- **Rule 规则分流**：唯一模式为 `Rule`；代理出站、策略组和路由目标由用户在 sing-box JSON 中定义。
- **分应用代理**：黑名单/白名单，支持 Android 多用户和应用分身。
- **配置与诊断**：编辑 sing-box JSON、本地规则，查看日志和运行状态，导出脱敏诊断包。

## 安装与开始使用

需要 `arm64-v8a` Android 设备、Magisk/KernelSU/APatch 和具备所需 BPF 能力的内核。Release 只提供 Root 模块 ZIP，不构建或安装独立 Android 管理器 APK。包内的 Android 平台辅助 DEX 仅用于应用与 UID 查询，不是管理器。

1. 从 [Releases](https://github.com/Fanju6/NetProxy-Magisk/releases) 下载模块 ZIP。
2. 在 Root 管理器中刷入，按提示选择用户数据保留方式。
3. 从模块详情页打开 WebUI，或使用 `netproxyctl` CLI。
4. 导入节点或订阅后，在 `config/singbox/config.json` 中自行定义 outbounds，并将 `route.rules` 指向对应 tag。
5. 运行 `netproxyctl config check` 和 `netproxyctl ebpf status configured`，再启动服务。

服务默认手动启动；开机自启可在 `config/module.json` 中设置。详细步骤见[快速开始](https://www.netproxy.store/guide/quick-start)。

## 使用文档

| 内容 | 文档 |
|---|---|
| 安装与首次配置 | [安装与升级](https://www.netproxy.store/guide/installation) · [快速开始](https://www.netproxy.store/guide/quick-start) |
| 节点、订阅与测速 | [节点与订阅](https://www.netproxy.store/guide/nodes-subscriptions) |
| eBPF 入站与分应用 | [入站配置](https://www.netproxy.store/config/inbound) · [透明代理](https://www.netproxy.store/guide/transparent-proxy) |
| sing-box 与 Rule 路由 | [配置参考](https://www.netproxy.store/config/singbox) · [路由与 DNS](https://www.netproxy.store/config/routing) · [自定义策略组](https://www.netproxy.store/config/policy-groups) |
| CLI、WebUI 与 API | [CLI](https://www.netproxy.store/guide/cli) · [控制面板与 API](https://www.netproxy.store/guide/control-panel) |
| 故障排查与隐私 | [常见问题](https://www.netproxy.store/guide/faq) · [隐私政策](https://www.netproxy.store/privacy) |

[更新日志](https://www.netproxy.store/changelog)

## 源码结构

```text
src/module/          Root 模块安装与运行文件
src/native/netproxy/ Go 原生组件
src/webui/           终端式模块 WebUI
src/android/platform/应用枚举辅助 DEX（非 APK）
docs/                用户文档站
tests/               契约与回归测试
```

开发流程见[贡献指南](CONTRIBUTING.md)，跨组件约束见 [AGENTS.md](AGENTS.md)。

## 鸣谢

| 项目 | 用途 |
|---|---|
| [reF1nd/sing-box](https://github.com/reF1nd/sing-box) | 当前代理核心 |
| [SagerNet/sing-box](https://github.com/SagerNet/sing-box) | 上游 sing-box 项目 |
| [Proxylink](https://github.com/Fanju6/Proxylink) | 节点转换能力参考 |
| [AsteriskNG](https://github.com/Asterisk4Magisk/AsteriskNG) | Android eBPF 实现参考 |
