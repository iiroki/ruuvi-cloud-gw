import { TransformCallback, Writable } from 'node:stream'

export class MockWritable extends Writable {
  private readonly chunks: any[] = []

  constructor() {
    super({ objectMode: true })
  }

  _write(chunk: any, _: BufferEncoding, callback: TransformCallback): void {
    console.log('MockWritable._write:', chunk)
    this.chunks.push(chunk)
    callback()
  }

  get() {
    return [...this.chunks]
  }

  reset() {
    this.chunks.length = 0
  }
}
