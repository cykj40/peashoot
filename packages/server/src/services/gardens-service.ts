import { Garden } from '../entities/garden.js'
import { AppDataSource } from '../data-source.js'
import { isIdWithPrefix } from '../utils/id.js'
import { InvalidArgsError } from '../application/errors/invalid-args-error.js'
import { Logger } from 'winston'
import { DeepPartial } from 'typeorm'
import { Bed } from '../entities/bed.js'
import { Plant } from '../entities/plant.js'
import { SeedPacket } from '../entities/seed-packet.js'
import { PlantsService } from './plants-service.js'

export class GardensService {
	async getAllGardens(): Promise<Garden[]> {
		return await AppDataSource.manager.find(Garden, {
			relations: {
				beds: true,
			}
		})
	}
	async getGardenById(id: string): Promise<Garden | null> {
		if (!isIdWithPrefix('grdn', id)) {
			throw new InvalidArgsError('Invalid garden id')
		}
		return await AppDataSource.manager.findOne(Garden, { where: { id } })
	}

	async createExampleGarden(logger: Logger) {
		const gardenRepo = AppDataSource.getRepository(Garden)
		const bedRepo = AppDataSource.getRepository(Bed)
		const plantRepo = AppDataSource.getRepository(Plant)
		const seedPacketRepo = AppDataSource.getRepository(SeedPacket)
		const plantsService = new PlantsService()

		let garden = gardenRepo.create({
			name: 'My Garden',
			description: 'My garden',
		} satisfies DeepPartial<Garden>)
		garden = await gardenRepo.save(garden)

		let bed = bedRepo.create({
			garden: garden,
			width: 6,
			height: 6,
		} satisfies DeepPartial<Bed>)
		bed = await bedRepo.save(bed)

		const seedPackets = await seedPacketRepo.find({
			take: 100, // Get first 100 seed packets
		})

		logger.info(`Found ${seedPackets.length} packets`)

		// Create plants from seed packets
		for (const seedPacket of seedPackets) {
			const plant = plantsService.generatePlantFromSeedPacket(plantRepo, seedPacket)
			plant.bed = bed
			plant.position = {
				x: 0,
				y: 0,
			}
			await plantRepo.save(plant)
		}

		logger.info(`${seedPackets.length} plants saved`)
		logger.info('Garden saved', { garden: garden.name, id: garden.id })
	}
}
