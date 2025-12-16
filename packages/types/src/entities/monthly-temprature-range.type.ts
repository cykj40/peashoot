import { z } from 'zod/v4'
import { TemperatureSchema, TemperatureUnitSchema } from '../value-objects/temprature.type.js'


/**
 * {
 * id: "1234567890",
 * month: 4,
 * min: { value: 34, unit: 'F'  },
 * max: { value: 45, unit: 'F'  },
 * }
 */

export const MonthlyTemperatureRangeSchema = z.object({
    id: z.string(),
    month: z.int().min(1).max(12),
    min: TemperatureSchema,
    max: TemperatureSchema,
})

export type MonthlyTemperatureRange = z.infer<typeof MonthlyTemperatureRangeSchema>