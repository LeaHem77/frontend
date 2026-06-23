import { createId } from '@paralleldrive/cuid2'
import {
    relations,
    type InferInsertModel,
    type InferSelectModel,
} from 'drizzle-orm'
import {
    pgTable,
    real,
    text,
    timestamp,
} from 'drizzle-orm/pg-core'
import { sensor } from './sensor'
import { user } from './user'
import { device } from './device'

/**
 * Table
 */
export const sensorAlert = pgTable('sensor_alert', {
    id: text('id')
        .primaryKey()
        .notNull()
        .$defaultFn(() => createId()),
    operator:    text('operator').notNull(),    // "gt" | "lt" | "eq"
    threshold:   real('threshold').notNull(),
    email:       text('email').notNull(),
    createdAt:   timestamp('created_at').defaultNow().notNull(),
    updatedAt:   timestamp('updated_at').defaultNow().notNull(),
    lastNotifiedAt: timestamp('last_notified_at'),
    userId:      text('user_id')
        .notNull()
        .references(() => user.id, {
            onDelete: 'cascade',
            onUpdate: 'cascade',
        }),
    deviceId:    text('device_id')
        .notNull()
        .references(() => device.id, {
            onDelete: 'cascade',
            onUpdate: 'cascade',
        }),
    sensorId:    text('sensor_id')
        .notNull()
        .references(() => sensor.id, {
            onDelete: 'cascade',
            onUpdate: 'cascade',
        }),
})

/**
 * Relations
 */
export const sensorAlertRelations = relations(sensorAlert, ({ one }) => ({
    user: one(user, {
        fields: [sensorAlert.userId],
        references: [user.id],
    }),
    device: one(device, {
        fields: [sensorAlert.deviceId],
        references: [device.id],
    }),
    sensor: one(sensor, {
        fields: [sensorAlert.sensorId],
        references: [sensor.id],
    }),
}))

/**
 * Types
 */
export type SensorAlert = InferSelectModel<typeof sensorAlert>
export type InsertSensorAlert = InferInsertModel<typeof sensorAlert>