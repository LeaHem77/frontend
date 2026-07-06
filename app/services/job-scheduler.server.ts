import { eq, desc } from 'drizzle-orm'
import { drizzleClient } from '~/db.server'
import { sensorAlert } from '~/db/schema'
import { measurements1hourView } from '~/db/schema/measurement'
import { sendMail } from '~/lib/mail.server'
import { SensorAlertEmail } from '~/emails/sensor-alert-mail'

import { PgBoss } from 'pg-boss'

const CHECK_ALERTS_JOB = 'check-sensor-alerts'
const COOLDOWN_MS = 60 * 60 * 1000 // 1 Stunde

let boss: PgBoss | null = null

export async function initScheduler() {
	if (boss) return boss

	boss = new PgBoss(process.env.DATABASE_URL)

	boss.on('error', (error: Error) => console.error('pg-boss error:', error))

	await boss.start()

	await boss.createQueue(CHECK_ALERTS_JOB)

	await boss.schedule(CHECK_ALERTS_JOB, '*/5 * * * *')

	await boss.work(CHECK_ALERTS_JOB, async () => {
		await checkSensorAlerts()
	})

	console.log('pg-boss scheduler initialized')
	return boss
}

function getUserLanguage(user: { language: string | null }): 'de' | 'en' {
    return user.language?.startsWith('de') ? 'de' : 'en'
}

async function checkSensorAlerts() {
    const alerts = await drizzleClient.query.sensorAlert.findMany({
        with: { device: true, sensor: true, user: true },
    })

    const cooldownThreshold = new Date(Date.now() - COOLDOWN_MS)

    const byUserAndEmail = new Map<string, typeof alerts>()
    for (const alert of alerts) {
        const key = `${alert.userId}::${alert.email}`
        if (!byUserAndEmail.has(key)) byUserAndEmail.set(key, [])
        byUserAndEmail.get(key)!.push(alert)
    }

    for (const [key, userAlerts] of byUserAndEmail) {
        const [_, email] = key.split('::')

        const lastNotified = userAlerts
            .map((a) => a.lastNotifiedAt)
            .filter(Boolean)
            .sort((a, b) => b!.getTime() - a!.getTime())[0]

        if (lastNotified && lastNotified > cooldownThreshold) continue

        const triggered: { alert: typeof userAlerts[0]; avgValue: number }[] = []
        for (const alert of userAlerts) {
            const avgValue = await getHourlyAverage(alert.sensorId)
            if (avgValue === null) continue
            if (checkThreshold(avgValue, alert.operator as 'gt' | 'lt' | 'eq', alert.threshold)) {
                triggered.push({ alert, avgValue })
            }
        }

        if (triggered.length === 0) continue

        const user = userAlerts[0].user

        await sendMail({
            recipientAddress: email,
            recipientName: user.name,
            subject: triggered.length === 1
                ? 'Sensor Alert'
                : `${triggered.length} Sensor Alerts`,
            body: SensorAlertEmail({
                user: { name: user.name, email: user.email },
                triggeredAlerts: triggered.map(({ alert, avgValue }) => ({
                    deviceName: alert.device.name,
                    deviceId: alert.device.id,
                    sensorTitle: alert.sensor.title,
                    operator: alert.operator as 'gt' | 'lt' | 'eq',
                    threshold: alert.threshold,
                    currentValue: avgValue,
                })),
                language: getUserLanguage(user),
            }),
        })

        // lastNotifiedAt für alle Alerts dieser Gruppe setzen
        for (const alert of triggered.map((t) => t.alert)) {
            await drizzleClient
                .update(sensorAlert)
                .set({ lastNotifiedAt: new Date() })
                .where(eq(sensorAlert.id, alert.id))
        }
    }
}

function checkThreshold(
	value: number,
	operator: 'gt' | 'lt' | 'eq',
	threshold: number,
): boolean {
	switch (operator) {
		case 'gt':
			return value > threshold
		case 'lt':
			return value < threshold
		case 'eq':
			return value === threshold
		default:
			return false
	}
}

// async function getHourlyAverage(sensorId: string) {
//   return 30;
// }


async function getHourlyAverage(sensorId: string): Promise<number | null> {
	const [latest] = await drizzleClient
		.select()
		.from(measurements1hourView)
		.where(eq(measurements1hourView.sensorId, sensorId))
		.orderBy(desc(measurements1hourView.time))
		.limit(1)

	return latest?.value ?? null
}