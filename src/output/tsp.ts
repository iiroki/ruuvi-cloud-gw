import { Transform, TransformCallback, Writable } from 'stream'
import { getLogger } from '../logger'
import { RuuviTagBluetoothData, TspConfig, TspRuuviBindingConfig } from '../model'

export class RuuviTspTransform extends Transform {
  private readonly log = getLogger('RuuviTspTransform')

  constructor(config: TspRuuviBindingConfig) {
    super({ readableObjectMode: true, writableObjectMode: true })
    this.log.debug('Initialized')
  }

  _transform(chunk: RuuviTagBluetoothData, _: BufferEncoding, callback: TransformCallback): void {
    // TODO
    callback()
  }
}

export class TspWritable extends Writable {
  private readonly log = getLogger('TspWritable')

  constructor(config: Pick<TspConfig, 'url' | 'apiKey' | 'apiKeyHeader'>) {
    super({ objectMode: true })
  }

  _write(chunk: any, _: BufferEncoding, callback: (error?: Error | null | undefined) => void): void {
    // TODO
    callback()
  }
}
