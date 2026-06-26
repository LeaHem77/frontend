import { type Route } from './+types/api.sensor-alerts.unseen-status'
import { getUserId } from '~/services/session-service.server'
import { hasUnseenTriggeredAlerts } from '~/services/sensor-alert.server'

export async function loader({ request }: Route.LoaderArgs) {
    const userId = await getUserId(request)
    if (!userId) return Response.json({ hasUnseen: false })

    const hasUnseen = await hasUnseenTriggeredAlerts(userId)
    return Response.json({ hasUnseen })
}