import { z } from 'zod/v4'
import { MonthlyTemperatureRangeSchema } from './monthly-temprature-range.type.js'

export const LocationSchema = z.object({
	id: z.string(),
	name: z.string(),
	region: z.string(),
	country: z.string(),
	monthlyTemperatures: z.array(MonthlyTemperatureRangeSchema),
})

export type Location = z.infer<typeof LocationSchema>
