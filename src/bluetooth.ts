import noble from '@abandonware/noble'
import { getLogger } from './logger'
import { BluetoothConfig } from './model'
import { extractRuuviData } from './ruuvi'
import { createDefaultReadable } from './stream'

/**
 * Bluetooth Peripheral info.
 */
export type BluetoothPeripheral = Pick<
  noble.Peripheral,                                                     // eslint-disable-line
  'id' | 'uuid' | 'address' | 'addressType' | 'advertisement' | 'state' // eslint-disable-line
>

/**
 * RuuviTag Bluetooth advertisement data combined with Bluetooth Peripheral info and timestamp.
 */
export interface RuuviBluetoothData {
  readonly data: Uint8Array
  readonly timestamp: Date
  readonly peripheral: BluetoothPeripheral
}

/**
 * `BluetoothManager` listens for RuuviTag advertisements and publishes
 * them to the `publisher` stream in `RuuviBluetoothData` format.
 *
 * **TODO:**
 * The RuuviTag advertisements whose values are published can be configured
 * with the Bluetooth configuration and its RuuviTag filters.
 */
export class BluetoothManager {
  private readonly log = getLogger('BluetoothManager')
  private readonly ruuviPeripherals = new Set<string>()
  private readonly _publisher = createDefaultReadable()

  constructor(private readonly config: BluetoothConfig = {}) {
    noble.on('scanStart', () => this.log.info('Starting Bluetooth scanning...'))
    noble.on('scanStop', () => this.log.info('Stopped Bluetooth scanning.'))

    // TODO: RuuviTag filter

    this.log.debug('Initialized')
  }

  get publisher() {
    return this._publisher
  }

  async start() {
    noble.on('discover', async peripheral => {
      const { manufacturerData } = peripheral.advertisement
      const ruuviData = extractRuuviData(manufacturerData)
      if (ruuviData) {
        const ruuviTimestamp = new Date()
        if (!this.ruuviPeripherals.has(peripheral.id)) {
          this.ruuviPeripherals.add(peripheral.id)
          this.log.info(`Discovered RuuviTag: ${formatBluetoothPeripheral(peripheral)}`)
        }

        this.publish(this.toRuuviBluetoothData(ruuviData, ruuviTimestamp, peripheral))
      }
    })

    await this.startScan()
  }

  async destroy() {
    this._publisher.push(null)
    await noble.stopScanningAsync()
    this.log.debug('Destroyed')
  }

  private startScan() {
    const { serviceUuids } = this.config
    return new Promise<void>(async res => {
      if (noble.state === 'poweredOn') {
        await noble.startScanningAsync(serviceUuids, true)
        res()
      } else {
        this.log.debug('Waiting for Bluetooth to be powered on...')
        noble.once('stateChange', async () => {
          this.log.debug('Bluetooth powered on.')
          await noble.startScanningAsync(serviceUuids, true)
          res()
        })
      }
    })
  }

  private toRuuviBluetoothData(data: Uint8Array, timestamp: Date, peripheral: noble.Peripheral): RuuviBluetoothData {
    return { data, timestamp, peripheral: this.toBluetoothPeripheral(peripheral) }
  }

  private toBluetoothPeripheral(peripheral: noble.Peripheral): BluetoothPeripheral {
    return {
      id: peripheral.id,
      uuid: peripheral.uuid,
      address: peripheral.address,
      addressType: peripheral.addressType,
      advertisement: peripheral.advertisement,
      state: peripheral.state
    }
  }

  private publish(data: RuuviBluetoothData) {
    this._publisher.push(data)
  }
}

export const formatBluetoothPeripheral = (peripheral: BluetoothPeripheral): string => (
  `${peripheral.advertisement.localName} (${peripheral.id})`
)
