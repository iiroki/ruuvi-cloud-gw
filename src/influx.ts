import os from 'node:os'
import { InfluxDB } from '@influxdata/influxdb-client'
import { InfluxConfig } from './config'

/**
 * Custom InfluxDB tag set by the gateway.
 */
export enum InfluxCustomTag {
  BtPeripheralId = 'btPeripheralId',
  BtPeripheralName = 'btPeripheralName',
  BtGatewayHost = 'btGatewayHost',
  BtGatewayHostPlatform = 'btGatewayHostPlatform'
}

export const createInfluxWriteApi = (influxConfig: InfluxConfig) => {
  const {
    url,
    token,
    bucket,
    org,
    defaultTags,
    batchSize,
    flushIntervalMs: flushInterval,
    gzipThreshold
  } = influxConfig

  const client = new InfluxDB({
    url,
    token,
    writeOptions: {
      defaultTags: {
        ...defaultTags,
        [InfluxCustomTag.BtGatewayHost]: os.hostname(),
        [InfluxCustomTag.BtGatewayHostPlatform]: os.platform()
      },
      batchSize,
      flushInterval,
      gzipThreshold
    }
  })

  return client.getWriteApi(org, bucket, 'ms') // Millisecond precision!
}
