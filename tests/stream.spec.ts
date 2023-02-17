import { PassThrough, Readable } from 'node:stream'
import { Point } from '@influxdata/influxdb-client'
import { TEST_RUUVI_DF5, TEST_RUUVI_DF5_PARSED, TEST_RUUVI_PERIPHERAL } from './helpers/mock-data'
import { RuuviBluetoothData } from '../src/bluetooth'
import { createDefaultReadable, RuuviInfluxTransform } from '../src/stream'

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

  it('Numeric Ruuvi values are inserted into Influx fields (excl. "id", "mac", "dataFormat")', async () => {
    publisher.pipe(new RuuviInfluxTransform()).pipe(pass)
    const promise = new Promise<Point>(r => pass.on('data', data => r(data)))

    publisher.push({
      data: TEST_RUUVI_DF5,
      timestamp: new Date(2022, 1, 28, 21),
      peripheral: TEST_RUUVI_PERIPHERAL
    } as RuuviBluetoothData)

    const { fields } = await promise
    const { id, mac, dataFormat, ...values } = TEST_RUUVI_DF5_PARSED
    for (const [key] of Object.entries(values).filter(e => typeof e[1] === 'number')) {
      expect(fields).toHaveProperty(key)
    }
  })

  it('Influx fields should not contain Ruuvi "id", "mac" or "dataFormat"', async () => {
    publisher.pipe(new RuuviInfluxTransform()).pipe(pass)
    const promise = new Promise<Point>(r => pass.on('data', data => r(data)))

    publisher.push({
      data: TEST_RUUVI_DF5,
      timestamp: new Date(2022, 1, 28, 21),
      peripheral: TEST_RUUVI_PERIPHERAL
    } as RuuviBluetoothData)

    const { fields } = await promise
    expect(fields).not.toHaveProperty('id')
    expect(fields).not.toHaveProperty('mac')
    expect(fields).not.toHaveProperty('dataFormat')
  })

  it('Ruuvi "id", "mac" and "dataFormat" are inserted into Influx tags', async () => {
    publisher.pipe(new RuuviInfluxTransform()).pipe(pass)
    const promise = new Promise<Point>(r => pass.on('data', data => r(data)))

    publisher.push({
      data: TEST_RUUVI_DF5,
      timestamp: new Date(2022, 1, 28, 21),
      peripheral: TEST_RUUVI_PERIPHERAL
    } as RuuviBluetoothData)

    const transformed = await promise
    const tags = transformed['tags']
    expect(tags).toHaveProperty('id', TEST_RUUVI_DF5_PARSED.id.toString())
    expect(tags).toHaveProperty('mac', TEST_RUUVI_DF5_PARSED.mac?.toString())
    expect(tags).toHaveProperty('dataFormat', TEST_RUUVI_DF5_PARSED.dataFormat?.toString())
  })

  it('Ruuvi Bluetooth peripheral ID and name are inserted into Influx tags', async () => {
    publisher.pipe(new RuuviInfluxTransform()).pipe(pass)
    const promise = new Promise<Point>(r => pass.on('data', data => r(data)))

    publisher.push({
      data: TEST_RUUVI_DF5,
      timestamp: new Date(2022, 1, 28, 21),
      peripheral: TEST_RUUVI_PERIPHERAL
    } as RuuviBluetoothData)

    const transformed = await promise
    const tags = transformed['tags']
    expect(tags).toHaveProperty('btPeripheralId', TEST_RUUVI_PERIPHERAL.id)
    expect(tags).toHaveProperty('btPeripheralName', TEST_RUUVI_PERIPHERAL.advertisement.localName)
  })

  it('Ruuvi measurement is only transformed once ("measurementSequence")', async () => {
    const transformer = new RuuviInfluxTransform()

    // Mock the existing measurement method
    let firstOne = false
    const testSpy = jest.spyOn(RuuviInfluxTransform.prototype as any, 'ruuviMeasurementExists')
    testSpy.mockImplementation(() => {
      if (!firstOne) {
        firstOne = true
        return false
      } else {
        return firstOne
      }
    })

    const transformed: Point[] = []
    publisher.pipe(transformer).pipe(pass)
    pass.on('data', data => transformed.push(data))
    const promise = new Promise<void>(r => pass.on('end', () => r()))

    const data: RuuviBluetoothData = {
      data: TEST_RUUVI_DF5,
      timestamp: new Date(2022, 1, 28, 21),
      peripheral: TEST_RUUVI_PERIPHERAL
    }

    // Push the same data twice -> Same "measurementSequence"
    publisher.push(data)
    publisher.push(data)
    publisher.push(null) // End

    await promise
    expect(transformed.length).toBe(1)
  })
})
