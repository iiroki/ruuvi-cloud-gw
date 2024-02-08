import { Peripheral } from '@abandonware/noble'
import { RuuviTagBroadcast } from 'ojousima.ruuvi_endpoints.ts'

export type RuuviTagParser = (data: Uint8Array) => RuuviTagBroadcast
export type RuuviTagFieldKey = keyof Omit<RuuviTagBroadcast, 'id' | 'mac' | 'dataFormat' | 'parsedAt'>
export enum RuuviTagFieldType { Int, Float }

export type RuuviTagIdentifierType = 'uuid' | 'name'

/**
 * Bluetooth Peripheral info.
 */
export type BluetoothPeripheral = Pick<
  Peripheral,                                                           // eslint-disable-line
  'id' | 'uuid' | 'address' | 'addressType' | 'advertisement' | 'state' // eslint-disable-line
>

/**
 * RuuviTag Bluetooth advertisement data combined with Bluetooth Peripheral info and timestamp.
 */
export type RuuviTagBluetoothData = {
  readonly data: Uint8Array
  readonly timestamp: Date
  readonly peripheral: BluetoothPeripheral
}

/**
 * RuuviTag Bluetooth advertisement filter.
 *
 * If one of the properties matches, the advertisement should be accepted.
 */
export type RuuviTagIdentifier = {
  readonly type: RuuviTagIdentifierType
  readonly value: string
}

/**
 * Ruuvi/Bluetooth configuration for the gateway.
 */
export type RuuviConfig = {
  readonly scanMode?: boolean
  readonly serviceUuids?: string[]
  readonly filters?: RuuviTagIdentifier[]
}

/**
 * InfluxDB configuration for the gateway.
 */
export type InfluxConfig = {
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

export type TspConfig = {
  readonly url: string
  readonly apiKey: string
  readonly apiKeyHeader?: string
  readonly intervalMs?: number
  readonly bindings: TspRuuviBindingConfig
}

export type TspRuuviBindingConfig = {
  readonly tags: TspRuuviBindingTagConfig[]
  readonly locations?: TspRuuviBindingLocationConfig[]
}

export type TspRuuviBindingTagConfig = {
  readonly in: string
  readonly out: string
}

export type TspRuuviBindingLocationConfig = {
  readonly in: RuuviTagIdentifier
  readonly out: string
}

export type TspMeasurementBatch = {
  readonly tag: string
  readonly location?: string
  readonly data: {
    readonly value: number
    readonly timestamp: Date
  }
  readonly versionTimestamp?: Date
}

export type OutputConfig = {
  readonly tsp?: TspConfig
  readonly influx?: InfluxConfig
}

/**
 * Main configuration for the gateway.
 */
export type RuuviCloudGatewayConfig = {
  readonly ruuvi?: RuuviConfig
  readonly outputs?: OutputConfig
}
