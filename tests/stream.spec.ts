import { Point } from '@influxdata/influxdb-client'
import { PassThrough, Readable } from 'node:stream'
import { RuuviBluetoothData } from '../src/bluetooth'
import { createDefaultReadable, RuuviInfluxTransform } from '../src/stream'
import { MOCK_RUUVI_DF5, MOCK_RUUVI_PERIPHERAL } from './helpers/mock-data'

let publisher: Readable
let pass: PassThrough

describe('RuuviInfluxTransform', () => {
  beforeEach(() => {
    publisher = createDefaultReadable()
    pass = new PassThrough({ objectMode: true })
  })

  afterEach(() => {
    publisher.push(null)
  })

  it('Defined Ruuvi values are inserted into Influx fields (excl. "id" + "mac")', () => {
    // TODO
  })

  it.only('Ruuvi Bluetooth peripheral ID and name are inserted into Influx tags', async () => {
    publisher.pipe(new RuuviInfluxTransform()).pipe(pass)
    const promise = new Promise<Point>(r => {
      pass.on('data', data => r(data))
    })

    publisher.push({
      data: MOCK_RUUVI_DF5,
      timestamp: new Date(2022, 1, 28, 21),
      peripheral: MOCK_RUUVI_PERIPHERAL
    } as RuuviBluetoothData)

    const transformed = await promise
    const tags = transformed['tags']
    expect(tags).toHaveProperty('btPeripheralId', MOCK_RUUVI_PERIPHERAL.id)
    expect(tags).toHaveProperty('btPeripheralName', MOCK_RUUVI_PERIPHERAL.advertisement.localName)
  })

  it('Ruuvi measurement is only transformed once ("measurementSequence")', () => {
    // TODO
  })
})
