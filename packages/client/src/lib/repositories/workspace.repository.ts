import { Repository } from './repository.base'
import { WorkspaceSchema, type Item, type Workspace } from '@peashoot/types'
import { get } from 'svelte/store'

/**
 * Repository for Garden domain entities
 * Handles data access and persistence for Garden/Workspace entities
 */
export class WorkspaceRepository extends Repository<Workspace, string> {
	// Local cache for optimistic updates
	private workspaceCache: Map<string, Workspace> = new Map()

	constructor() {
		super('http://localhost:3000/api')
	}

	protected getEndpoint(): string {
		return 'workspaces'
	}

	protected toDomainEntity(resource: unknown): Workspace {
		return WorkspaceSchema.parse(resource)
	}

	// Override findAll to populate cache
	override async findAll(): Promise<Workspace[]> {
		const workspaces = await super.findAll()
		// Populate cache
		workspaces.forEach((ws) => this.workspaceCache.set(ws.id, ws))
		return workspaces
	}

	// Override findById to use cache
	override async findById(id: string): Promise<Workspace | null> {
		if (this.workspaceCache.has(id)) {
			return this.workspaceCache.get(id) || null
		}
		const workspace = await super.findById(id)
		if (workspace) {
			this.workspaceCache.set(id, workspace)
		}
		return workspace
	}

