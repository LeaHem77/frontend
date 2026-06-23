import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Bell } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog"
import { Button } from "../ui/button"
import { Slider } from "~/components/ui/slider"
import { getSensorAlertDefaults } from "~/lib/sensor-alert-defaults"
import { type SensorWithLatestMeasurement } from "~/db/schema"

interface SensorAlertDialogProps {
  sensor: SensorWithLatestMeasurement
}

export default function SensorAlertDialog({ sensor }: SensorAlertDialogProps) {
  const { t } = useTranslation()
  const defaults = getSensorAlertDefaults(sensor.title)

  const [open, setOpen] = useState(false)
  const [operator, setOperator] = useState<string>(defaults?.defaultOperator ?? "gt")
  const [threshold, setThreshold] = useState<number>(defaults?.defaultThreshold ?? 0)
  const [email, setEmail] = useState<string>("")

  useEffect(() => {
    if (open) {
      setOperator(defaults?.defaultOperator ?? "gt")
      setThreshold(defaults?.defaultThreshold ?? 0)
    }
  }, [open])

  const min = defaults?.min ?? 0
  const max = defaults?.max ?? 100
  const step = (max - min) > 50 ? 1 : 0.1

 const handleSave = async () => {
  console.log({ sensorId: sensor.id, deviceId: sensor.deviceId, operator, threshold, email })
  try {
    const response = await fetch("/api/sensor-alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sensorId: sensor.id,
        deviceId: sensor.deviceId,
        operator,
        threshold,
        email,
      }),
    })

    if (!response.ok) throw new Error("Failed to create alert")
    setOpen(false)
  } catch (err) {
    console.error(err)
  }
}

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <button
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setOpen(true)
        }}
        className="text-muted-foreground hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
        title={t("sensorAlert.buttonTitle")}
      >
        <Bell className="h-4 w-4" />
      </button>

      <DialogContent className="sm:max-w-md dark:bg-zinc-800 dark:text-zinc-200">
        <DialogHeader>
          <DialogTitle>
            <span style={{ color: "#0778bc" }}>{t("sensorAlert.title")}</span>
            {" – "}
            <span style={{ color: "#4eaf47" }}>{sensor.title}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
          <p className="text-muted-foreground text-sm">
            {t("sensorAlert.description")}
          </p>

          <select
            value={operator}
            onChange={(e) => setOperator(e.target.value)}
            className="border rounded-md px-2 py-1.5 text-sm bg-transparent"
          >
            <option value="gt">{t("sensorAlert.greaterThan")}</option>
            <option value="lt">{t("sensorAlert.lessThan")}</option>
            <option value="eq">{t("sensorAlert.equalTo")}</option>
          </select>

          <div className="space-y-3">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{min} {sensor.unit}</span>
              <span className="font-semibold text-sm text-foreground">
                {threshold} {sensor.unit}
              </span>
              <span>{max} {sensor.unit}</span>
            </div>
            <Slider
              min={min}
              max={max}
              step={step}
              value={[threshold]}
              onValueChange={([val]) => setThreshold(val)}
            />
          </div>

          <input
            type="number"
            placeholder={t("sensorAlert.threshold")}
            value={threshold}
            onChange={(e) => setThreshold(parseFloat(e.target.value))}
            className="border rounded-md px-2 py-1.5 text-sm bg-transparent w-32"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm text-muted-foreground">
            {t("sensorAlert.email_subscription")}
          </label>
          <input
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded-md px-2 py-1.5 text-sm bg-transparent"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            {t("sensorAlert.cancel")}
          </Button>
          <Button onClick={handleSave} disabled={threshold === undefined || !email}>
            {t("sensorAlert.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}