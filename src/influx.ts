import os from 'node:os'
import { InfluxDB } from '@influxdata/influxdb-client'
import { InfluxConfig } from './model'

export const createInfluxWriteApi = (influxConfig: InfluxConfig) => {
  const {
    url,
    token,
    org,
    bucket,
    defaultTags,
    batchSize,
    flushIntervalMs: flushInterval,
    gzipThreshold
  } = influxConfig

  const client = new InfluxDB({
    url,
    token,
    writeOptions: {
      defaultTags: { ...defaultTags, host: os.hostname() },
      batchSize,
      flushInterval,
      gzipThreshold
    }
  })

  return client.getWriteApi(org, bucket, 'ms') // Millisecond precision!
}
