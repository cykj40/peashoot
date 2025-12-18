import { Column, Entity, ManyToOne, OneToMany } from 'typeorm'
import { PeashootEntity } from './peashoot-entity.js'
import { Garden } from './garden.js'
import { Plant } from './plant.js'

@Entity({ name: 'garden_bed' })
export class Bed extends PeashootEntity<'bed'> {
    constructor() {
        super('bed')
    }

    @ManyToOne(() => Garden, (g) => g.beds)
    garden!: Garden

    @OneToMany(() => Plant, (plant) => plant.bed)
    plants!: Plant[]

    @Column('real')
    width!: number

    @Column('real')
    height!: number
}

