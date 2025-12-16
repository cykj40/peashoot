import { z } from 'zod/v4'

export const TemperatureUnitSchema = z.union([
    z.literal('C'),
    z.literal('F'),
])

type TemperatureUnit = z.infer<typeof TemperatureUnitSchema>

/* { value: 44, unit: 'F' } */
export const TemperatureSchema = z.object({
    value: z.number(),
    unit: TemperatureUnitSchema,
})

type Temperature = z.infer<typeof TemperatureSchema>



