import { Column, Entity, ManyToOne } from 'typeorm'
import { MonthlyTemperatureRange as IMonthlyTemperatureRange, Temperature } from '@peashoot/types'
import { PeashootEntity } from './peashoot-entity.js'
import { Location } from './location.js'

@Entity()
export class MonthlyTemperatureRange extends PeashootEntity<'mtr'> {
    constructor() {
        super('mtr')
    }


    @Column('integer')
    month!: number

    @ManyToOne(() => Location, (location) => location.monthlyTemperatures)
    location!: Location


    @Column('json')
    min!: Temperature

    @Column('json')
    max!: Temperature
}