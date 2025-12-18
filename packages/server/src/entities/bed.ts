import { Column, Entity } from 'typeorm'
import { PeashootEntity } from './peashoot-entity.js'
import { Garden } from './garden.js'

@Entity({ name: 'garden_bed' })
export class Bed extends PeashootEntity<'bed'> {
    constructor() {
        super('bed')
    }

    @ManyToOne(() => Garden, (g) => g.beds)
    garden!: Garden

    @Column()
    width!: number

    @Column()
    height!: number
}

