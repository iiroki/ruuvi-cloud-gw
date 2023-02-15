import { BluetoothManager } from './bluetooth'
import { readConfigFromFile } from './config'
import { createInfluxWriteApi } from './influx'
import { getLogger } from './logger'
import { InfluxWritable, IntervalCacheTransform, RuuviInfluxTransform } from './stream'

const log = getLogger('Index')
const config = readConfigFromFile()
const btManager = new BluetoothManager(config.bluetoothConfig)
const influxWriteApi = createInfluxWriteApi(config.influxConfig)
let destoyed = false

// Setup shutdown routine
process.on('SIGINT', async () => {
  if (!destoyed) {
    destoyed = true
    log.debug('Performing shutdown routine...')
    await btManager.destroy()
    log.info('Ready for shutdown.')
    process.exit(0)
  }
})

// Setup data pipeline
btManager.publisher
    .pipe(new RuuviInfluxTransform(config.influxConfig.measurement))
    .pipe(new IntervalCacheTransform(config.cacheIntervalMs))
    .pipe(new InfluxWritable(influxWriteApi))

// Start the application
log.info('Ready to start.')
btManager.start()
