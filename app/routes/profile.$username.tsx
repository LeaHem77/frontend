import { useTranslation } from "react-i18next";
import { redirect, useLoaderData, Form } from "react-router";
import { Trash2 } from "lucide-react";
import { type Route } from "./+types/profile.$username";
import { getColumns } from "~/components/mydevices/dt/columns";
import { DataTable } from "~/components/mydevices/dt/data-table";
import { NavBar } from "~/components/nav-bar";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import {
  getProfileByUserId,
  getProfileByUsername,
  getProfileSensorsAndMeasurementsCount,
} from "~/db/models/profile.server";
import { formatCount } from "~/lib/numbers";
import { getInitials } from "~/lib/strings";
import { getUserId } from "~/services/session-service.server";
import { claimBox } from "~/services/transfer-service.server";
import { userNameFromURl } from "~/services/user-service.server";
// import {  } from "~/services/sensor-alert.server";
import { getSensorAlertsForUser } from "~/services/sensor-alert.server";
import { deleteSensorAlert } from "~/services/sensor-alert.server";
import { getTriggeredAlertsForUser } from "~/services/sensor-alert.server";
import EditAlertDialog from '~/components/edit-alert-dialog';

type ActionData = {
  success: boolean;
  message?: string;
  error?: string;
  claimedBoxId?: string;
};

export async function loader({ params, request }: Route.LoaderArgs) {
  const requestingUserId = await getUserId(request);

  const username = userNameFromURl(params.username as string);
  if (!username) {
    return {
      profile: null,
      requestingUserId,
      sensorsCount: "0",
      measurementsCount: "0",
      subscribedSensorsCount: 0,
      sensorAlerts: [],
      triggeredAlerts: [],
    };
  }

  const profile = await getProfileByUsername(username);

  if (!profile) return redirect("/explore");

  if (!profile.public && requestingUserId !== profile.userId) {
    return redirect("/explore");
  }

  const counts = await getProfileSensorsAndMeasurementsCount(profile);

  const subscribedSensorsCount = requestingUserId
    ? (await getSensorAlertsForUser(requestingUserId)).length
    : 0;

  const isOwnerView = requestingUserId && requestingUserId === profile.userId;

  const sensorAlerts = isOwnerView
    ? await getSensorAlertsForUser(requestingUserId)
    : [];

  const triggeredAlerts = isOwnerView
    ? await getTriggeredAlertsForUser(requestingUserId)
    : [];

  return {
    profile,
    requestingUserId,
    sensorsCount: counts.sensorsCount,
    measurementsCount: counts.measurementsCount,
    subscribedSensorsCount,
    sensorAlerts,
    triggeredAlerts,
  };
}

export async function action({ request, params }: Route.ActionArgs) {
  const userId = await getUserId(request);
  if (!userId) return redirect("/");

  const username = params.username;
  if (!username) {
    return {
      success: false,
      error: "Missing username.",
    } satisfies ActionData;
  }

  const profile = await getProfileByUserId(userId);
  if (!profile || profile.userId !== userId) {
    return {
      success: false,
      error: "You can only claim a device from your own profile page.",
    } satisfies ActionData;
  }

  const formData = await request.formData();
  const intent = formData.get("intent")?.toString();
  const token = formData.get("token")?.toString().trim();
  const alertId = formData.get("alertId")?.toString();
  if (alertId) {
    await deleteSensorAlert(alertId, userId);
    return null;
  }

  if (intent !== "claim-device") {
    return {
      success: false,
      error: "Unknown action.",
    } satisfies ActionData;
  }

  if (!token) {
    return {
      success: false,
      error: "Please enter a transfer token.",
    } satisfies ActionData;
  }

  try {
    const result = await claimBox(userId, token);

    return {
      success: true,
      message: result.message,
      claimedBoxId: result.boxId,
    } satisfies ActionData;
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to claim device.";

    return {
      success: false,
      error: message,
    } satisfies ActionData;
  }
}

