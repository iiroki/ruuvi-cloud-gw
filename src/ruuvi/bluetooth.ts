import { Readable } from 'stream'
import noble from '@abandonware/noble'
import { extractRuuviData } from './data'
import { getLogger } from '../logger'
import { RuuviConfig, BluetoothPeripheral, RuuviTagBluetoothData } from '../model'

/**
 * `RuuviTagListener` listens for RuuviTag Bluetooth advertisements and publishes
 * them to the `publisher` stream in `RuuviBluetoothData` format.
 *
 * **TODO:**
 * The RuuviTag advertisements whose values are published can be configured
 * with the Bluetooth configuration and its RuuviTag filters.
 */
export class RuuviTagListener {
  private readonly log = getLogger('RuuviTagListener')
  private readonly ruuviPeripherals = new Map<string, noble.Peripheral>()
  private readonly ignoredRuuviPeripherals = new Set<string>()
  private readonly ruuviIdFilter?: Set<string>
  private readonly ruuviNameFilter?: Set<string>
  public readonly publisher: Readable

  constructor(private readonly config: RuuviConfig = {}) {
    noble.on('scanStart', () => this.log.info('Starting Bluetooth scanning'))
    noble.on('scanStop', () => this.log.info('Stopped Bluetooth scanning'))

    for (const f of (this.config.filters ?? [])) {
      switch (f.type) {
        case 'id':
          if (!this.ruuviIdFilter) {
            this.ruuviIdFilter = new Set()
          }

          this.ruuviIdFilter.add(f.value)
          break
        case 'name':
          if (!this.ruuviNameFilter) {
            this.ruuviNameFilter = new Set()
          }

          this.ruuviNameFilter.add(f.value)
          break
      }
    }

    this.publisher = new Readable({
      objectMode: true,
      read: () => {/* NOP */},
      highWaterMark: 1024 // Make this configurable?
    })

    this.log.debug('Initialized')
  }

  private get shouldPublish(): boolean {
    return !this.config.scanMode
  }

  async start() {
    if (this.config.scanMode) {
      this.log.info('Scan mode enabled')
    }

    noble.on('discover', async peripheral => {
      const { manufacturerData } = peripheral.advertisement
      const ruuviData = extractRuuviData(manufacturerData)
      if (ruuviData) {
        if (this.ignoredRuuviPeripherals.has(peripheral.id)) {
          return // Has already been ignored
        }

        const ruuviTimestamp = new Date()
        const knownPeripheral = this.ruuviPeripherals.get(peripheral.id)
        if (!knownPeripheral) {
          if (!this.isIncluded(peripheral)) {
            this.ignoredRuuviPeripherals.add(peripheral.id)
            this.log.info(`Ignored RuuviTag: ${formatBluetoothPeripheral(peripheral)}`)
            return
          }

          this.ruuviPeripherals.set(peripheral.id, peripheral)
          this.log.info(`Discovered RuuviTag: ${formatBluetoothPeripheral(peripheral)}`)
        } else if (!knownPeripheral.advertisement.localName && peripheral.advertisement.localName) {
          this.ruuviPeripherals.set(peripheral.id, peripheral)
          this.log.info(`Re-discovered RuuviTag: ${formatBluetoothPeripheral(peripheral)}`)
        }

        if (this.shouldPublish) {
          this.publish(this.toRuuviTagBluetoothData(ruuviData, ruuviTimestamp, peripheral))
        }
      }
    })

    await this.startScan()
  }

  async destroy() {
    this.publisher.push(null)
    await noble.stopScanningAsync()
    this.log.debug('Destroyed')
  }

  private isIncluded(peripheral: noble.Peripheral): boolean {
    if (this.ruuviIdFilter) {
      return this.ruuviIdFilter?.has(peripheral.id)
    }

    if (this.ruuviNameFilter) {
      return this.ruuviNameFilter.has(peripheral.advertisement.localName)
    }

    return true // No filters
  }

  private startScan(): Promise<void> {
    const { serviceUuids } = this.config
    return new Promise(async res => {
      if (noble.state === 'poweredOn') {
        await noble.startScanningAsync(serviceUuids, true)
        res()
      } else {
        this.log.debug('Waiting for Bluetooth to be powered on')
        noble.once('stateChange', async () => {
          this.log.debug('Bluetooth powered on')
          await noble.startScanningAsync(serviceUuids, true)
          res()
        })
      }
    })
  }

  private toRuuviTagBluetoothData(
    data: Uint8Array,
    timestamp: Date,
    peripheral: noble.Peripheral
  ): RuuviTagBluetoothData {
    return { data, timestamp, peripheral: this.toBluetoothPeripheral(peripheral) }
  }

  private toBluetoothPeripheral({ id, uuid, address, addressType, advertisement, state }: noble.Peripheral): BluetoothPeripheral {
    return { id, uuid, address, addressType, advertisement, state }
  }

  private publish(data: RuuviTagBluetoothData) {
    this.publisher.push(data)
  }
}

export const formatBluetoothPeripheral = (peripheral: BluetoothPeripheral): string => (
  `${peripheral.advertisement.localName} (${peripheral.id})`
)
