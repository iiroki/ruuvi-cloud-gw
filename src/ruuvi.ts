import { df3parser, df5parser, dfacparser, dfbaparser, } from 'ojousima.ruuvi_endpoints.ts'
import { RuuviParser } from './model'

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

export const getRuuviParser = (data: Uint8Array): RuuviParser => {
  if (isRuuviAccelerationData(data)) {
    return dfacparser
  } else if (isRuuviBatteryData(data)) {
    return dfbaparser
  } else if (isRuuviDf3Data(data)) {
    return df3parser
  } else if (isRuuviDf5Data(data)) {
    return df5parser
  } else if (isRuuviDffeData(data)) {
    throw new Error('Ruuvi DFFE data format not supported!')
  } else {
    throw new Error(`Unsupported Ruuvi data format: ${data}`)
  }
}
