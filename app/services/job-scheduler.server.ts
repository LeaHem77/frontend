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

    // NUR ZUM TESTEN: Job sofort einmal triggern
	await boss.send(CHECK_ALERTS_JOB, {})

	console.log('✅ pg-boss scheduler initialized')
	return boss
}

async function checkSensorAlerts() {
	const alerts = await drizzleClient.query.sensorAlert.findMany({
		with: {
			device: true,
			sensor: true,
			user: true,
		},
	})

	const cooldownThreshold = new Date(Date.now() - COOLDOWN_MS)

	for (const alert of alerts) {
		// Cooldown check: skip if notified recently
		if (alert.lastNotifiedAt && alert.lastNotifiedAt > cooldownThreshold) {
			continue
		}

		const avgValue = await getHourlyAverage(alert.sensorId)
		if (avgValue === null) continue

		const triggered = checkThreshold(
			avgValue,
			alert.operator as 'gt' | 'lt' | 'eq',
			alert.threshold,
		)

		if (!triggered) continue

		await sendMail({
			recipientAddress: alert.email,
			recipientName: alert.user.name,
			subject: 'Sensor Alert',
			body: SensorAlertEmail({
				user: { name: alert.user.name, email: alert.user.email },
				deviceName: alert.device.name,
				deviceId: alert.device.id,
				sensorTitle: alert.sensor.title,
				operator: alert.operator as 'gt' | 'lt' | 'eq',
				threshold: alert.threshold,
				currentValue: avgValue,
				language: 'de',
			}),
		})

		await drizzleClient
			.update(sensorAlert)
			.set({ lastNotifiedAt: new Date() })
			.where(eq(sensorAlert.id, alert.id))
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

async function getHourlyAverage(sensorId: string) {
  return 30;
}


//async function getHourlyAverage(sensorId: string): Promise<number | null> {
//	const [latest] = await drizzleClient
//		.select()
//		.from(measurements1hourView)
//		.where(eq(measurements1hourView.sensorId, sensorId))
//		.orderBy(desc(measurements1hourView.time))
//		.limit(1)

//	return latest?.value ?? null
//}