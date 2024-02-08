import { Transform, TransformCallback } from 'stream'
import { getLogger } from './logger'

const ENV_PREFIX = '$'

export const replacePropertiesFromEnv = (obj: { [key: string]: any }, nested?: string[]): void => {
  for (const key of Object.keys(obj)) {
    var value = obj[key]
    if (value && typeof value === 'object') {
      replacePropertiesFromEnv(value, [...(nested ?? []), key])
    } else if (typeof value === 'string' && value.startsWith(ENV_PREFIX)) {
      const envValue = process.env[value.substring(1)]
      if (typeof envValue !== 'undefined') {
        obj[key] = envValue
      }
    }
  }
}

export class IntervalCacheTransform<T> extends Transform {
  private readonly logger
  private readonly cache: T[] = []
  private intervalTimer: NodeJS.Timeout

  constructor(intervalMs: number, name?: string) {
    super({ objectMode: true })
    this.logger = getLogger(name ? `IntervalCacheTransform/${name}` : 'IntervalCacheTransform')
    this.intervalTimer = setInterval(this.pushCache.bind(this), intervalMs)
  }

  _transform(chunk: T, _: BufferEncoding, callback: TransformCallback): void {
    this.logger.info('Add item')
    this.cache.push(chunk)
    callback()
  }

  _flush(callback: TransformCallback): void {
    this.logger.info('Flushing')
    this.pushCache()
    clearInterval(this.intervalTimer)
    callback()
  }

  private pushCache() {
    this.logger.info(`Pushing ${this.cache.length} items`)
    if (this.cache.length) {
      this.push(this.cache.splice(0, this.cache.length))
    }
  }
}
