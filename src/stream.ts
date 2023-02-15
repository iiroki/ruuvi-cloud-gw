import { Readable, Transform, Writable } from 'node:stream'
import { TransformCallback } from 'stream'
import { RuuviData } from './bluetooth'
import { getLogger } from './logger'
import { RuuviBroadcast, TelemetryPayload } from './model'
import { getRuuviParser } from './ruuvi'

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

export class RuuviParserTransform extends Transform {
  private readonly log = getLogger('RuuviParserTransform')
  private readonly measurementSequences: Map<string, number> = new Map()

  constructor() {
    super({ readableObjectMode: true, writableObjectMode: true })
    this.log.debug('Initialized')
  }

  _transform(chunk: RuuviData, _: BufferEncoding, callback: TransformCallback): void {
    const parser = getRuuviParser(chunk.data)
    if (parser) {
      const parsed = parser(chunk.data)
      const peripheralId = chunk.peripheral.id
      if (this.measurementExists(parsed, peripheralId)) {
        callback() // No need to process the same measurement again
        return
      }

      // TODO: Missed any Ruuvi measurements?

      const payload: TelemetryPayload = {
        data: {}, // TODO
        meta: {
          peripheralName: chunk.peripheral.advertisement.localName
        },
        ts: chunk.timestamp.toISOString()
      }

      callback(null, payload)
    } else {
      this.log.error(`No RuuviParser for format: ${chunk.data}`)
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

export const createDefaultReadable = () => new Readable({
  objectMode: true,
  read: () => {/* NOP */}
})

export const createRuuviDataPipeline = (publisher: Readable, cacheIntervalMs: number) => {
  publisher
    .pipe(new RuuviParserTransform())
    .pipe(new IntervalCacheTransform(cacheIntervalMs))
    // TODO: InfluxDB Writable
}
