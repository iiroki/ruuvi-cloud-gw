import { Point, WriteApi } from '@influxdata/influxdb-client'
import { Readable, Transform, Writable } from 'node:stream'
import { TransformCallback } from 'stream'
import { RuuviBluetoothData } from './bluetooth'
import { getLogger } from './logger'
import { RuuviBroadcast } from './model'
import { getRuuviParser } from './ruuvi'

export class RuuviInfluxTransform extends Transform {
  private readonly log = getLogger('RuuviInfluxTransform')
  private readonly measurementSequences: Map<string, number> = new Map()

  constructor(private readonly influxMeasurement = 'ruuvi') {
    super({ readableObjectMode: true, writableObjectMode: true })
    this.log.debug('Initialized')
  }

  _transform(chunk: RuuviBluetoothData, _: BufferEncoding, callback: TransformCallback): void {
    const { data, peripheral, timestamp } = chunk
    const parser = getRuuviParser(data)
    if (parser) {
      const parsed = parser(data)
      if (this.measurementExists(parsed, peripheral.id)) {
        callback() // No need to process the same measurement again
        return
      }

      // TODO: Missed any Ruuvi measurements?

      const { id, mac, ...fields } = parsed
      const point = new Point(this.influxMeasurement).timestamp(timestamp)

      // InfluxDB tags
      point.tag('btPeripheralId', peripheral.id)
      point.tag('btPeripheralName', peripheral.advertisement.localName)

      if (id) { // Do not include 0!
        point.tag('id', id.toString())
      }

      if (mac) {
        point.tag('mac', mac.toString())
      }

      // InfluxDB fields
      Object.entries(fields).forEach(([key, value]) => {
        if (typeof value === 'number') {
          point.floatField(key, value)
        }
      })

      callback(null, point)
    } else {
      this.log.error(`No RuuviParser for format: ${data}`)
      callback()
    }
  }

  private measurementExists(parsed: RuuviBroadcast, peripheralId: string) {
    const { measurementSequence } = parsed
    if (!measurementSequence) {
      return false
    }

    const current = this.measurementSequences.get(peripheralId)
    return current && current >= measurementSequence
  }
}

export class IntervalCacheTransform extends Transform {
  private readonly log = getLogger('IntervalCache')
  private readonly cache: any[] = []
  private readonly interval: NodeJS.Timer

  constructor(intervalMs?: number) {
    super({ readableObjectMode: true, writableObjectMode: true })
    const ms = intervalMs ?? 5000 // Default
    this.interval = setInterval(() => this.pushCache(), ms)
    this.log.debug(`Initialized with interval: ${ms} ms`)
  }

  _transform(chunk: any, _: BufferEncoding, callback: TransformCallback): void {
    if (Array.isArray(chunk)) {
      this.cache.push(...chunk)
    } else {
      this.cache.push(chunk)
    }

    callback()
  }

  _flush(callback: TransformCallback): void {
    this.log.info('Flushing...')
    clearInterval(this.interval)
    this.pushCache()
    callback()
  }

  private pushCache() {
    if (this.cache.length !== 0) {
      this.log.info(`Pushing cache: ${this.cache.length} items`)
      const chunk = [...this.cache]
      this.cache.length = 0
      this.push(chunk)
    }
  }
}

export class InfluxWritable extends Writable {
  private readonly log = getLogger('InfluxWritable')

  constructor(private readonly writeApi: WriteApi) {
    super()
  }

  _write(chunk: Point[], _: BufferEncoding, callback: () => void): void {
    this.log.debug(`Writing to InfluxDB: ${chunk.length} points`)
    this.writeApi.writePoints(chunk)
    callback()
  }
}

export const createDefaultReadable = () => new Readable({
  objectMode: true,
  read: () => {/* NOP */}
})
