import { type Route } from './+types/api.devices.in-polygon'
import { getDevicesInPolygon } from '~/db/models/device.server'
import { getSensorsFromDevice } from '~/db/models/sensor.server'
import { StandardResponse } from '~/lib/responses'

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== 'POST') {
    return StandardResponse.methodNotAllowed('Only POST is supported')
  }

  const { polygon } = await request.json()

  if (!polygon) {
    return StandardResponse.badRequest('polygon is required')
  }

  const devices = await getDevicesInPolygon(polygon, 50)

  // Für jedes Device die Sensoren laden
  const devicesWithSensors = await Promise.all(
    devices.map(async (d) => {
      const sensors = await getSensorsFromDevice(d.id)
      return { ...d, sensors }
    })
  )

  const totalSensors = devicesWithSensors.reduce(
    (acc, d) => acc + d.sensors.length,
    0
  )

  if (totalSensors > 50) {
    return StandardResponse.badRequest(
      'Too many sensors in this area (max 10). Please draw a smaller area.'
    )
  }

  return StandardResponse.ok({ devices: devicesWithSensors })
}