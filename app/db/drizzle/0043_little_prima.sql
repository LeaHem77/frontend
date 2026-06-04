CREATE TABLE "sensor_alert" (
	"id" text PRIMARY KEY NOT NULL,
	"operator" text NOT NULL,
	"threshold" real NOT NULL,
	"email" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"user_id" text NOT NULL,
	"device_id" text NOT NULL,
	"sensor_id" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sensor_alert" ADD CONSTRAINT "sensor_alert_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "sensor_alert" ADD CONSTRAINT "sensor_alert_device_id_device_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."device"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "sensor_alert" ADD CONSTRAINT "sensor_alert_sensor_id_sensor_id_fk" FOREIGN KEY ("sensor_id") REFERENCES "public"."sensor"("id") ON DELETE cascade ON UPDATE cascade;