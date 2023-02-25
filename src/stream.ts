import { Readable, Transform, TransformCallback, Writable } from 'node:stream'
import { Point, WriteApi } from '@influxdata/influxdb-client'
import { RuuviTagBroadcast } from 'ojousima.ruuvi_endpoints.ts'
import { BluetoothPeripheral, formatBluetoothPeripheral, RuuviBluetoothData } from './bluetooth'
import { InfluxCustomTag } from './influx'
import { getLogger } from './logger'
import { getRuuviTagParser, RuuviTagFieldKey, RuuviTagFieldType, RUUVI_TAG_FIELD_TYPES } from './ruuvi'

export class RuuviInfluxTransform extends Transform {
  private readonly log = getLogger('RuuviInfluxTransform')
  private readonly measurementSequences: Map<string, number> = new Map()

  constructor(private readonly influxMeasurement = 'ruuvi') {
    super({ readableObjectMode: true, writableObjectMode: true })
    this.log.debug('Initialized')
  }

  _transform(chunk: RuuviBluetoothData, _: BufferEncoding, callback: TransformCallback): void {
    const { data, peripheral, timestamp } = chunk
    const parser = getRuuviTagParser(data)
    if (parser) {
      const parsed = parser(data)
      if (!this.updateMeasurementSequence(parsed, peripheral)) {
        callback() // No need to process the same measurement again
        return
      }

      this.log.debug(parsed, 'Received RuuviTag data:')
      callback(null, this.toInfluxPoint(parsed, peripheral, timestamp))
    } else {
      this.log.error(`No RuuviTagParser found for data: ${data}`)
      callback()
    }
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

  /**
   * Updates a measurement sequence to cache if the measurement sequence does not already exist.
   * Returns `true` if the measurement sequence was updated.
   */
  private updateMeasurementSequence(parsed: RuuviTagBroadcast, peripheral: BluetoothPeripheral): boolean {
    const { measurementSequence } = parsed
    if (measurementSequence === null) {
      return false
    }

    // Update measurement sequence if it doesn't exist or a newer was received
    const latest = this.measurementSequences.get(peripheral.id)
    const shouldUpdate = latest === undefined || measurementSequence !== latest
    if (shouldUpdate) {
      this.measurementSequences.set(peripheral.id, measurementSequence)
    }

    if (latest !== undefined) {
      // This does not work if "measurementSequence" wraps around, but that's a price we're willing to pay :)
      const diff = measurementSequence - latest
      if (diff > 1) {
        this.log.warn(
          `Missed measurements for '${formatBluetoothPeripheral(peripheral)}': ${diff - 1} measurements`
        )
      }
    }

    return shouldUpdate
  }
}

export class InfluxWritable extends Writable {
  private readonly log = getLogger('InfluxWritable')

  constructor(private readonly writeApi: WriteApi) {
    super({ objectMode: true })
    this.log.debug('Initialized')
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

export const createDefaultReadable = () => new Readable({
  objectMode: true,
  read: () => {/* NOP */}
})
