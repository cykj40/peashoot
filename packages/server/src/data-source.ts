import { DataSource } from 'typeorm'
import { Plant } from './entities/plant.js'
import { SeedPacket } from './entities/seed-packet.js'
import { Garden } from './entities/garden.js'
import { Bed } from './entities/bed.js'
import { RGBColor } from './values/rgb-color.js'
import { XYCoordinate } from './values/xy-coordinate.js'
import { Location } from './entities/location.js'
import { MonthlyTemperatureRange } from './entities/monthly-temperature-range.js'
import { Temperature } from './values/temperature.js'

export const AppDataSource = new DataSource({
	type: 'sqlite',
	database: 'peashoot.sqlite',
	synchronize: true, // For dev only; use migrations in prod
	logging: false,
	entities: [
		Plant,
		SeedPacket,
		Garden,
		Bed,
		Location,
		RGBColor,
		XYCoordinate,
		MonthlyTemperatureRange,
		Temperature
	],
	migrations: [],
	subscribers: [],
})
