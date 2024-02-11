import { hostname, platform } from 'os'
import { Transform, TransformCallback, Writable } from 'stream'
import { InfluxDB, Point, WriteApi } from '@influxdata/influxdb-client'
import { RuuviTagBroadcast } from 'ojousima.ruuvi_endpoints.ts'
import { getLogger } from '../logger'
import { BluetoothPeripheral, InfluxConfig, RuuviTagBluetoothData, RuuviTagData, RuuviTagFieldKey, RuuviTagFieldType } from '../model'
import { formatBluetoothPeripheral } from '../ruuvi/bluetooth'
import { RUUVI_TAG_FIELD_TYPES, getRuuviTagParser } from '../ruuvi/data'

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
        [InfluxCustomTag.BtGatewayHost]: hostname(),
        [InfluxCustomTag.BtGatewayHostPlatform]: platform()
      },
      batchSize,
      flushInterval,
      gzipThreshold
    }
  })

  return client.getWriteApi(org, bucket, 'ms') // Millisecond precision!
}

export class RuuviInfluxTransform extends Transform {
  private readonly log = getLogger('RuuviInfluxTransform')

  constructor(private readonly influxMeasurement = 'ruuvi') {
    super({ readableObjectMode: true, writableObjectMode: true })
  }

  _transform(chunk: RuuviTagData, _: BufferEncoding, callback: TransformCallback): void {
    const { data, peripheral, timestamp } = chunk
    callback(null, this.toInfluxPoint(data, peripheral, timestamp))
  }

  private toInfluxPoint(parsed: RuuviTagBroadcast, peripheral: BluetoothPeripheral, ts: Date): Point {
    const point = new Point(this.influxMeasurement).timestamp(ts)
    const { id, mac, dataFormat, ...fields } = parsed

    // InfluxDB tags (Bluetooth + Ruuvi metadata)
    point.tag(InfluxCustomTag.BtPeripheralId, peripheral.id)
    point.tag(InfluxCustomTag.BtPeripheralName, peripheral.advertisement.localName)

    if (id !== null) {
      point.tag('id', id.toString())
    }

    if (mac !== null) {
      point.tag('mac', mac.toString())
    }

    if (dataFormat !== null) {
      point.tag('dataFormat', dataFormat.toString())
    }

    // InfluxDB fields (numeric Ruuvi values)
    Object.entries(fields).forEach(([key, value]) => {
      if (typeof value === 'number') {
        const fieldType: RuuviTagFieldType | undefined = RUUVI_TAG_FIELD_TYPES[key as RuuviTagFieldKey]
        switch (fieldType) {
          case RuuviTagFieldType.Int:
            point.intField(key, value)
            break
          case RuuviTagFieldType.Float:
            point.floatField(key, value)
            break
          default:
            this.log.warn(RuuviTagFieldType[fieldType], 'Unknown RuuviTag field type:')
            break
        }
      }
    })

    return point
  }
}

export class InfluxWritable extends Writable {
  private readonly log = getLogger('InfluxWritable')

  constructor(private readonly writeApi: WriteApi) {
    super({ objectMode: true })
  }

  _write(chunk: Point | Point[], _: BufferEncoding, callback: () => void): void {
    const isArray = Array.isArray(chunk)
    this.log.info(`Writing to InfluxDB: ${isArray ? chunk.length : 1} data point(s)`)
    if (isArray) {
      this.writeApi.writePoints(chunk)
    } else {
      this.writeApi.writePoint(chunk)
    }

    callback()
  }
}
