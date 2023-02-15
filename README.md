# Ruuvi-InfluxDB Gateway

TODO

## Configuration

TODO: Description

**Example config:**

```json
{
  "bluetoothConfig": {
    "serviceUuids": ["fe9a"],
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

| Library | License |
| --- | --- |
| Ruuvi / ojousima | BSD-3 |
| InfluxDB | MIT |
| Noble | MIT |
| Pino | MIT |
| Zod | MIT |
