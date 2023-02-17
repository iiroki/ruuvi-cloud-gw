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

  it('Default tags are set properly', () => {
    const { defaultTags } = createInfluxWriteApi({
      ...TEST_INFLUX_CONFIG,
      defaultTags: { foo: 'bar', baz: 'qux', fred: 'thud' }
    })

    expect(defaultTags).toHaveProperty('foo', 'bar')
    expect(defaultTags).toHaveProperty('baz', 'qux')
    expect(defaultTags).toHaveProperty('fred', 'thud')
  })

  it('Host name is set as a default tag', () => {
    const { defaultTags } = createInfluxWriteApi(TEST_INFLUX_CONFIG)
    expect(defaultTags).toHaveProperty('host', os.hostname())
  })
})
