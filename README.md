# Ruuvi-InfluxDB Gateway

[![Unit Tests](https://github.com/iiroki/ruuvi-influxdb-gw/actions/workflows/unit-tests.yml/badge.svg?branch=main)](https://github.com/iiroki/ruuvi-influxdb-gw/actions/workflows/unit-tests.yml)

_A big shoutout to [Ruuvi](https://ruuvi.com/) and their open-source practices for making this project possible!_

**_Ruuvi-InfluxDB Gateway_** is a simple gateway to collect data from RuuviTags and send them to InfluxDB implemented with TypeScript and Node.js.

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

**Prerequisites:**
- [Node.js](https://nodejs.org/en/)
- [PM2](https://pm2.keymetrics.io/) (OPTIONAL FOR "PRODUCTION")

### Development

1. Install npm dependencies:
    ```bash
    npm i
    ```

2. Create a JSON configuration file and enter InfluxDB configuration.
    - See [Configuration](#configuration) for more information.

3. Build and start the gateway in development mode (prettier logging):
    ```bash
    npm run dev
    ```

### Production

In "production", PM2 is used to run the gateway as a daemon.
The configuration is handled the same way as in development mode.

1. Install npm production dependencies:
    ```bash
    npm run build:prod
    ```

2. Start the gateway with PM2:
    ```bash
    pm2 start npm --name 'ruuvi-influxdb-gw' -- start
    ```

3. (OPTIONAL) Check that the gateway is running:
    ```bash
    pm2 list
    ```

## Configuration

By default, configuration is read from `config.json` in the root directory.
This can be changed by setting the `CONFIG_PATH` env variable.

**Configuration options:**
| Config | Key | Description | Type | Required |
| --- | --- | --- | --- | :---: |
| `bluetoothConfig` | - | Bluetooth/Ruuvi configuration | See below | &cross; |
| `bluetoothConfig` | `serviceUuids` | Bluetooth service UUIDs to scan for | `string[]` | &cross; |
| `influxConfig` | - | InfluxDB configuration | See below | &check; |
| `influxConfig` | `url` | Database URL | `string` | &check; |
| `influxConfig` | `token` | API token | `string` | &check; |
| `influxConfig` | `bucket` | Bucket | `string` | &check; |
| `influxConfig` | `org` | Organization | `string` | &check; |
| `influxConfig` | `measurement` | Measurement  | `string` | &check; |
| `influxConfig` | `defaultTags` | Tags to be included with every data point  | `Record<string, string>` | &cross; |
| `influxConfig` | `batchSize` | Max number of data points in a batch | `number` | &cross; |
| `influxConfig` | `flushIntervalMs` | Interval between forceful data flushes (ms) | `number` | &cross; |
| `influxConfig` | `gzipThreshold` | Batches larger than the value will be gzipped | `number` | &cross; |

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

## License

**MIT License** Copyright (c) 2023 Iiro Kiviluoma
