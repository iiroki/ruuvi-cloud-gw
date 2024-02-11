import { Transform, TransformCallback } from 'stream'
import { RuuviTagBroadcast } from 'ojousima.ruuvi_endpoints.ts'
import { formatBluetoothPeripheral } from './bluetooth'
import { getRuuviTagParser } from './data'
import { getLogger } from '../logger'
import { BluetoothPeripheral, RuuviTagData, RuuviTagBluetoothData } from '../model'

export class RuuviBluetoothTransform extends Transform {
  private readonly log = getLogger('RuuviBluetoothTransform')
  private readonly sequences: Map<string, number> = new Map()

  constructor(private readonly logMissedSequences = false) {
    super({ readableObjectMode: true, writableObjectMode: true })
  }

  _transform(chunk: RuuviTagBluetoothData, _: BufferEncoding, callback: TransformCallback): void {
    const { data, peripheral } = chunk
    const parser = getRuuviTagParser(data)
    if (parser) {
      const parsed = parser(data)
      if (!this.updateSequence(parsed, peripheral)) {
        callback() // No need to process the same sequence again
        return
      }

      this.log.trace(parsed, 'Received RuuviTag data:')
      const ruuviTagData: RuuviTagData = { ...chunk, data: parsed }
      callback(null, ruuviTagData)
    } else {
      this.log.error(`No RuuviTagParser found for data: ${data}`)
      callback()
    }
  }

  /**
   * Updates a measurement sequence to cache if the measurement sequence does not already exist.
   * Returns `true` if the measurement sequence was updated.
   */
  private updateSequence(parsed: RuuviTagBroadcast, peripheral: BluetoothPeripheral): boolean {
    const { measurementSequence } = parsed
    if (measurementSequence === null) {
      return false
    }

    // Update measurement sequence if it doesn't exist or a newer was received
    const latest = this.sequences.get(peripheral.id)
    const shouldUpdate = latest === undefined || measurementSequence !== latest
    if (shouldUpdate) {
      this.sequences.set(peripheral.id, measurementSequence)
    }

    if (this.logMissedSequences && latest !== undefined) {
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
