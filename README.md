# Ruuvi-InfluxDB Gateway

_A big shoutout to [Ruuvi](https://ruuvi.com/) and their open-source practices for making this project possible!_

**_Ruuvi-InfluxDB Gateway_** is a simple gateway to collect data from RuuviTags and send them to InfluxDB.

**Features:**
- Collect data from RuuviTags
- Transform Ruuvi data to InfluxDB-compatible format
- Send data to InfluxDB
- Various configuration options (see [Configuration](#configuration))

**Supported Ruuvi data formats:**
- [Data format 5](https://docs.ruuvi.com/communication/bluetooth-advertisements/data-format-5-rawv2)
- [Data format 3](https://docs.ruuvi.com/communication/bluetooth-advertisements/data-format-3-rawv1)
- Acceleration
- Battery

## Quickstart

TODO: Instructions

## Configuration

TODO: Description

**Example config:**

```json
{
  "bluetoothConfig": {
    "serviceUuids": ["fe9a"]
  },
  "influxConfig": {
    "url": "http://localhost:8086",
    "token": "influx-token",
    "bucket": "influx-bucket",
    "org": "influx-org",
    "measurement": "ruuvi",
    "defaultTags": {
      "customTag": "customValue"
    },
    "batchSize": 10,
    "flushIntervalMs": 1000,
    "gzipThreshold": 1024
  },
  "cacheIntervalMs": 5000
}
```

## Licenses

**MIT License** Copyright (c) 2023 Iiro Kiviluoma

### Libraries

| Library | License |
| --- | --- |
| Ruuvi / ojousima | BSD-3 |
| InfluxDB | MIT |
| Noble | MIT |
| Pino | MIT |
| Zod | MIT |
