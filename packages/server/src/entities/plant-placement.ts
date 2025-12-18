import { Column, Entity, ManyToOne } from 'typeorm'
import { PeashootEntity } from './peashoot-entity.js'
import { Bed } from './bed.js'
import { Plant } from './plant.js'
import { Garden } from './garden.js'


@Entity({ name: 'garden_bed' })
export class PlantPlacement extends PeashootEntity<'plant_placement'> {
    constructor() {
        super('plant_placement')
    }

    @ManyToOne(() => Plant, (g) => g.beds)
    plant!: Plant

}