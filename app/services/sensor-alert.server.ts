import { and, eq } from 'drizzle-orm'
import { drizzleClient } from '~/db.server' 
import { sensorAlert, type InsertSensorAlert } from '~/db/schema'

export async function createSensorAlert(
    data: Omit<InsertSensorAlert, 'id' | 'createdAt' | 'updatedAt'>,
) {
    const [created] = await drizzleClient
        .insert(sensorAlert)
        .values(data)
        .returning()
    return created
}

export async function getSensorAlertsForUser(userId: string) {
    return drizzleClient.query.sensorAlert.findMany({
        where: eq(sensorAlert.userId, userId),
        with: {
            device: true,
            sensor: true,
        },
    })
}

export async function deleteSensorAlert(alertId: string, userId: string) {
    return drizzleClient
        .delete(sensorAlert)
        .where(
            and(
                eq(sensorAlert.id, alertId),
                eq(sensorAlert.userId, userId),
            ),
        )
}

export async function getSensorAlertsCountForUser(userId: string) {
    const alerts = await drizzleClient
        .select({ id: sensorAlert.id })
        .from(sensorAlert)
        .where(eq(sensorAlert.userId, userId))
    return alerts.length
}