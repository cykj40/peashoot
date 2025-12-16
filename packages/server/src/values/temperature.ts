import { Column, Entity } from 'typeorm'
import { PeashootEntity } from '../entities/peashoot-entity.js'
import { Temperature as ITemperature, TemperatureUnit } from '@peashoot/types'



@Entity()
export class Temperature extends PeashootEntity<'tmp'> {
    constructor() {
        super('tmp')
    }

    @Column('real')
    value!: number

    @Column('varchar')
    unit!: TemperatureUnit
}