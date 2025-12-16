import { Logger } from 'winston'
import { AppDataSource } from '../data-source.js'
import { Location } from '../entities/location.js'
import * as fs from 'fs'
import { JSONValue } from '../types/json.js'
import { parse } from 'yaml'
import { TEMPERATURE_DATA_FILE_PATH } from '../paths.js'
import { z } from 'zod/v4'
import { MonthlyTemperatureRange } from '../entities/monthly-temperature-range.js'


// - month: 1
//   temperatureRange:
//     min: [5.2, "C"]
//     max: [8.3, "C"]

const TemperatureTuple = z.tuple([z.number(), z.union([z.literal('C'), z.literal('F')])])

const LocationFileData = z.object({
	locations: z.array(
		z.object({
			name: z.string(),
			region: z.string(),
			country: z.string(),
			monthlyTemperatures: z.array(
				z.object({
					month: z.number(),
					temperatureRange: z.object({
						min: TemperatureTuple,
						max: TemperatureTuple,
					}),
				})
			),
		})
	).describe('Locations with their monthly temperatures'),
})




export async function loadTemperatureData(logger: Logger) {
	if (!fs.existsSync(TEMPERATURE_DATA_FILE_PATH)) {
		logger.error(`Temperature data file not found at ${TEMPERATURE_DATA_FILE_PATH}`)
		return
	}

	try {
		const dataString = fs.readFileSync(TEMPERATURE_DATA_FILE_PATH, 'utf8')
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const parsedData = parse(dataString) as JSONValue


		const fileData = LocationFileData.parse(parsedData)


		const locRepo = AppDataSource.getRepository(Location)
		const mtRepo = AppDataSource.getRepository(MonthlyTemperatureRange)
		const locations: Location[] = []

		for (let i = 0; i < fileData.locations.length; i++) {
			const locData = fileData.locations[i]
			if (!locData) continue
			const l = locRepo.create({
				name: locData.name,
				region: locData.region,
				country: locData.country,
			})

			const loc = await locRepo.save(l)
			locations.push(loc)
			for (let monthData of locData.monthlyTemperatures) {
				const [minValue, minUnit] = monthData.temperatureRange.min
				const [maxValue, maxUnit] = monthData.temperatureRange.max

				const locMt = mtRepo.create({
					location: loc,
					month: monthData.month,
					min: {
						value: minValue,
						unit: minUnit,
					},
					max: {
						value: maxValue,
						unit: maxUnit,
					},
				} as unknown as MonthlyTemperatureRange)
				const mt = await mtRepo.save(locMt)
			}
		}

		return locations
	} catch (error) {
		logger.error('Failed to validate temperature data', { error })
		throw new Error('Invalid temperature data format', { cause: error })
	}
}

export class LocationService {
	private locationRepository = AppDataSource.getRepository(Location)

	async getLocation(id: string): Promise<Location> {
		const location = await this.locationRepository.findOne({
			where: { id: `loc_${id}` },
			relations: ['monthlyTemperatures'],
		})
		if (!location) {
			throw new Error(`Location with id ${id} not found`)
		}
		return location
	}

	async getAllLocations(): Promise<Location[]> {
		return this.locationRepository.find({
			relations: ['monthlyTemperatures'],
		})
	}

	async calculateDate(
		locationId: string,
		temperature: { value: number; unit: 'C' | 'F' },
	): Promise<Date> {
		const location = await this.locationRepository.findOne({
			where: { id: locationId as `loc_${string}` },
			relations: ['monthlyTemperatures'],
		})
		if (!location) {
			throw new Error(`Location with id ${locationId} not found`)
		}

		// Convert target temperature to Celsius for consistent comparison
		const targetTempC = temperature.unit === 'F'
			? (temperature.value - 32) * (5 / 9)
			: temperature.value

		// Sort monthly temperatures by month to ensure proper order
		const sortedTemperatures = [...location.monthlyTemperatures].sort((a, b) => a.month - b.month)

		const currentYear = new Date().getFullYear()
		const currentMonth = new Date().getMonth() + 1 // JavaScript months are 0-indexed

		// Helper to convert temperature to Celsius
		const toCelsius = (temp: { value: number; unit: 'C' | 'F' }): number => {
			return temp.unit === 'F' ? (temp.value - 32) * (5 / 9) : temp.value
		}

		// Find the first month where the average temperature reaches or exceeds the target
		for (const mt of sortedTemperatures) {
			const minTempC = toCelsius(mt.min)
			const maxTempC = toCelsius(mt.max)
			const avgTempC = (minTempC + maxTempC) / 2

			// Check if this month's average temperature meets or exceeds target
			if (avgTempC >= targetTempC) {
				// If this month is in the past this year, use next year
				const year = mt.month < currentMonth ? currentYear + 1 : currentYear

				// Interpolate day within the month based on how the temperature progresses
				// Assume linear temperature progression through the month
				let dayOfMonth = 1

				if (mt.month > 1) {
					const prevMonth = sortedTemperatures.find(t => t.month === mt.month - 1)
					if (prevMonth) {
						const prevAvgTempC = (toCelsius(prevMonth.min) + toCelsius(prevMonth.max)) / 2

						// If previous month was cooler, interpolate when target is reached
						if (prevAvgTempC < targetTempC && avgTempC >= targetTempC) {
							const tempRange = avgTempC - prevAvgTempC
							const tempOffset = targetTempC - prevAvgTempC
							const fraction = tempOffset / tempRange
							dayOfMonth = Math.max(1, Math.min(28, Math.round(fraction * 28)))
						}
					}
				}

				return new Date(year, mt.month - 1, dayOfMonth) // JavaScript months are 0-indexed
			}
		}

		// If no month reaches the target temperature, return the warmest month
		const warmestMonth = sortedTemperatures.reduce((warmest, current) => {
			const warmestAvg = (toCelsius(warmest.min) + toCelsius(warmest.max)) / 2
			const currentAvg = (toCelsius(current.min) + toCelsius(current.max)) / 2
			return currentAvg > warmestAvg ? current : warmest
		})

		const year = warmestMonth.month < currentMonth ? currentYear + 1 : currentYear
		return new Date(year, warmestMonth.month - 1, 15) // Mid-month of warmest month
	}
}
