import { Column, Entity, OneToMany } from 'typeorm'
import { PeashootEntity } from './peashoot-entity.js'
import { Bed } from './bed.js'

@Entity({ name: 'garden' })
export class Garden extends PeashootEntity<'grdn'> {
	constructor() {
		super('grdn')
	}

	@Column('varchar', { length: 255 })
	name!: string

	@Column('varchar', { length: 255 })
	description!: string

	@OneToMany(() => Bed, (b) => b.garden)
	beds!: Bed[]
}
