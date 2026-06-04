import { type Route } from './+types/api.sensor-alerts'
import { getUserId } from '~/services/session-service.server'
import { getUserFromJwt } from '~/lib/jwt'
import { StandardResponse } from '~/lib/responses'
import {
    createSensorAlert,
    deleteSensorAlert,
    getSensorAlertsForUser,
} from '~/services/sensor-alert.server'

/**
 * @openapi
 * /api/sensor-alerts:
 *   get:
 *     summary: Get all sensor alerts for the authenticated user
 *     tags: [SensorAlerts]
 *     responses:
 *       200:
 *         description: List of sensor alerts
 *       401:
 *         description: Unauthorized
 */
export async function loader({ request }: Route.LoaderArgs) {
    const user = await getUserFromJwt(request)
    if (typeof user === 'string') {
        return StandardResponse.unauthorized('No valid token provided')
    }

    const alerts = await getSensorAlertsForUser(user.id)
    return StandardResponse.ok({ alerts })
}

/**
 * @openapi
 * /api/sensor-alerts:
 *   post:
 *     summary: Create a new sensor alert
 *     tags: [SensorAlerts]
 *     responses:
 *       201:
 *         description: Alert created
 *       401:
 *         description: Unauthorized
 *   delete:
 *     summary: Delete a sensor alert
 *     tags: [SensorAlerts]
 *     responses:
 *       200:
 *         description: Alert deleted
 *       401:
 *         description: Unauthorized
 */
export async function action({ request }: Route.ActionArgs) {
    const authHeader = request.headers.get('authorization')
    let userId: string | undefined

    if (authHeader) {
        const user = await getUserFromJwt(request)
        if (typeof user === 'string') {
            return StandardResponse.unauthorized('No valid token provided')
        }
        userId = user.id
    } else {
        userId = (await getUserId(request)) ?? undefined
        if (!userId) {
            return StandardResponse.unauthorized('No valid token provided')
        }
    }

    if (request.method === 'DELETE') {
        const { alertId } = await request.json()
        if (!alertId) {
            return StandardResponse.badRequest('alertId is required')
        }
        await deleteSensorAlert(alertId, userId)
        return StandardResponse.noContent()
    }

    if (request.method === 'POST') {
        const { deviceId, sensorId, operator, threshold, email } =
            await request.json()

        if (!deviceId || !sensorId || !operator || threshold === undefined || !email) {
            return StandardResponse.badRequest('Missing required fields')
        }

        const alert = await createSensorAlert({
            userId,
            deviceId,
            sensorId,
            operator,
            threshold,
            email,
        })

        return StandardResponse.created({ alert })
    }

    return StandardResponse.methodNotAllowed('Only GET, POST and DELETE are supported')
}