	/**
	 * Generate a unique placement ID
	 */
	private generatePlacementId(): string {
		return `placement_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
	}

	/**
	 * Add an item to a workspace zone (local update)
	 */
	async addItemToWorkspace(
		gardenId: string,
		zoneId: string,
		plant: Item,
		x: number,
		y: number,
	): Promise<Workspace> {
		console.log('addItemToWorkspace called with:', {
			gardenId,
			zoneId,
			plant,
			x,
			y,
		})

		// Get current workspace from cache
		let workspace: Workspace | undefined = this.workspaceCache.get(gardenId)
		if (!workspace) {
			const fetched = await this.findById(gardenId)
			if (!fetched) {
				throw new Error(`Workspace ${gardenId} not found`)
			}
			workspace = fetched
		}

		// Find the zone
		const zoneIndex = workspace.zones.findIndex((z) => z.id === zoneId)
		if (zoneIndex === -1) {
			throw new Error(`Zone ${zoneId} not found in workspace ${gardenId}`)
		}

		// Create new placement
		const newPlacement = {
			id: this.generatePlacementId(),
			position: { x, y },
			sourceZoneId: zoneId,
			item: plant,
		}

		// Create updated workspace with new placement
		const updatedWorkspace: Workspace = {
			...workspace,
			zones: workspace.zones.map((zone, idx) => {
				if (idx === zoneIndex) {
					return {
						...zone,
						placements: [...zone.placements, newPlacement],
					}
				}
				return zone
			}),
		}

		// Update cache
		this.workspaceCache.set(gardenId, updatedWorkspace)

		console.log('Item added successfully, new workspace:', updatedWorkspace)
		return updatedWorkspace
	}

	/**
	 * Move a plant within a zone (local update)
	 */
	async moveItemWithinZone(
		gardenId: string,
		zoneId: string,
		plantId: string,
		x: number,
		y: number,
	): Promise<Workspace> {
		console.log('moveItemWithinZone called with:', {
			gardenId,
			zoneId,
			plantId,
			x,
			y,
		})

		// Get current workspace from cache
		let workspace: Workspace | undefined = this.workspaceCache.get(gardenId)
		if (!workspace) {
			const fetched = await this.findById(gardenId)
			if (!fetched) {
				throw new Error(`Workspace ${gardenId} not found`)
			}
			workspace = fetched
		}

		// Find the zone and update placement position
		const updatedWorkspace: Workspace = {
			...workspace,
			zones: workspace.zones.map((zone) => {
				if (zone.id === zoneId) {
					return {
						...zone,
						placements: zone.placements.map((p) => {
							if (p.id === plantId) {
								return {
									...p,
									position: { x, y },
								}
							}
							return p
						}),
					}
				}
				return zone
			}),
		}

		// Update cache
		this.workspaceCache.set(gardenId, updatedWorkspace)

		console.log('Item moved within zone successfully')
		return updatedWorkspace
	}

	/**
	 * Move a plant between zones (local update)
	 */
	async moveItemBetweenZones(
		gardenId: string,
		sourceZoneId: string,
		targetZoneId: string,
		plantId: string,
		x: number,
		y: number,
	): Promise<Workspace> {
		console.log('moveItemBetweenZones called with:', {
			gardenId,
			sourceZoneId,
			targetZoneId,
			plantId,
			x,
			y,
		})

		// Get current workspace from cache
		let workspace: Workspace | undefined = this.workspaceCache.get(gardenId)
		if (!workspace) {
			const fetched = await this.findById(gardenId)
			if (!fetched) {
				throw new Error(`Workspace ${gardenId} not found`)
			}
			workspace = fetched
		}

		// Find the source zone and get the placement
		const sourceZone = workspace.zones.find((z) => z.id === sourceZoneId)
		if (!sourceZone) {
			throw new Error(`Source zone ${sourceZoneId} not found`)
		}

		const placement = sourceZone.placements.find((p) => p.id === plantId)
		if (!placement) {
			throw new Error(`Placement ${plantId} not found in zone ${sourceZoneId}`)
		}

		// Create updated placement with new position and zone
		const updatedPlacement = {
			...placement,
			position: { x, y },
			sourceZoneId: targetZoneId,
		}

		// Update workspace
		const updatedWorkspace: Workspace = {
			...workspace,
			zones: workspace.zones.map((zone) => {
				if (zone.id === sourceZoneId) {
					// Remove from source zone
					return {
						...zone,
						placements: zone.placements.filter((p) => p.id !== plantId),
					}
				}
				if (zone.id === targetZoneId) {
					// Add to target zone
					return {
						...zone,
						placements: [...zone.placements, updatedPlacement],
					}
				}
				return zone
			}),
		}

		// Update cache
		this.workspaceCache.set(gardenId, updatedWorkspace)

		console.log('Item moved between zones successfully')
		return updatedWorkspace
	}

	/**
	 * Remove a plant from a zone (local update)
	 */
	async removeItemFromZone(
		gardenId: string,
		zoneId: string,
		plantId: string,
	): Promise<Workspace> {
		console.log('removeItemFromZone called with:', {
			gardenId,
			zoneId,
			plantId,
		})

		// Get current workspace from cache
		let workspace: Workspace | undefined = this.workspaceCache.get(gardenId)
		if (!workspace) {
			const fetched = await this.findById(gardenId)
			if (!fetched) {
				throw new Error(`Workspace ${gardenId} not found`)
			}
			workspace = fetched
		}

		// Remove placement from zone
		const updatedWorkspace: Workspace = {
			...workspace,
			zones: workspace.zones.map((zone) => {
				if (zone.id === zoneId) {
					return {
						...zone,
						placements: zone.placements.filter((p) => p.id !== plantId),
					}
				}
				return zone
			}),
		}

		// Update cache
		this.workspaceCache.set(gardenId, updatedWorkspace)

		console.log('Item removed from zone successfully')
		return updatedWorkspace
	}

	/**
	 * Clone/duplicate a plant (local update)
	 */
	async cloneItem(
		gardenId: string,
		sourceZoneId: string,
		targetZoneId: string,
		sourcePlantId: string,
		x: number,
		y: number,
	): Promise<Workspace> {
		console.log('cloneItem called with:', {
			gardenId,
			sourceZoneId,
			targetZoneId,
			sourcePlantId,
			x,
			y,
		})

		// Get current workspace from cache
		let workspace: Workspace | undefined = this.workspaceCache.get(gardenId)
		if (!workspace) {
			const fetched = await this.findById(gardenId)
			if (!fetched) {
				throw new Error(`Workspace ${gardenId} not found`)
			}
			workspace = fetched
		}

		// Find the source zone and get the placement
		const sourceZone = workspace.zones.find((z) => z.id === sourceZoneId)
		if (!sourceZone) {
			throw new Error(`Source zone ${sourceZoneId} not found`)
		}

		const placement = sourceZone.placements.find((p) => p.id === sourcePlantId)
		if (!placement) {
			throw new Error(`Placement ${sourcePlantId} not found in zone ${sourceZoneId}`)
		}

		// Create cloned placement with new ID and position
		const clonedPlacement = {
			...placement,
			id: this.generatePlacementId(),
			position: { x, y },
			sourceZoneId: targetZoneId,
		}

		// Update workspace
		const updatedWorkspace: Workspace = {
			...workspace,
			zones: workspace.zones.map((zone) => {
				if (zone.id === targetZoneId) {
					return {
						...zone,
						placements: [...zone.placements, clonedPlacement],
					}
				}
				return zone
			}),
		}

		// Update cache
		this.workspaceCache.set(gardenId, updatedWorkspace)

		console.log('Item cloned successfully')
		return updatedWorkspace
	}
}
