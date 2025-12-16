import { z } from 'zod/v4'
import { MonthlyTemperatureRangeSchema } from './monthly-temprature-range.type.js'

export const LocationSchema = z
	.object({
		id: z.string(),
		name: z.string(),
		region: z.string(),
		country: z.string(),
		monthlyTemperatures: z.array(MonthlyTemperatureRangeSchema),
		createdAt: z.string().or(z.date()).optional(),
		updatedAt: z.string().or(z.date()).optional(),
	})
	.passthrough()

export type Location = z.infer<typeof LocationSchema>
