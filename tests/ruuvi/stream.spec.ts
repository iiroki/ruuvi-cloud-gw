import { PassThrough, Readable } from 'stream'
import { RuuviTagBluetoothData } from '../../src/model'
import { RuuviBluetoothTransform } from '../../src/ruuvi/stream'
import { TEST_RUUVI_DF5, TEST_RUUVI_PERIPHERAL } from '../helpers/mock-data'

describe('Ruuvi stream tests', () => {
  let publisher: Readable
  let pass: PassThrough

  beforeEach(() => {
    publisher = new Readable({
      objectMode: true,
      read: () => {/* NOP */}
    })

    pass = new PassThrough({ objectMode: true })
  })

  afterEach(() => {
    publisher.push(null)
  })

  it('Ruuvi measurement is only transformed once ("measurementSequence")', async () => {
    const transformer = new RuuviBluetoothTransform()

    // Mock the existing measurement method
    let firstOne = false
    const testSpy = jest.spyOn(RuuviBluetoothTransform.prototype as any, 'updateSequence')
    testSpy.mockImplementation(() => {
      if (!firstOne) {
        firstOne = true
        return false
      } else {
        return firstOne
      }
    })

    const transformed: unknown[] = []
    publisher.pipe(transformer).pipe(pass)
    pass.on('data', data => transformed.push(data))
    const promise = new Promise<void>(r => pass.on('end', () => r()))

    const data: RuuviTagBluetoothData = {
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
