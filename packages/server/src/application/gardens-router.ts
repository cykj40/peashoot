import { Router } from 'express'
import { GardensService } from '../services/gardens-service.js'
import { asyncHandler } from './middlewares/async-handler.js'
import { Logger } from 'winston'
import {
	ListWorkspacesResponse,
	Zone,
	ItemPlacement,
	Item,
	PlantMetadata,
} from '@peashoot/types'
import { convertDistanceToFeet } from '@peashoot/types'

export function createGardenRouter(_logger: Logger): Router {
	const gardensService = new GardensService()
	const router = Router()

	router.get(
		'/',
		asyncHandler(async (_req, res, _next) => {
			const gardens = await gardensService.getAllGardens()
			const response = gardens.map((garden) => ({
				id: garden.id,
				indicators: [],
				zones: (garden.beds || []).map((bed): Zone => {
					const placements: ItemPlacement[] = (bed.plants || [])
						.filter(
							(plant) =>
								plant.position &&
								plant.presentation &&
								plant.plantingDistance,
						)
						.map((plant) => ({
							id: plant.id,
							position: {
								x: plant.position.x,
								y: plant.position.y,
							},
							sourceZoneId: bed.id,
							item: {
								id: plant.id,
								category: plant.family,
								variant: plant.variant,
								displayName: plant.name,
								size: 1,
								presentation: {
									iconPath: plant.presentation.iconPath,
									accentColor: plant.presentation.accentColor,
								},
								metadata: {
									plantingDistance: plant.plantingDistance,
									plantingDistanceInFeet:
										convertDistanceToFeet(plant.plantingDistance).value,
								},
							} satisfies Item,
						}))

					return {
						id: bed.id,
						name: bed.name,
						description: bed.description,
						width: bed.width,
						height: bed.height,
						waterLevel: 5,
						sunLevel: 5,
						placements,
						metadata: {},
					} as Zone
				}),
				metadata: {},
			})) as ListWorkspacesResponse
			res.json(response)
		}),
	)
	return router
}
