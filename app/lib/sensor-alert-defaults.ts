interface SensorAlertDefault {
    min: number
    max: number
    defaultThreshold: number
    defaultOperator: "gt" | "lt" | "eq"
    unit: string
}

const SENSOR_ALERT_DEFAULTS: Record<string, SensorAlertDefault> = {
    // temperature
    "temperatur": { min: -89.2, max: 56.7, defaultThreshold: 30, defaultOperator: "gt", unit: "°C" },
    "temperature": { min: -89.2, max: 56.7, defaultThreshold: 30, defaultOperator: "gt", unit: "°C" },
    // humidity
    "relative luftfeuchtigkeit": { min: 0, max: 100, defaultThreshold: 65, defaultOperator: "gt", unit: "%" },
    "relative humidity": { min: 0, max: 100, defaultThreshold: 65, defaultOperator: "gt", unit: "%" },
    // air pressure
    "luftdruck": { min: 970, max: 1030, defaultThreshold: 1010, defaultOperator: "lt", unit: "hPa" },
    "air pressure": { min: 970, max: 1030, defaultThreshold: 1010, defaultOperator: "lt", unit: "hPa" },
    // illuminance
    "beleuchtungsstärke": { min: 0, max: 130000, defaultThreshold: 101000, defaultOperator: "lt", unit: "lx" },
    "illuminance": { min: 0, max: 130000, defaultThreshold: 101000, defaultOperator: "lt", unit: "lx" },
    // UV
    "uv-intensität": { min: 0, max: 7, defaultThreshold: 3.75, defaultOperator: "gt", unit: "µW/cm²" },
    "uv-intensity": { min: 0, max: 7, defaultThreshold: 3.75, defaultOperator: "gt", unit: "µW/cm²" },
    // PM10
    "pm10": { min: 0, max: 4500, defaultThreshold: 50, defaultOperator: "gt", unit: "µg/m³" },
    // PM2.5
    "pm2.5": { min: 0, max: 2000, defaultThreshold: 25, defaultOperator: "gt", unit: "µg/m³" },
    // volume
    "lautstärke": { min: 0, max: 310, defaultThreshold: 75, defaultOperator: "gt", unit: "dB" },
    "volume": { min: 0, max: 310, defaultThreshold: 75, defaultOperator: "gt", unit: "dB" },
    // wind speed
    "windgeschwindigkeit": { min: 0, max: 113, defaultThreshold: 12, defaultOperator: "gt", unit: "m/s" },
    "wind speed": { min: 0, max: 113, defaultThreshold: 12, defaultOperator: "gt", unit: "m/s" },
    // wind direction
    "windrichtung": { min: 0, max: 360, defaultThreshold: 90, defaultOperator: "lt", unit: "°" },
    "wind direction": { min: 0, max: 360, defaultThreshold: 90, defaultOperator: "lt", unit: "°" },
    // precipitation
    "niederschlag": { min: 0, max: 300, defaultThreshold: 15, defaultOperator: "gt", unit: "mm/h" },
    "precipitation": { min: 0, max: 300, defaultThreshold: 15, defaultOperator: "gt", unit: "mm/h" },
    // CO2
    "co2": { min: 0, max: 100000, defaultThreshold: 600, defaultOperator: "gt", unit: "ppm" },
}

export function getSensorAlertDefaults(title: string): SensorAlertDefault | null {
    return SENSOR_ALERT_DEFAULTS[title.toLowerCase().trim()] ?? null
}

export type { SensorAlertDefault }