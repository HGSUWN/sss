import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { test } from 'node:test'

const root = new URL('../', import.meta.url)
const readJSON = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'))
const config = readJSON('src/module/config/singbox/config.json')
const managed = readJSON('src/module/config/inbound/inbound.json')
const resources = readJSON('.github/resources.json').raw
const list = value => value === undefined ? [] : Array.isArray(value) ? value : [value]

test('模块设置只保存开机自启与 Catalog 管理分组', () => {
  assert.equal(existsSync(new URL('src/module/config/module.conf', root)), false)
  assert.deepEqual(readJSON('src/module/config/module.json'), {
    auto_start: false, selection: { group_id: 'default' },
  })
})

test('默认 sing-box 配置只保留 Rule 模式与用户可编辑的路由', () => {
  assert.equal(config.experimental.clash_api.default_mode, 'Rule')
  assert.equal(config.route.final, 'direct')
  assert.deepEqual(config.outbounds, [{ type: 'direct', tag: 'direct' }, { type: 'block', tag: 'block' }])
  assert.equal(Object.hasOwn(config, 'providers'), false)
  const modes = rules => rules.flatMap(rule => [...list(rule.clash_mode), ...modes(rule.rules ?? [])])
  assert.deepEqual([...new Set([...modes(config.route.rules), ...modes(config.dns.rules)])], [])
  assert.ok(config.route.rules.every(rule => !['Proxy', 'Direct', 'RuleAllowAds'].includes(rule.clash_mode)))
})

test('默认配置不注入节点选择器或遥测组件', () => {
  const serialized = JSON.stringify(config)
  assert.doesNotMatch(serialized, /Auto\//)
  assert.doesNotMatch(serialized, /Select\//)
  assert.doesNotMatch(serialized, /telemetry|posthog|sentry|analytics_sdk/i)
  assert.equal(config.experimental.clash_api.default_mode, 'Rule')
})

test('默认远程规则有对应的内置文件与更新来源', () => {
  for (const rule of config.route.rule_set.filter(rule => rule.type === 'remote')) {
    for (const tag of list(rule.tag)) {
      const path = `src/module/config/singbox/${rule.path.replace(/^\.\//, '').replaceAll('{tag}', tag)}`
      const resource = resources.find(resource => resource.path === path)
      assert.ok(resource, `${tag} 未登记资源更新来源`)
      assert.equal(decodeURI(resource.url), decodeURI(rule.url.replaceAll('{tag}', tag)))
      const content = readFileSync(new URL(path, root))
      assert.ok(content.length > 0, `${tag} 内置规则为空`)
      assert.equal(createHash('sha256').update(content).digest('hex'), resource.currentSha256, tag)
      if (rule.format === 'binary') assert.equal(content.subarray(0, 3).toString(), 'SRS', tag)
    }
  }
})

test('eBPF 默认绕过引用与静态规则一致', () => {
  const localBypass = managed.ebpf.local.bypass_rule_set
  const sharedBypass = managed.ebpf.shared.bypass_rule_set
  assert.equal(Object.hasOwn(managed.ebpf, 'bypass_rule_set'), false)
  const tags = config.route.rule_set.flatMap(rule => list(rule.tag))
  for (const tag of [...localBypass, ...sharedBypass]) assert.ok(tags.includes(tag), `${tag} 未在静态配置声明`)
})

test('入站配置只包含 eBPF，不包含 TUN 后端或参数', () => {
  assert.deepEqual(Object.keys(managed), ['backend', 'root_policy', 'app', 'ebpf'])
  assert.equal(managed.backend, 'ebpf')
  assert.equal(managed.root_policy, 'include')
  assert.deepEqual(managed.app, { enabled: false, mode: 'blacklist', proxy_apps: [], bypass_apps: [] })
  assert.deepEqual(managed.ebpf, {
    type: 'ebpf', tag: 'netproxy-in', network: ['tcp', 'udp'], udp_timeout: '5m', tc_priority: 1,
    local: {
      enabled: true, data_plane: 'socket_assign', dns_mode: 'respect_policy', ipv6: true,
      bypass_private_address: true, bypass_rule_set: ['geoip/cn'],
    },
    shared: {
      enabled: false, data_plane: 'socket_assign', dns_mode: 'hijack', interface: ['wlan2'],
      ipv6: true, bypass_private_address: true, bypass_rule_set: ['geoip/cn'],
    },
  })
  assert.equal(Object.hasOwn(managed, 'tun'), false)
  assert.equal(Object.hasOwn(managed, 'wifi'), false)
})
