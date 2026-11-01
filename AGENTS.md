# NetProxy Agent Guide

本文件记录当前仓库的真实架构与跨组件约束。开始修改前阅读相关源码、测试和本文对应章节；用户文档位于 `docs/`。

## 项目边界

- `src/module/`：Magisk、KernelSU、APatch 模块脚本、配置、内核与 WebUI 资源。
- `src/native/netproxy/`：唯一 Go 业务核心，负责 Catalog、Provider、订阅、配置、eBPF 运行时、Service API 和后台 Worker。
- `src/webui/`：终端式 TypeScript WebUI，构建产物写入 `src/module/webroot/netproxy/`。
- `src/android/platform/`：仅构建模块用于 Android PackageManager 查询的辅助 DEX；不包含 Android 管理器、Compose 应用或 APK。
- `docs/`：VitePress 用户文档；`tests/`：Go、Shell、WebUI、打包与文档契约测试。

透明代理只使用 sing-box eBPF 入站。仓库不得重新引入 TUN 入站、TUN 路由、TUN 后端切换、Wi-Fi 自动切换、网络事件驱动的模式切换或设备遥测。

## 核心契约

- `netproxyctl` 是唯一 Go 可执行文件；CLI 与模块 HTTPS API 复用同一领域函数。模块 WebUI 调用 CLI。Android 平台 DEX 只供 Go 通过 `app_process` 查询 Android 应用与 UID，不是管理器应用。
- 机器接口使用 `schema=1` JSON。stdout 只输出一份结果 JSON，日志写 stderr；响应结构、错误码或状态变化必须同步更新 Go、Shell、WebUI 与测试。
- `src/module/` 与设备 `/data/adb/modules/netproxy/` 一一对应。运行时 Shell 只保留模块 `service.sh`，公共业务由 Go 实现。
- Native 日志统一脱敏后写入模块日志；核心日志通过 stderr 交给模块管理。不得在日志、诊断包或错误消息中泄露节点链接、订阅 Header、凭据或 UUID。
- Catalog 是节点与订阅的持久事实源：`data/catalog/<group-id>/meta.json` 与 `provider.json`。`staging/` 仅用于临时事务，不作为持久状态读取。
- `config/module.json` 只保存 `auto_start` 和 `selection.group_id`。`selection.group_id` 仅表示 Catalog 管理界面聚焦的分组，不代表代理节点选择；不得增加 `node_tag`、Wi-Fi 策略或遥测字段。
- 不提供 `node use`、节点选择 API 或模块节点选择器。节点/订阅管理保留导入、编辑、导出、删除、测速、订阅更新等功能。Catalog Provider 只供用户自己的 sing-box JSON 引用。
- 模块不得生成 `Proxy`、`Auto/<group>`、`Select/<group>` 或任何默认节点选择出站。`runtime/providers.json` 维护 Provider；`runtime/outbounds.json` 必须是空数组。所有代理出站、urltest、selector 与路由目标由用户在 `config/singbox/config.json` 中定义。
- 出站模式唯一为 `Rule`。主配置 `experimental.clash_api.default_mode` 固定为 `Rule`；启动、重载和运行时模式同步都使用 `Rule`。不提供 `Proxy`、`Direct`、`RuleAllowAds` 或其他模式切换。实际分流由 `route.rules` 决定。
- `config/inbound/inbound.json` 是唯一受管入站事实源，外层固定为 `backend/root_policy/app/ebpf`，`backend` 固定 `ebpf`，受管 sing-box 入站固定 `type: ebpf`、`tag: netproxy-in`。主配置不得重复定义受管入站或占用该 tag。
- eBPF 本机与共享路径分别由 `ebpf.local.enabled`、`ebpf.shared.enabled` 控制。本机 `data_plane` 只允许 `socket_assign/cgroup`；共享路径只允许 `socket_assign/packet_rewrite`。默认 `socket_assign`，共享路径默认关闭。保留 `bypass_private_address`、`bypass_rule_set`、UID、CIDR、MAC、接口和 DNS 原生参数。
- Root 策略 `default/include/exclude` 只影响本机 UID 0；应用名单严格使用 `<user-id>:<package>` 字符串，Go 通过 Android PackageManager 辅助 DEX 查询 UID。热点客户端不套用本机应用名单。
- 不监听 Wi-Fi、SSID、路由或链路事件来改变代理模式。基础接口探测只用于 eBPF 和 sing-box 本身需要的网络能力，不得恢复网络策略 Worker。
- 不实现设备遥测、设备身份派生、统计队列、遥测 Token 或后台统计上传。不得新增分析 SDK、遥测依赖或遥测构建密钥。
- 设备统计、核心连接和流量等本地运行状态不是遥测；它们仍可供本机状态页、Service API 和诊断使用，但不得自动上传第三方。
- `src/native/netproxy` 使用 Go 标准库 `encoding/json/v2` 与 `encoding/json/jsontext`，依赖严格字段匹配、重复键拒绝与 UTF-8 校验；持久文件与 JSON 契约输出使用 `json.Deterministic(true)`。不要回退 JSON v1 或设置 `GOEXPERIMENT=nojsonv2`。
- 配置写入遵循候选文件、完整校验、原子替换和有界 reload；并发写入使用生命周期锁、配置文件锁和 revision。失败不得留下半应用配置或覆盖并发修改。
- Provider 更新必须完整校验、稳定 tag、`0600` 权限与原子替换。下载、转换或校验失败必须保留上一版有效 Provider。
- 订阅 `update_via_proxy` 的 `auto/always/never` 是下载请求的代理使用策略，不是 Wi-Fi 自动切换功能，不能误删或与入站模式混为一谈。
- sing-box 静态配置唯一事实源为 `config/singbox/config.json`。配置分区由 Go 在文件锁内替换指定顶层字段，保留其他字段和数组顺序；写入使用读取时的 revision，冲突返回 `config.conflict`。
- `runtime/inbound.json`、`runtime/providers.json`、`runtime/outbounds.json` 是可重建的只读运行时文件。不得由客户端直接编辑或作为用户数据保留。

