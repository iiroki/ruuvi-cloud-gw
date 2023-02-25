import { existsSync, readFileSync } from 'node:fs'
import { z } from 'zod'
import { GatewayConfig } from './model'

const CONFIG_PATH = process.env.CONFIG_PATH ?? 'config.json'

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
