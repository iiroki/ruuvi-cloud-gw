import os from 'node:os'
import { TEST_INFLUX_CONFIG } from './helpers/mock-data'
import { createInfluxWriteApi } from '../src/influx'

describe('Influx Write API', () => {
  it('Bucket, org and precision are set properly', () => {
    const writeApi = createInfluxWriteApi(TEST_INFLUX_CONFIG)
    const writeUrl = new URL(TEST_INFLUX_CONFIG.url + writeApi.path)
    expect(writeUrl.searchParams.get('bucket')).toBe(TEST_INFLUX_CONFIG.bucket)
    expect(writeUrl.searchParams.get('org')).toBe(TEST_INFLUX_CONFIG.org)
    expect(writeUrl.searchParams.get('precision')).toBe('ms')
  })

  it('Host name is set as a default tag', () => {
    const { defaultTags } = createInfluxWriteApi(TEST_INFLUX_CONFIG)
    expect(defaultTags).toHaveProperty('host', os.hostname())
  })
})
