import { AccelerationBroadcast, BatteryBroadcast, RuuviTagBroadcast } from 'ojousima.ruuvi_endpoints.ts'

export type RuuviBroadcast = RuuviTagBroadcast | AccelerationBroadcast | BatteryBroadcast
export type RuuviParser = (data: Uint8Array) => RuuviBroadcast

/**
 * RuuviTag Bluetooth advertisement filter.
 *
 * If one of the properties matches, the advertisement should be accepted.
 */
export interface RuuviTagFilter {
  readonly uuid?: string
  readonly localName?: string
}

/**
 * Bluetooth/Ruuvi configuration for the Measurement Hub.
 */
export interface BluetoothConfig {
  readonly serviceUuids?: string[]
  // readonly ruuviTags: RuuviTagFilter[]
}

export interface InfluxConfig {
  readonly url: string
  readonly token: string
  readonly bucket: string
  readonly org: string
  readonly measurement?: string
  readonly defaultTags?: Record<string, string>
  readonly batchSize?: number
  readonly flushIntervalMs?: number
  readonly gzipThreshold?: number
}

/**
 * Main configuration for the application.
 */
export interface GatewayConfig {
  readonly bluetoothConfig: BluetoothConfig
  readonly influxConfig: InfluxConfig
  readonly cacheIntervalMs?: number
}
