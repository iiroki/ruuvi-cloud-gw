import { BluetoothManager } from './bluetooth'
import { readConfigFromFile } from './config'
import { getLogger } from './logger'
import { createRuuviDataPipeline } from './stream'

const log = getLogger('Index')
const config = readConfigFromFile()
const btManager = new BluetoothManager(config.bluetoothConfig)
let destoyed = false

process.on('SIGINT', async () => {
  if (!destoyed) {
    destoyed = true
    log.debug('Performing shutdown routine...')
    await btManager.destroy()
    log.info('Ready for shutdown.')
    process.exit(0)
  }
})

createRuuviDataPipeline(btManager.publisher, config.cacheIntervalMs ?? 5000)
log.info('Ready to start.')
btManager.start()
