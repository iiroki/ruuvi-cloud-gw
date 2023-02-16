import { randomUUID } from 'node:crypto'
import { df5parser } from 'ojousima.ruuvi_endpoints.ts'
import { BluetoothPeripheral } from '../../src/bluetooth'

export const MOCK_RUUVI_DF5 = new Uint8Array([
  5,
  19,
  20,
  44,
  248,
  255,
  255,
  255,
  240,
  255,
  244,
  3,
  236,
  196,
  22,
  82,
  14,
  27,
  198,
  145,
  60,
  102,
  36,
  125
])

export const MOCK_RUUVI_DF5_PARSED = df5parser(MOCK_RUUVI_DF5)

const MOCK_RUUVI_PERIPHERAL_UUID = randomUUID()
export const MOCK_RUUVI_PERIPHERAL: BluetoothPeripheral = {
  id: MOCK_RUUVI_PERIPHERAL_UUID,
  uuid: MOCK_RUUVI_PERIPHERAL_UUID,
  address: '',
  addressType: 'unknown',
  advertisement: {
    localName: 'Mock Ruuvi',
    txPowerLevel: 0,
    manufacturerData: Buffer.from([]), // TODO: Manufacturer + Ruuvi DF5?
    serviceData: [],
    serviceUuids: []
  },
  state: 'disconnected'
}