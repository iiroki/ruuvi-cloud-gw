import os from 'os'
import { PassThrough, Readable } from 'stream'
import { Point } from '@influxdata/influxdb-client'
import { RuuviTagData } from '../../src/model'
import { createInfluxWriteApi, InfluxCustomTag, RuuviInfluxTransform } from '../../src/output/influx'
import { TEST_INFLUX_CONFIG, TEST_RUUVI_DF5_PARSED, TEST_RUUVI_PERIPHERAL } from '../helpers/mock-data'

describe('Influx tests', () => {
  describe('RuuviInfluxTransform', () => {
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

    it('Numeric Ruuvi values are inserted into Influx fields (excl. "id", "mac", "dataFormat")', async () => {
      publisher.pipe(new RuuviInfluxTransform()).pipe(pass)
      const promise = new Promise<Point>(r => pass.on('data', data => r(data)))

      publisher.push({
        data: TEST_RUUVI_DF5_PARSED,
        timestamp: new Date(2022, 1, 28, 21),
        peripheral: TEST_RUUVI_PERIPHERAL
      } as RuuviTagData)

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
        data: TEST_RUUVI_DF5_PARSED,
        timestamp: new Date(2022, 1, 28, 21),
        peripheral: TEST_RUUVI_PERIPHERAL
      } as RuuviTagData)

      const { fields } = await promise
      expect(fields).not.toHaveProperty('id')
      expect(fields).not.toHaveProperty('mac')
      expect(fields).not.toHaveProperty('dataFormat')
    })

    it('Ruuvi "id", "mac" and "dataFormat" are inserted into Influx tags', async () => {
      publisher.pipe(new RuuviInfluxTransform()).pipe(pass)
      const promise = new Promise<Point>(r => pass.on('data', data => r(data)))

      publisher.push({
        data: TEST_RUUVI_DF5_PARSED,
        timestamp: new Date(2022, 1, 28, 21),
        peripheral: TEST_RUUVI_PERIPHERAL
      } as RuuviTagData)

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
        data: TEST_RUUVI_DF5_PARSED,
        timestamp: new Date(2022, 1, 28, 21),
        peripheral: TEST_RUUVI_PERIPHERAL
      } as RuuviTagData)

      const transformed = await promise
      const tags = transformed['tags']
      expect(tags).toHaveProperty('btPeripheralId', TEST_RUUVI_PERIPHERAL.id)
      expect(tags).toHaveProperty('btPeripheralName', TEST_RUUVI_PERIPHERAL.advertisement.localName)
    })
  })

  describe('Influx Write API', () => {
    it('Bucket, org and precision are set properly', () => {
      const writeApi = createInfluxWriteApi(TEST_INFLUX_CONFIG)
      const writeUrl = new URL(TEST_INFLUX_CONFIG.url + writeApi.path)
      expect(writeUrl.searchParams.get('bucket')).toBe(TEST_INFLUX_CONFIG.bucket)
      expect(writeUrl.searchParams.get('org')).toBe(TEST_INFLUX_CONFIG.org)
    })

    it('Default tags are set properly', () => {
      const { defaultTags } = createInfluxWriteApi({
        ...TEST_INFLUX_CONFIG,
        defaultTags: { foo: 'bar', baz: 'qux', fred: 'thud' }
      })

      expect(defaultTags).toHaveProperty('foo', 'bar')
      expect(defaultTags).toHaveProperty('baz', 'qux')
      expect(defaultTags).toHaveProperty('fred', 'thud')
    })

    it('Host name and platform are set as default tags', () => {
      const { defaultTags } = createInfluxWriteApi(TEST_INFLUX_CONFIG)
      expect(defaultTags).toHaveProperty(InfluxCustomTag.BtGatewayHost, os.hostname())
      expect(defaultTags).toHaveProperty(InfluxCustomTag.BtGatewayHostPlatform, os.platform())
    })

    it('Time precision is set to "ms"', () => {
      const writeApi = createInfluxWriteApi(TEST_INFLUX_CONFIG)
      const writeUrl = new URL(TEST_INFLUX_CONFIG.url + writeApi.path)
      expect(writeUrl.searchParams.get('precision')).toBe('ms')
    })
  })
})
