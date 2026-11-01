# 参与贡献

感谢你为 NetProxy 提交改进。仓库由 Root 模块、Go Native、终端 WebUI 和 Android 应用枚举辅助 DEX 组成；不再包含 Android 管理器应用或 APK 构建链。

开始修改前请阅读 [AGENTS.md](AGENTS.md)，了解当前事实源、跨组件契约与验证要求。`src/android/platform` 仅为分应用策略提供 PackageManager/UID 查询能力，不能将它扩展为管理器 APK 项目。

## 提交前验证

根据改动范围运行：

```sh
sh tests/verify.sh quick     # Go、模块 Shell 与打包契约
sh tests/verify.sh webui     # WebUI 类型检查、单测与构建
sh tests/verify.sh platform  # Android 应用枚举辅助 DEX
sh tests/verify.sh docs      # 文档检查与构建
sh tests/verify.sh full      # 全部验证
```

提交前请确认：

- eBPF 是唯一受管透明代理入站；不要添加 TUN 后端或自动回退。
- `Rule` 是唯一模式；代理 outbounds 与策略组由用户的 sing-box JSON 定义。
- 节点和订阅只维护 Catalog Provider，不添加模块节点选择器。
- 不引入 Wi-Fi 自动切换、网络事件策略、设备遥测或第三方统计 SDK。
- 安装包只包含 Root 模块与应用枚举辅助 DEX，不构建、签名、安装或打包 APK。
- 不提交订阅 URL、节点凭据、请求头、设备日志、签名材料或本地开发配置。

## 文档与测试

修复缺陷时优先添加覆盖回归场景的测试。改变配置结构、CLI/API 字段或运行状态时，同步更新 Go、Shell、WebUI、文档与 mock 契约。历史版本文档可以保留旧功能描述，但当前使用说明必须与实际代码一致。

## Pull Request

- 一次 PR 只处理一个清晰主题。
- 描述用户可见变化、实现边界和实际执行的验证命令。
- UI 或 WebUI 改动附截图；内核与 eBPF 改动说明设备和内核环境。
- 不要把格式化、依赖更新和无关重构混入缺陷修复。
