import { Form } from "react-router";
import { type Route } from "./+types/account.sensor-alerts._index";
import { requireUser } from "~/services/session-service.server";
import {
  deleteSensorAlert,
  getSensorAlertsForUser,
} from "~/services/sensor-alert.server";

export async function loader({ request }: Route.LoaderArgs) {
  const user = await requireUser(request);
  const alerts = await getSensorAlertsForUser(user.id);
  return { alerts };
}

export async function action({ request }: Route.ActionArgs) {
  const user = await requireUser(request);
  const formData = await request.formData();
  const alertId = formData.get("alertId") as string;
  await deleteSensorAlert(alertId, user.id);
  return null;
}

export default function AccountSensorAlertsRoute({
  loaderData,
}: Route.ComponentProps) {
  const { alerts } = loaderData;

  return (
    <div className="flex w-full flex-col">
      <div className="flex">
        <span className="p-4 text-lg font-bold">
          Meine Sensor-Alerts: {alerts.length}
        </span>
      </div>

      <div className="flex justify-center">
        <table>
          <thead className="border-2 border-black">
            <tr>
              <th className="border-r-2 border-black p-2">Device</th>
              <th className="border-r-2 border-black p-2">Sensor</th>
              <th className="border-r-2 border-black p-2">Operator</th>
              <th className="border-r-2 border-black p-2">Threshold</th>
              <th className="border-r-2 border-black p-2">E-Mail</th>
              <th className="border-r-2 border-black p-2">Erstellt</th>
              <th className="border-r-2 border-black p-2"></th>
            </tr>
          </thead>

          <tbody className="border-2 border-black">
            {alerts.map((alert) => (
              <tr key={alert.id} className="border-2 border-black">
                <td className="border-r-2 border-black p-2">
                  {alert.device?.name ?? alert.deviceId}
                </td>
                <td className="border-r-2 border-black p-2">
                  {alert.sensor?.title ?? alert.sensorId}
                </td>
                <td className="border-r-2 border-black p-2">
                  {alert.operator}
                </td>
                <td className="border-r-2 border-black p-2">
                  {alert.threshold}
                </td>
                <td className="border-r-2 border-black p-2">{alert.email}</td>
                <td className="border-r-2 border-black p-2">
                  {new Date(alert.createdAt).toLocaleString()}
                </td>
                <td className="border-r-2 border-black p-2">
                  <Form method="post">
                    <input type="hidden" name="alertId" value={alert.id} />
                    <button
                      type="submit"
                      className="cursor-pointer hover:underline hover:underline-offset-2"
                    >
                      Löschen
                    </button>
                  </Form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
