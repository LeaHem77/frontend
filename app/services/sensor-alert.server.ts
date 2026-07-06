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

export async function getTriggeredAlertsForUser(userId: string) {
    return drizzleClient.query.sensorAlert.findMany({
        where: (sa, { eq, and, isNotNull }) =>
            and(
                eq(sa.userId, userId),
                isNotNull(sa.lastNotifiedAt),
            ),
        with: {
            device: true,
            sensor: true,
        },
    })
}

export async function hasUnseenTriggeredAlerts(userId: string): Promise<boolean> {
    const alerts = await getTriggeredAlertsForUser(userId)
    return alerts.length > 0
}

export async function markAlertsAsSeen(userId: string) {
    return drizzleClient
        .update(sensorAlert)
        .set({ seenAt: new Date() })
        .where(eq(sensorAlert.userId, userId))
}

export async function updateSensorAlert(
    alertId: string,
    userId: string,
    data: { operator: string; threshold: number; email: string }
) {
    return drizzleClient
        .update(sensorAlert)
        .set({
            operator: data.operator,
            threshold: data.threshold,
            email: data.email,
            updatedAt: new Date(),
        })
        .where(
            and(
                eq(sensorAlert.id, alertId),
                eq(sensorAlert.userId, userId)
            )
        )
}