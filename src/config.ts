import { existsSync, readFileSync } from 'node:fs'
import { z } from 'zod'

const CONFIG_PATH = process.env.CONFIG_PATH ?? 'config.json'

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
}

export const readConfigFromFile = (): GatewayConfig => {
  if (!existsSync(CONFIG_PATH)) {
    throw new Error(`Config file not found: ${CONFIG_PATH}`)
  }

  const json = JSON.parse(readFileSync(CONFIG_PATH).toString())
  return GatewayConfigValidator.parse(json)
}

const GatewayConfigValidator: z.ZodType<Omit<GatewayConfig, 'host'>> = z.object({
  bluetooth: z.object({
    serviceUuids: z.string().array().optional(),
    ruuviTags: z.array(
      z.object({
        uuid: z.string().optional(),
        localName: z.string().optional()
      })
    ).optional()
  }).optional(),
  influx: z.object({
    url: z.string().url(),
    token: z.string(),
    bucket: z.string(),
    org: z.string(),
    measurement: z.string().optional(),
    defaultTags: z.record(z.string()).optional(),
    batchSize: z.number().optional(),
    flushIntervalMs: z.number().optional(),
    gzipThreshold: z.number().optional()
  })
})
