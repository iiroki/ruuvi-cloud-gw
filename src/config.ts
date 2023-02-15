import fs from 'node:fs'
import { z } from 'zod'
import { GatewayConfig } from './model'

const CONFIG_PATH = process.env.CONFIG_PATH ?? 'config.json'

export const readConfigFromFile = (): GatewayConfig => {
  if (process.env.NODE_ENV === 'test') {
    return {} as any // Disable in tests!
  }

  const json = JSON.parse(fs.readFileSync(CONFIG_PATH).toString())
  return MeasurementHubConfigValidator.parse(json)
}

const MeasurementHubConfigValidator: z.ZodType<Omit<GatewayConfig, 'host'>> = z.object({
  bluetoothConfig: z.object({
    serviceUuids: z.string().array().optional(),
    ruuviTags: z.array(
      z.object({
        uuid: z.string().optional(),
        localName: z.string().optional()
      })
    )
  }),
  influxConfig: z.object({
    url: z.string().url(),
    token: z.string(),
    bucket: z.string(),
    org: z.string(),
    measurement: z.string().optional(),
    defaultTags: z.record(z.string()).optional()
  }),
  cacheIntervalMs: z.number().optional()
})
