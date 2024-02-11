import { readConfigFromFile } from './config'
import { getLogger } from './logger'
import { createOutputStream } from './output'
import { RuuviTagListener } from './ruuvi/bluetooth'

const log = getLogger('RuuviCloudGw')
const config = readConfigFromFile()
if (!config.outputs && !config.ruuvi?.scanMode) {
  log.warn('No outputs defined')
  log.info('Exiting')
  process.exit(0)
}

const btManager = new RuuviTagListener(config.ruuvi)
let destoyed = false

process.on('SIGINT', async () => {
  if (!destoyed) {
    destoyed = true
    log.debug('Performing shutdown routine')
    await btManager.destroy()
    // await influxWriteApi.close()
    log.info('Ready for shutdown')
    process.exit(0)
  }
})

if (config.outputs) {
  log.info(`Initializing outputs: ${Object.keys(config.outputs)}`)
  const output = createOutputStream(config.outputs)
  btManager.publisher.pipe(output)
}

log.info('Starting')
btManager.start()
