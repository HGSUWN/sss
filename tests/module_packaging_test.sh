#!/usr/bin/env sh
# 验证模块只发布 eBPF Root 模块 ZIP，不构建或安装 Android 管理器 APK。
set -eu
ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
BUILD_ACTION="$ROOT/.github/actions/build-module/action.yml"
SHARED_WORKFLOW="$ROOT/.github/workflows/build-module.yml"
VERIFY_WORKFLOW="$ROOT/.github/workflows/verify.yml"
CI_WORKFLOW="$ROOT/.github/workflows/ci.yml"
VERIFY_SCRIPT="$ROOT/tests/verify.sh"

assert_contains() { grep -Fq -- "$2" "$1" || { printf '缺少构建契约: %s\n' "$2" >&2; exit 1; }; }
assert_not_contains() { if grep -Eqi -- "$2" "$1"; then printf '发现已移除功能: %s\n' "$2" >&2; exit 1; fi; }

assert_contains "$BUILD_ACTION" 'sh tests/ci_verify.sh'
assert_contains "$BUILD_ACTION" 'sh .github/scripts/package-module.sh'
assert_contains "$SHARED_WORKFLOW" 'platform:assembleDex'
assert_contains "$SHARED_WORKFLOW" 'platform-dex'
assert_contains "$SHARED_WORKFLOW" 'complete-module.sh'
assert_contains "$VERIFY_WORKFLOW" 'platform:assembleDex'
assert_contains "$VERIFY_SCRIPT" 'quick|webui|platform|docs|full'
assert_not_contains "$BUILD_ACTION" 'NetProxy\.apk|apksigner|ANDROID_KEYSTORE|assembleRelease|assembleDebug'
assert_not_contains "$SHARED_WORKFLOW" 'NetProxy\.apk|apksigner|ANDROID_KEYSTORE|assembleRelease|assembleDebug'
assert_not_contains "$VERIFY_WORKFLOW" 'NetProxy\.apk|apksigner|ANDROID_KEYSTORE|assembleRelease|assembleDebug|app:assemble'
assert_not_contains "$VERIFY_SCRIPT" 'assembleDebug|assembleRelease|testDebugUnitTest|Android 管理器'
assert_not_contains "$ROOT/src/module/customize.sh" 'NetProxy\.apk|pm install|install_bundled_manager'
assert_not_contains "$ROOT/src/module/uninstall.sh" 'NetProxy\.apk|pm uninstall'
! grep -R -Eiq 'tunInbound|TunInbound|auto_redirect|auto_route' "$ROOT/src/native/netproxy/internal/inbound" --include='*.go'
! grep -R -Eiq 'WifiPolicy|wifi_state|SSID|NetworkCallback|telemetryClient|PostHog' "$ROOT/src/native/netproxy/internal/worker" --include='*.go' --exclude='*_test.go'
! grep -R -Eiq 'selector_mode|selected_node_ref|runtime_selected|func \([^)]*\) useNode' "$ROOT/src/native/netproxy/internal/module" --include='*.go' --exclude='*_test.go'
[ ! -e "$ROOT/src/module/NetProxy.apk" ]
[ ! -e "$ROOT/src/android/app" ]
[ ! -e "$ROOT/.github/actions/verify-android" ]
if find "$ROOT/src/native/netproxy" -type f -name '*.go' ! -name '*_test.go' ! -path '*/internal/module/legacy.go' -exec grep -Eqi 'posthog|telemetry|sentry' {} +; then
  printf '%s\n' 'Native 生产代码中仍包含遥测实现' >&2
  exit 1
fi
assert_not_contains "$BUILD_ACTION" 'POSTHOG|NETPROXY_TELEMETRY'
assert_not_contains "$SHARED_WORKFLOW" 'POSTHOG|NETPROXY_TELEMETRY'
assert_contains "$ROOT/.github/scripts/package-module.sh" '7z a -tzip -mm=XZ -mx=9'

printf '%s\n' 'module packaging test passed'
