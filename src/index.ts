import { BluetoothManager } from './bluetooth'
import { readConfigFromFile } from './config'
import { createInfluxWriteApi } from './influx'
import { getLogger } from './logger'
import { InfluxWritable, RuuviInfluxTransform } from './stream'

const log = getLogger('Index')
const config = readConfigFromFile()
const btManager = new BluetoothManager(config.bluetooth)
const influxWriteApi = createInfluxWriteApi(config.influx)
let destoyed = false

// Setup shutdown routine
process.on('SIGINT', async () => {
  if (!destoyed) {
    destoyed = true
    log.debug('Performing shutdown routine...')
    await btManager.destroy()
    await influxWriteApi.close()
    log.info('Ready for shutdown.')
    process.exit(0)
  }
})

// Setup data pipeline
btManager.publisher
  .pipe(new RuuviInfluxTransform(config.influx.measurement))
  .pipe(new InfluxWritable(influxWriteApi))

// Start the application
log.info('Ready to start.')
btManager.start()
