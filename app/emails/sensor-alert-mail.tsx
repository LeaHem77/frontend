import { createIntl } from "@formatjs/intl";
import {
  Html,
  Head,
  Body,
  Link,
  Preview,
  Container,
  Text,
  Heading,
} from "react-email";

const messages = {
  en: {
    preview: "Sensor alert triggered",
    heading: "Sensor alert triggered",
    hello: "Hi",
    description: "Your sensor alert was triggered:",
    device: "Device",
    sensor: "Sensor",
    condition: "Condition",
    currentValue: "Current value",
    viewDevice: "View device",
    notice:
      "You will not receive another notification for this alert within the next hour, even if the condition continues to be met.",
    support: "If you have any questions, feel free to write us an email to:",
    salutation: "Best wishes your openSenseMap Team",
  },
  de: {
    preview: "Sensor-Alert ausgelöst",
    heading: "Sensor-Alert ausgelöst",
    hello: "Hallo",
    description: "Dein Sensor-Alert wurde ausgelöst:",
    device: "Device",
    sensor: "Sensor",
    condition: "Bedingung",
    currentValue: "Aktueller Wert",
    viewDevice: "Device ansehen",
    notice:
      "Du erhältst innerhalb der nächsten Stunde keine weitere Benachrichtigung für diesen Alert, auch wenn die Bedingung weiterhin erfüllt ist.",
    support: "Wenn Du Fragen hast schreib uns eine Mail an:",
    salutation: "Viele Grüße, dein openSenseMap Team",
  },
};

interface SensorAlertEmailProps {
  user: { name: string; email: string };
  deviceName: string;
  deviceId: string;
  sensorTitle: string;
  operator: "gt" | "lt" | "eq";
  threshold: number;
  currentValue: number;
  language: "de" | "en";
}

const baseUrl = process.env.OSEM_URL
  ? `https://${process.env.OSEM_URL}`
  : "https://opensensemap.org";

const operatorSymbol = {
  gt: ">",
  lt: "<",
  eq: "=",
};

export const SensorAlertEmail = ({
  user = { name: "Max Mustermann", email: "max.mustermann@example.com" },
  deviceName = "Meine Box",
  deviceId = "1234-5678-9012",
  sensorTitle = "Temperatur",
  operator = "gt",
  threshold = 25,
  currentValue = 27.3,
  language = "en",
}: SensorAlertEmailProps) => {
  const intl = createIntl({
    locale: language,
    messages: messages[language],
  });

  return (
    <Html lang={language} dir="ltr">
      <Head />
      <Preview>{intl.formatMessage({ id: "preview" })}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>{intl.formatMessage({ id: "heading" })}</Heading>
          <Text>
            {intl.formatMessage({ id: "hello" })} {user.name},
          </Text>
          <Text>{intl.formatMessage({ id: "description" })}</Text>
          <code style={code}>
            {intl.formatMessage({ id: "device" })}: {deviceName}
            {"\n"}
            {intl.formatMessage({ id: "sensor" })}: {sensorTitle}
            {"\n"}
            {intl.formatMessage({ id: "condition" })}: {sensorTitle}{" "}
            {operatorSymbol[operator]} {threshold}
            {"\n"}
            {intl.formatMessage({ id: "currentValue" })}: {currentValue}
          </code>
          <Link
            href={`${baseUrl}/explore/${deviceId}`}
            style={{ marginTop: "16px" }}
          >
            {intl.formatMessage({ id: "viewDevice" })}
          </Link>
          <Text
            style={{
              ...text,
              color: "#ababab",
              marginTop: "14px",
              marginBottom: "16px",
            }}
          >
            {intl.formatMessage({ id: "notice" })}
          </Text>
          <Text>
            {intl.formatMessage({ id: "support" })} {}
            <Link
              href={`mailto:support@opensensemap.org?Subject=Sensor%20Alert%20${encodeURIComponent(
                user.email,
              )}`}
            >
              support@opensensemap.org
            </Link>
          </Text>
          <Text>{intl.formatMessage({ id: "salutation" })}</Text>
        </Container>
      </Body>
    </Html>
  );
};

export default SensorAlertEmail;

export const subject = {
  de: "Sensor-Alert ausgelöst",
  en: "Sensor alert triggered",
};

const main = {
  backgroundColor: "#ffffff",
};

const container = {
  paddingLeft: "12px",
  paddingRight: "12px",
  margin: "0 auto",
};

const h1 = {
  color: "#333",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "40px 0",
  padding: "0",
};

const text = {
  color: "#333",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
  fontSize: "14px",
  margin: "24px 0",
};

const code = {
  display: "inline-block",
  padding: "16px 4.5%",
  width: "90.5%",
  whiteSpace: "pre-wrap" as const,
  backgroundColor: "#f4f4f4",
  borderRadius: "5px",
  border: "1px solid #eee",
  color: "#333",
};
