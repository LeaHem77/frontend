import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog'
import { Button } from '../ui/button'
import { Slider } from '~/components/ui/slider'
import { getSensorAlertDefaults } from '~/lib/sensor-alert-defaults'

interface SensorConfig {
  sensorId: string
  deviceId: string
  title: string
  unit: string | null
  operator: string
  threshold: number
  enabled: boolean
}

interface Device {
  id: string
  name: string
  sensors: {
    id: string
    title: string
    unit: string | null
  }[]
}

interface AreaAlertDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  devices: Device[]
}

export default function AreaAlertDialog({
  open,
  onOpenChange,
  devices,
}: AreaAlertDialogProps) {
  const [email, setEmail] = useState('')
  const [sensorConfigs, setSensorConfigs] = useState<Record<string, SensorConfig>>({})
  const { t } = useTranslation()

  useEffect(() => {
    const configs: Record<string, SensorConfig> = {}
    for (const device of devices) {
      for (const sensor of device.sensors) {
        const defaults = getSensorAlertDefaults(sensor.title)
        configs[sensor.id] = {
          sensorId: sensor.id,
          deviceId: device.id,
          title: sensor.title,
          unit: sensor.unit,
          operator: defaults?.defaultOperator ?? 'gt',
          threshold: defaults?.defaultThreshold ?? 0,
          enabled: true,
        }
      }
    }
    setSensorConfigs(configs)
  }, [devices])

  const allSensors = devices.flatMap((d) =>
    d.sensors.map((s) => ({ ...s, deviceId: d.id, deviceName: d.name }))
  )

  const handleSave = async () => {
    for (const config of Object.values(sensorConfigs)) {
      if (!config.enabled) continue
      await fetch('/api/sensor-alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sensorId: config.sensorId,
          deviceId: config.deviceId,
          operator: config.operator,
          threshold: config.threshold,
          email,
        }),
      })
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg dark:bg-zinc-800 dark:text-zinc-200 max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            <span style={{ color: '#0778bc' }}>{t('sensorAlert.areaAlert.title')}</span>
            {' – '}
            <span className="text-sm font-normal text-muted-foreground">
              {allSensors.length} {t('sensorAlert.areaAlert.sensorsFound')}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {allSensors.map((sensor) => {
            const config = sensorConfigs[sensor.id]
            if (!config) return null
            const defaults = getSensorAlertDefaults(sensor.title)
            const min = defaults?.min ?? 0
            const max = defaults?.max ?? 100
            const step = (max - min) > 50 ? 1 : 0.1

            return (
              <div
                key={sensor.id}
                className={`space-y-2 border-b pb-4 transition-opacity ${!config.enabled ? 'opacity-40' : ''}`}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={config.enabled}
                      onChange={(e) =>
                        setSensorConfigs((prev) => ({
                          ...prev,
                          [sensor.id]: { ...prev[sensor.id], enabled: e.target.checked },
                        }))
                      }
                    />
                    <span className="text-sm font-medium" style={{ color: '#4eaf47' }}>
                      {sensor.title}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">{sensor.deviceName}</span>
                </div>

                <select
                  value={config.operator}
                  disabled={!config.enabled}
                  onChange={(e) =>
                    setSensorConfigs((prev) => ({
                      ...prev,
                      [sensor.id]: { ...prev[sensor.id], operator: e.target.value },
                    }))
                  }
                  className="border rounded-md px-2 py-1.5 text-sm bg-transparent"
                >
                  <option value="gt">&gt;</option>
                  <option value="lt">&lt;</option>
                  <option value="eq">=</option>
                </select>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{min} {sensor.unit}</span>
                    <span className="font-semibold text-sm text-foreground">
                      {config.threshold} {sensor.unit}
                    </span>
                    <span>{max} {sensor.unit}</span>
                  </div>
                  <Slider
                    min={min}
                    max={max}
                    step={step}
                    disabled={!config.enabled}
                    value={[config.threshold]}
                    onValueChange={([val]) =>
                      setSensorConfigs((prev) => ({
                        ...prev,
                        [sensor.id]: { ...prev[sensor.id], threshold: val },
                      }))
                    }
                  />
                </div>
              </div>
            )
          })}

          <div className="space-y-1.5">
            <label className="text-sm text-muted-foreground">Email</label>
            <input
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded-md px-2 py-1.5 text-sm bg-transparent"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('sensorAlert.areaAlert.cancel')}
          </Button>
          <Button onClick={handleSave} disabled={!email}>
            {t('sensorAlert.areaAlert.saveAll')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}