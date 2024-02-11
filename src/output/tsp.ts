import { Transform, TransformCallback, Writable } from 'stream'
import axios from 'axios'
import { getLogger } from '../logger'
import { RuuviTagData, RuuviTagIdentifier, TspApiConfig, TspConfig, TspMeasurementBatch, TspRuuviBindingConfig } from '../model'

type TspSender = (measurements: TspMeasurementBatch[]) => Promise<void>

export class RuuviTspTransform extends Transform {
  private readonly log = getLogger('RuuviTspTransform')
  private readonly tagTransformer = new Map<string, string>()
  private readonly locationTransformer = new Map<string, string>()

  constructor(config: TspRuuviBindingConfig) {
    super({ readableObjectMode: true, writableObjectMode: true })

    config.tags.forEach(t => this.tagTransformer.set(t.in, t.out))
    config.locations?.forEach(l => this.locationTransformer.set(this.toLocationKey(l.in), l.out))
  }

  _transform(chunk: RuuviTagData, _: BufferEncoding, callback: TransformCallback): void {
    const measurements: TspMeasurementBatch[] = []

    const location = this.getLocation(chunk)
    for (const e of Object.entries(chunk.data)) {
      const tag = this.tagTransformer.get(e[0])
      if (tag) {
        measurements.push({
          tag,
          location,
          data: [{ value: Number(e[1]), timestamp: chunk.timestamp }]
        })
      }
    }

    if (measurements.length > 0) {
      this.log.debug(`Transformed ${measurements.length} measurement(s)`)
      callback(null, measurements)
    } else {
      callback()
    }
  }

  private getLocation(chunk: RuuviTagData): string | undefined {
    if (this.locationTransformer.size > 0) {
      const keys = [
        this.toLocationKey({ type: 'id', value: chunk.peripheral.id }),
        this.toLocationKey({ type: 'name', value: chunk.peripheral.advertisement.localName })
      ]

      for (const k of keys) {
        const location = this.locationTransformer.get(k)
        if (location) {
          return location
        }
      }
    }

    return undefined
  }

  private toLocationKey(i: RuuviTagIdentifier): string {
    return `${i.type}@${i.value}`
  }
}

export class TspWritable extends Writable {
  private readonly log = getLogger('TspWritable')
  private readonly sender: TspSender

  constructor(config: TspApiConfig) {
    super({ objectMode: true })
    this.sender = this.createSender(config)

  }

  _write(chunk: TspMeasurementBatch[], _: BufferEncoding, callback: (error?: Error | null | undefined) => void): void {
    const now = new Date()
    const merged = this.mergeByTagAndLocation(chunk)
    this.sender(merged.map(b => ({ ...b, versionTimestamp: now })))
      .then(res => this.log.info(`Sent ${merged.length} batches to Time Series Platform`))
      .catch(err => this.log.error(`Could not send measurements to Time Series Platform: ${err}`))

    callback()
  }

  private mergeByTagAndLocation(measurements: TspMeasurementBatch[]): TspMeasurementBatch[] {
    const grouped = new Map<string, TspMeasurementBatch>()
    for (const c of measurements) {
      const key = c.location ? `${c.tag}@${c.location}` : c.tag
      const existing = grouped.get(key)
      if (existing) {
        existing.data.push(...c.data)
      } else {
        grouped.set(key, c)
      }
    }

    return Array.from(grouped.values())
  }

  private createSender(config: TspApiConfig): TspSender {
    const measurementUrl = `${config.url}/measurement`
    const headers: axios.RawAxiosRequestHeaders = {
      [config.apiKeyHeader ?? 'x-api-key']: config.apiKey
    }

    return m => axios.post(measurementUrl, m, { headers })
  }
}
