import { existsSync, readFileSync } from 'fs'
import { z } from 'zod'
import {
  InfluxConfig,
  OutputConfig,
  RuuviCloudGatewayConfig,
  RuuviConfig,
  RuuviTagIdentifier,
  TspConfig,
  TspRuuviBindingConfig,
  TspRuuviBindingLocationConfig,
  TspRuuviBindingTagConfig
} from './model'
import { replacePropertiesFromEnv } from './util'

const CONFIG_PATH = process.env.CONFIG_PATH ?? 'config.json'

export const readConfigFromFile = (): RuuviCloudGatewayConfig => {
  if (!existsSync(CONFIG_PATH)) {
    throw new Error(`Config file not found: ${CONFIG_PATH}`)
  }
  const file = readFileSync(CONFIG_PATH)
  const config = JSON.parse(file.toString())
  replacePropertiesFromEnv(config)
  return zRuuviCloudGatewayConfig.parse(config)
}

const zRuuviTagIdentifier: z.ZodType<RuuviTagIdentifier> = z.object({
  type: z.union([z.literal('id'), z.literal('name')]),
  value: z.string()
})

const zTspRuuviBindingTagConfig: z.ZodType<TspRuuviBindingTagConfig> = z.object({
  in: z.string(),
  out: z.string()
})

const zTspRuuviBindingLocationConfig: z.ZodType<TspRuuviBindingLocationConfig> = z.object({
  in: zRuuviTagIdentifier,
  out: z.string()
})

const zTspRuuviBindingConfig: z.ZodType<TspRuuviBindingConfig> = z.object({
  tags: zTspRuuviBindingTagConfig.array(),
  locations: zTspRuuviBindingLocationConfig.array().optional()
})

const zTspConfig: z.ZodType<TspConfig> = z.object({
  url: z.string(),
  apiKey: z.string(),
  apiKeyHeader: z.string().optional(),
  intervalMs: z.number().optional(),
  bindings: zTspRuuviBindingConfig
})

const zInfluxConfig: z.ZodType<InfluxConfig> = z.object({
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

const zRuuviConfig: z.ZodType<RuuviConfig> = z.object({
  scanMode: z.boolean().optional(),
  serviceUuids: z.string().array().optional(),
  filters: zRuuviTagIdentifier.array().optional()
})

const zOutputConfig: z.ZodType<OutputConfig> = z.object({
  tsp: zTspConfig.optional(),
  influx: zInfluxConfig.optional()
})

const zRuuviCloudGatewayConfig: z.ZodType<RuuviCloudGatewayConfig> = z.object({
  ruuvi: zRuuviConfig.optional(),
  outputs: zOutputConfig.optional()
})
