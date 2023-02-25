import { df3parser, df5parser } from 'ojousima.ruuvi_endpoints.ts'
import { RuuviTagFieldKey, RuuviTagFieldType, RuuviTagParser } from './model'

// Ruuvi DF 3: https://docs.ruuvi.com/communication/bluetooth-advertisements/data-format-3-rawv1
// Ruuvi DF 5: https://docs.ruuvi.com/communication/bluetooth-advertisements/data-format-5-rawv2
export const RUUVI_TAG_FIELD_TYPES: Record<RuuviTagFieldKey, RuuviTagFieldType> = {
  measurementSequence: RuuviTagFieldType.Int,
  temperatureC: RuuviTagFieldType.Float,
  pressurePa: RuuviTagFieldType.Int,
  humidityRh: RuuviTagFieldType.Float,
  batteryVoltageV: RuuviTagFieldType.Float,
  accelerationXG: RuuviTagFieldType.Float,
  accelerationYG: RuuviTagFieldType.Float,
  accelerationZG: RuuviTagFieldType.Float,
  movementCounter: RuuviTagFieldType.Int,
  txPowerDBm: RuuviTagFieldType.Int,
  rssiDB: RuuviTagFieldType.Int
} as const

/**
 * Returns `true` if `manufacturerId` is _"Ruuvi Innovations Ltd"_ (`0x0499`).
 */
export const isManufacturerRuuviInnovationsLtd = (manufacturerId: Uint8Array) => (
  manufacturerId[0] === 0x99 && manufacturerId[1] === 0x04
)

/**
 * Extracts Ruuvi data from `manufacturerData` if the manufacturer is _"Ruuvi Innovations Ltd"_.
 *
 * Returns `null` if there is no Ruuvi data to extract.
 */
export const extractRuuviData = (manufacturerData: Buffer): Uint8Array | null => {
  if (!manufacturerData) {
    return null
  }

  const manufacturerId = Uint8Array.from(manufacturerData.subarray(0, 2))
  return isManufacturerRuuviInnovationsLtd(manufacturerId) ? manufacturerData.subarray(2) : null
}

export const isRuuviAccelerationData = (data: Uint8Array) => data[0] === 0xac
export const isRuuviBatteryData = (data: Uint8Array) => data[0] === 0xba
export const isRuuviDf3Data = (data: Uint8Array) => data[0] === 0x03
export const isRuuviDf5Data = (data: Uint8Array) => data[0] === 0x05
export const isRuuviDffeData = (data: Uint8Array) => data[0] === 0xfe

export const getRuuviTagParser = (data: Uint8Array): RuuviTagParser | null => {
  if (isRuuviDf3Data(data)) {
    return df3parser
  } else if (isRuuviDf5Data(data)) {
    return df5parser
  }

  return null
}
