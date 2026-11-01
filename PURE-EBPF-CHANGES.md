# Pure eBPF 改造说明

本目录是基于 NetProxy v8.6.2 源码整理的自定义纯 eBPF 源码版，不是上游官方发布包。

## 功能边界

- 受管透明代理仅保留 sing-box eBPF 入站；运行时配置、校验和状态不再提供 TUN 后端。
- 设备默认模式固定为 `Rule`。`Proxy`、`Direct`、`RuleAllowAds` 等模式不再由模块管理或切换。
- Catalog 继续管理节点与订阅，生成 Local Provider；不生成 `Proxy`、`Auto/<group>`、`Select/<group>` 默认出站，`runtime/outbounds.json` 为空数组。
- 节点选择命令、节点选择 API 与模块 selector 状态已移除。节点测速使用短生命周期的 `Delay/<group>` 测速组，不改变正式服务或用户出站。
- 移除 Wi-Fi/SSID 自动切换和网络事件策略。
- 移除设备遥测与后台上报。升级迁移只负责清理旧版 Wi-Fi、TUN 与遥测配置/状态，不包含这些功能的运行时实现。
- 不构建、不签名、不安装 Android 管理器 APK。`src/android/platform` 仅保留分应用策略需要的 PackageManager/UID 辅助 DEX。

## 自定义 sing-box 配置

节点订阅只提供 Provider。需要代理出站时，请自行在 `src/module/config/singbox/config.json` 的 `outbounds` 中定义，并在 `route.rules` 中引用对应 tag。模块不会替你生成默认代理组或强制选择节点。

## 验证情况

已通过：

- `sh tests/module_scripts_test.sh`
- `sh tests/customize_hot_update_test.sh`
- `sh tests/module_packaging_test.sh`
- `node --test tests/default_config_test.mjs`
- `node --test .github/scripts/*.test.mjs`
- `node docs/scripts/check-content.mjs`
- 所有 Go 源文件（排除有意不完整的 `testdata` fixture）通过 `gofmt` 语法/格式检查

未能在当前环境完成：

- Go 单元测试与 Native/Android 二进制构建：仓库要求 Go 1.27.0，当前环境只有 Go 1.23.2。
- WebUI 完整构建与测试：npm 依赖未缓存，环境无法下载 `vite` 与 `kernelsu`；全局 TypeScript 5.8.3 检查仅报告缺少 `kernelsu` 类型和 Vite `ImportMeta.env` 类型。
- Android 辅助 DEX 构建：当前环境没有完整 Android SDK/Gradle 依赖。

因此本次交付为**源码 ZIP**，需要在具备仓库要求的 Go 1.27、Node/npm 和 Android SDK 的构建环境中执行 `sh tests/verify.sh full` 并生成最终可刷入模块 ZIP。不要将本源码 ZIP 直接刷入 Root 管理器。