export default function ProfilePage() {
  const {
    profile,
    sensorsCount,
    measurementsCount,
    requestingUserId,
    subscribedSensorsCount,
    sensorAlerts,
    triggeredAlerts,
  } = useLoaderData<typeof loader>();

  const { t } = useTranslation("profile");
  const { t: tCommon } = useTranslation("common");

  const columnsTranslation = useTranslation("data-table");

  const isOwner = !!profile?.userId && requestingUserId === profile.userId;

  return (
    <div className="h-full bg-slate-100">
      <NavBar />
      <div className="flex w-full flex-col gap-6 p-8 md:flex-row md:gap-8 md:pt-4">
        <div className="dark:bg-dark-background flex w-full flex-col gap-6 rounded-xl bg-white p-6 shadow-lg md:w-1/3">
          <div className="dark:text-dark-text flex items-center gap-4">
            <Avatar className="h-16 w-16">
              {profile?.profileImage?.id ? (
                <AvatarImage
                  className="aspect-auto h-full w-full rounded-full object-cover"
                  src={`/resources/file/${profile.profileImage.id}`}
                />
              ) : null}
              <AvatarFallback>
                {getInitials(profile?.displayName ?? "")}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="dark:text-dark-text text-2xl font-semibold">
                {profile?.displayName || ""}
              </h3>
              <h4 className="dark:text-dark-text text-lg">
                {profile?.user?.name || ""}
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t("user_since")}{" "}
                {new Date(profile?.user?.createdAt || "").toLocaleDateString(
                  t("locale"),
                )}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 md:pt-6">
            <div className="dark:bg-dark-boxes flex flex-col items-center rounded-lg bg-gray-100 p-4">
              <span className="dark:text-dark-green text-2xl font-bold">
                {formatCount(profile?.user?.devices.length || 0)}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {t("devices")}
              </span>
            </div>
            <div className="dark:bg-dark-boxes flex flex-col items-center rounded-lg bg-gray-100 p-4">
              <span className="dark:text-dark-green text-2xl font-bold">
                {sensorsCount}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {t("sensors")}
              </span>
            </div>
            <div className="dark:bg-dark-boxes flex flex-col items-center rounded-lg bg-gray-100 p-4">
              <span className="dark:text-dark-green text-2xl font-bold">
                {measurementsCount}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {t("measurements")}
              </span>
            </div>
            <div className="dark:bg-dark-boxes flex flex-col items-center rounded-lg bg-gray-100 p-4">
              <span className="dark:text-dark-green text-2xl font-bold">
                {subscribedSensorsCount}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {t("subscribed sensors")}
              </span>
            </div>
          </div>

          {isOwner && triggeredAlerts.length > 0 && (
            <div className="rounded-lg border border-red-300 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/30">
              <div className="mb-2 flex items-center gap-2 text-red-600 dark:text-red-400">
                <span className="h-2 w-2 rounded-full bg-red-500" />
                <span className="text-sm font-semibold">
                  {tCommon("sensorAlert.triggeredAlerts")}
                </span>
              </div>
              <ul className="space-y-1 text-sm">
                {triggeredAlerts.map((alert) => (
                  <li
                    key={alert.id}
                    className="text-gray-700 dark:text-gray-300"
                  >
                    <span className="font-medium">{alert.device?.name}</span>
                    {" – "}
                    {alert.sensor?.title} ({alert.operator} {alert.threshold})
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex w-full flex-col gap-6 md:w-2/3">
          <div className="dark:bg-dark-background rounded-xl bg-white p-6 shadow-lg">
            <div className="text-light-green dark:text-dark-green mb-4 text-3xl font-semibold">
              {t("devices")}
            </div>

            {profile?.user?.devices && (
              <DataTable
                columns={getColumns(columnsTranslation, { isOwner })}
                data={profile.user.devices}
                getRowClassName={(device) =>
                  device.archivedAt
                    ? "opacity-60 bg-slate-100 dark:bg-slate-900/40"
                    : ""
                }
              />
            )}
          </div>
          {isOwner && sensorAlerts.length > 0 && (
            <div className="dark:bg-dark-background rounded-xl bg-white p-6 shadow-lg">
              <div className="text-light-green dark:text-dark-green mb-4 text-3xl font-semibold">
                {tCommon("sensorAlert.triggeredAlerts")}
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="p-2 text-left">Device</th>
                    <th className="p-2 text-left">Sensor</th>
                    <th className="p-2 text-left">Operator</th>
                    <th className="p-2 text-left">Threshold</th>
                    <th className="p-2 text-left">E-Mail</th>
                    <th className="p-2 text-left"></th>
                  </tr>
                </thead>
                <tbody>
                  {sensorAlerts.map((alert) => (
                    <tr key={alert.id} className="border-b">
                      <td className="p-2">
                        {alert.device?.name ?? alert.deviceId}
                      </td>
                      <td className="p-2">
                        {alert.sensor?.title ?? alert.sensorId}
                      </td>
                      <td className="p-2">{alert.operator}</td>
                      <td className="p-2">{alert.threshold}</td>
                      <td className="p-2">{alert.email}</td>
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          <EditAlertDialog
                            alert={alert}
                            onSaved={() => window.location.reload()}
                          />
                          <Form method="post" action={`/profile/${profile?.user?.name}`}>
                            <input type="hidden" name="alertId" value={alert.id} />
                            <button
                              type="submit"
                              className="cursor-pointer hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </Form>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
