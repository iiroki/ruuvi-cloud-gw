# Ruuvi-InfluxDB Gateway

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
    - By default, configuration is read from `config.json` in the root directory.
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

## License

**MIT License** Copyright (c) 2023 Iiro Kiviluoma
