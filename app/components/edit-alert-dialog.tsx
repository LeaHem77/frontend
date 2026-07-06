import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pencil } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from './ui/dialog'
import { Button } from './ui/button'
import { Slider } from '~/components/ui/slider'
import { getSensorAlertDefaults } from '~/lib/sensor-alert-defaults'
import { isValidEmail } from '~/lib/validation'
import type { SensorAlert } from '~/db/schema'
import { useToast } from '~/components/ui/use-toast'

interface EditAlertDialogProps {
    alert: SensorAlert & {
        sensor?: { title: string; unit?: string | null } | null
        device?: { name: string } | null
    }
    onSaved: () => void
}

export default function EditAlertDialog({ alert, onSaved }: EditAlertDialogProps) {
    const { t } = useTranslation()
    const [open, setOpen] = useState(false)
    const [operator, setOperator] = useState(alert.operator)
    const [threshold, setThreshold] = useState(alert.threshold)
    const [thresholdInput, setThresholdInput] = useState(String(alert.threshold))
    const [email, setEmail] = useState(alert.email)
    const { toast } = useToast()

    const sensorTitle = alert.sensor?.title ?? ''
    const defaults = getSensorAlertDefaults(sensorTitle)
    const min = defaults?.min ?? 0
    const max = defaults?.max ?? 100
    const step = (max - min) > 50 ? 1 : 0.1
    const unit = alert.sensor?.unit ?? ''
    const emailValid = email === '' || isValidEmail(email)

    const handleSave = async () => {
        await fetch('/api/sensor-alerts', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ alertId: alert.id, operator, threshold, email }),
        })
        setOpen(false)
        onSaved()
        toast({
            title: t('sensorAlert.edit_toast_title'),
            description: (
                <span>
                    {t('sensorAlert.edit_toast_description')}
                </span>
            ),
        })
    }

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="cursor-pointer hover:text-blue-500 transition-colors"
            >
                <Pencil className="h-4 w-4" />
            </button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-md dark:bg-zinc-800 dark:text-zinc-200">
                    <DialogHeader>
                        <DialogTitle>
                            <span style={{ color: '#0778bc' }}>{t('sensorAlert.edit_title')}</span>
                            {' – '}
                            <span style={{ color: '#4eaf47' }}>{sensorTitle}</span>
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-6 py-2">
                        <select
                            value={operator}
                            onChange={(e) => setOperator(e.target.value)}
                            className="border rounded-md px-2 py-1.5 text-sm bg-transparent"
                        >
                            <option value="gt">{t('sensorAlert.greaterThan')}</option>
                            <option value="lt">{t('sensorAlert.lessThan')}</option>
                            <option value="eq">{t('sensorAlert.equalTo')}</option>
                        </select>

                        <div className="space-y-3">
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>{min} {unit}</span>
                                <span className="font-semibold text-sm text-foreground">
                                    {threshold} {unit}
                                </span>
                                <span>{max} {unit}</span>
                            </div>
                            <Slider
                                min={min}
                                max={max}
                                step={step}
                                value={[threshold]}
                                onValueChange={(values: number[]) => {
                                    setThreshold(values[0])
                                    setThresholdInput(String(values[0]))
                                }}
                            />
                        </div>

                        <input
                            type="number"
                            step="any"
                            placeholder={t('sensorAlert.threshold')}
                            value={thresholdInput}
                            onKeyDown={(e) => {
                                if (e.key === 'e' || e.key === 'E' || e.key === '+') e.preventDefault()
                            }}
                            onChange={(e) => {
                                const val = e.target.value
                                setThresholdInput(val)
                                const parsed = parseFloat(val)
                                if (!Number.isNaN(parsed)) setThreshold(parsed)
                            }}
                            className="border rounded-md px-2 py-1.5 text-sm bg-transparent w-32"
                        />

                        <div className="space-y-1.5">
                            <label className="text-sm text-muted-foreground">
                                {t('sensorAlert.email_subscription')}
                            </label>
                            <input
                                type="email"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className={`w-full border rounded-md px-2 py-1.5 text-sm bg-transparent ${!emailValid ? 'border-red-500' : ''
                                    }`}
                            />
                            {!emailValid && (
                                <p className="text-xs text-red-500">
                                    {t('sensorAlert.email_invalid')}
                                </p>
                            )}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpen(false)}>
                            {t('sensorAlert.cancel')}
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={!email || !isValidEmail(email)}
                        >
                            {t('sensorAlert.save')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}