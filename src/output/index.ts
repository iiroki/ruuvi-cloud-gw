import { PassThrough } from 'stream'
import { InfluxWritable, RuuviInfluxTransform, createInfluxWriteApi } from './influx'
import { RuuviTspTransform, TspWritable } from './tsp'
import { OutputConfig } from '../model'
import { IntervalCacheTransform } from '../util'

export const createOutputStream = ({ tsp, influx }: OutputConfig): NodeJS.WritableStream => {
  const stream = new PassThrough({ writableObjectMode: true, readableObjectMode: true })

  // Time Series Platform
  if (tsp) {
    const tspStream = new PassThrough({ writableObjectMode: true, readableObjectMode: true })
    tspStream
      .pipe(new RuuviTspTransform(tsp.bindings))
      .pipe(new IntervalCacheTransform(tsp.intervalMs ?? 10000, 'TSP'))
      .pipe(new TspWritable(tsp))

    stream.pipe(tspStream)
  }

  // InfluxDB
  if (influx) {
    const influxStream = new PassThrough({ writableObjectMode: true, readableObjectMode: true })
    const influxWriteApi = createInfluxWriteApi(influx)
    influxStream
      .pipe(new RuuviInfluxTransform(influx.measurement))
      .pipe(new InfluxWritable(influxWriteApi))

    stream.pipe(influxStream)
  }

  return stream
}