## CLI 与 WebUI

- 命令组固定为 `service catalog node sub mode app ebpf config logs api`，没有 `network` 命令组。
- `node` 命令只维护节点数据与测速，不提供 `current` 或 `use` 选择命令。
- `mode` 只报告或确认 `Rule`，拒绝 `Proxy`、`Direct`、`RuleAllowAds` 和自定义模式。
- WebUI 是终端式管理界面，开发 mock 必须反映真实 CLI/API 契约，不得模拟已删除的 TUN、Wi-Fi、节点选择或其他模式。
- HTTP API 只开放明确列出的资源路由；不得重新开放 `/selection` 写入、任意命令执行、Shell 或设备路径读写接口。

## 后台 Worker 与服务

- 允许一个长期 Go 后台宿主，负责模块 HTTPS API 与订阅自动更新调度；不得启动网络事件或遥测采集任务。
- 服务状态固定为 `stopped/preparing/starting/ready/stopping/failed`。`ready_at` 只能在 sing-box API 与 eBPF 受管入站就绪后写入。
- sing-box 停止时清理 eBPF 程序、Map、TC/cgroup 挂载等实际资源；不得保留 TUN 清理、路由回退或第二套入站实现。
- 服务停止不应启动核心或 Worker。配置读取、Catalog 维护与订阅管理在服务停止时仍可用。
- 节点测速可使用有界短生命周期 sing-box 测速会话；不得改动正式服务状态、Catalog 聚焦分组或用户的 outbounds。

## Shell 与安装

- Android `/system/bin/sh` 兼容 POSIX/mksh；不使用 Bash 数组、`[[ ]]`、进程替换或 Bash 专属选项。
- 参数和路径双引号包裹；复杂数据通过文件或 JSON 传递，不使用 `eval`。
- 安装器只安装 Root 模块，不检测、复制、签名或安装 Android 管理器 APK。不得调用 `pm install`、`pm uninstall` 或保留 `NetProxy.apk`。
- `src/android/platform` 的辅助 DEX 仍需保留，用于应用枚举与 UID 解析；它不是 APK，也不提供管理 UI。
- 安装与升级的用户数据快照、锁顺序、目录切换和失败回滚保持现有事务语义。保留数据升级时仅迁移已删除功能字段：清除 `module.json` 的 Wi-Fi 与 `selection.node_tag`、入站 TUN 对象、旧遥测目录；若旧 backend 为 TUN，则改用已保存的 eBPF 配置，两个 eBPF 路径都关闭时启用本机路径。缺少 eBPF 参数时必须中止并保留旧安装。新增模块文件时同步检查权限和 ZIP 内容。

## 构建与发布

- CI/Release 只构建 Go Native、WebUI、Android 平台辅助 DEX 和 Root 模块 ZIP；不构建、不签名、不发布 APK。
- `src/android` 的唯一构建任务为 `:platform:assembleDex`，产物追加到模块 `bin/android-platform.dex`。
- 模块 ZIP 根目录直接包含 `module.prop`；使用项目现有 ZIP/XZ 打包契约。不得把 DEX 误命名为 APK。
- 变更 Go、Shell、模块配置、WebUI、DEX、文档或打包流程时，更新对应测试和文档；Go 代码使用 `gofmt`，Shell 使用 `sh -n`，并执行适用的 `tests/verify.sh` 范围。
