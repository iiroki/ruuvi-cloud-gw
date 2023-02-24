import noble from '@abandonware/noble'
import { AccelerationBroadcast, BatteryBroadcast, RuuviTagBroadcast } from 'ojousima.ruuvi_endpoints.ts'

export type RuuviBroadcast = RuuviTagBroadcast | AccelerationBroadcast | BatteryBroadcast
export type RuuviParser = (data: Uint8Array) => RuuviBroadcast

/**
 * Bluetooth Peripheral info.
 */
export type BluetoothPeripheral = Pick<
  noble.Peripheral,                                                     // eslint-disable-line
  'id' | 'uuid' | 'address' | 'addressType' | 'advertisement' | 'state' // eslint-disable-line
>

/**
 * RuuviTag Bluetooth advertisement data combined with Bluetooth Peripheral info and timestamp.
 */
export interface RuuviBluetoothData {
  readonly data: Uint8Array
  readonly timestamp: Date
  readonly peripheral: BluetoothPeripheral
}

/**
 * Custom InfluxDB tag set by the gateway.
 */
export enum InfluxCustomTag {
  BtPeripheralId = 'btPeripheralId',
  BtPeripheralName = 'btPeripheralName',
  BtGatewayHost = 'btGatewayHost'
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
 * Bluetooth/Ruuvi configuration for the gateway.
 */
export interface BluetoothConfig {
  readonly serviceUuids?: string[]
  // readonly ruuviTags: RuuviTagFilter[]
}

/**
 * InfluxDB configuration for the gateway.
 */
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
 * Main configuration for the gateway.
 */
export interface GatewayConfig {
  readonly influx: InfluxConfig
  readonly bluetooth?: BluetoothConfig
  readonly cacheIntervalMs?: number
}
