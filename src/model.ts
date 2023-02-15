import { AccelerationBroadcast, BatteryBroadcast, RuuviTagBroadcast } from 'ojousima.ruuvi_endpoints.ts'

export type RuuviBroadcast = RuuviTagBroadcast | AccelerationBroadcast | BatteryBroadcast
export type RuuviParser = (data: Uint8Array) => RuuviBroadcast

/**
 * Payload of a telemetry MQTT message.
 */
export type TelemetryPayload = {
  /** Payload data as key-value pairs. */
  readonly data: Record<string, number>
  /** Payload metadata as key-value pairs. */
  readonly meta: Record<string, string>
  /** Timestamp of the data. */
  readonly ts: string
}

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
  readonly ruuviTags: RuuviTagFilter[]
}

/**
 * System configuration for the Measurement Hub.
 */
export interface GatewayConfig {
  readonly id: string
  readonly host: string
  readonly bluetoothConfig: BluetoothConfig
  readonly cacheIntervalMs?: number
}
