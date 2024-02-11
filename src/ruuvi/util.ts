import { BluetoothPeripheral } from '../model'

export const formatBluetoothPeripheral = (peripheral: BluetoothPeripheral): string => (
  `${peripheral.advertisement.localName} (${peripheral.id})`
)
