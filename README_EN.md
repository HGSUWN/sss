<p align="center">
  <img src="docs/public/N.svg" alt="NetProxy Logo" width="120" />
</p>

<h1 align="center">NetProxy</h1>

<p align="center">
  <strong>sing-box eBPF transparent proxy module for rooted Android</strong><br>
  eBPF only · Rule routing · Node and subscription Providers · Per-app proxy · Network sharing
</p>

<p align="center">
  <a href="https://github.com/Fanju6/NetProxy-Magisk/releases">Download Module ZIP</a> ·
  <a href="https://www.netproxy.store/">Documentation</a> ·
  <a href="README.md">中文</a>
</p>

---

## Overview

NetProxy supports Magisk, KernelSU, and APatch on rooted Android devices. It uses sing-box eBPF transparent inbound only. TUN, Wi-Fi-triggered mode switching, and device telemetry are not included.

Manage the module through the Root manager's module WebUI or the `netproxyctl` CLI. Nodes and subscriptions remain manageable while the proxy service is stopped.

## Features

- **eBPF transparent proxy** for TCP/UDP, with separate local and shared-network paths.
- **Nodes and subscriptions**: import, edit, export, remove, test latency, filter subscriptions, configure headers, and schedule updates.
- **Provider management**: subscriptions maintain sing-box Local Providers; the module does not generate proxy outbounds or node selectors.
- **Rule routing**: `Rule` is the only mode. Define your own outbounds, policy groups, and route targets in the sing-box JSON configuration.
- **Per-app proxy** with blacklist/whitelist support across Android users and cloned apps.
- **Configuration and diagnostics**: edit sing-box JSON and local rules, inspect logs and runtime state, and export redacted diagnostics.

## Installation

Requires an `arm64-v8a` Android device, Magisk/KernelSU/APatch, and a kernel with the required BPF capabilities. Releases contain only the Root module ZIP; no standalone Android manager APK is built or installed. The bundled Android platform DEX is only used for PackageManager and UID queries, not as a manager app.

1. Download the module ZIP from [Releases](https://github.com/Fanju6/NetProxy-Magisk/releases).
2. Flash it in your Root manager and choose the data-retention option.
3. Open the module WebUI from the Root manager, or use `netproxyctl`.
4. Import nodes or subscriptions, then define your own outbounds in `config/singbox/config.json` and point `route.rules` to those tags.
5. Run `netproxyctl config check` and `netproxyctl ebpf status configured` before starting the service.

The service is stopped by default. See the [Quick Start](https://www.netproxy.store/guide/quick-start) for setup details.

## Documentation

| Topic | Guide |
|---|---|
| Installation | [Installation and Upgrades](https://www.netproxy.store/guide/installation) · [Quick Start](https://www.netproxy.store/guide/quick-start) |
| Nodes and subscriptions | [Nodes and Subscriptions](https://www.netproxy.store/guide/nodes-subscriptions) |
| eBPF inbound and per-app proxy | [Inbound Configuration](https://www.netproxy.store/config/inbound) · [Transparent Proxy](https://www.netproxy.store/guide/transparent-proxy) |
| sing-box and Rule routing | [Configuration](https://www.netproxy.store/config/singbox) · [Routing and DNS](https://www.netproxy.store/config/routing) · [Custom Groups](https://www.netproxy.store/config/policy-groups) |
| CLI, WebUI, and API | [CLI](https://www.netproxy.store/guide/cli) · [Control Panels and APIs](https://www.netproxy.store/guide/control-panel) |
| Troubleshooting and privacy | [FAQ](https://www.netproxy.store/guide/faq) · [Privacy](https://www.netproxy.store/privacy) |

## Source Layout

```text
src/module/           Root module installation and runtime files
src/native/netproxy/  Native Go component
src/webui/            Terminal-style module WebUI
src/android/platform/ Android app-enumeration helper DEX (not an APK)
docs/                 User documentation
tests/                Contract and regression tests
```

See [CONTRIBUTING.md](CONTRIBUTING.md) and [AGENTS.md](AGENTS.md).
