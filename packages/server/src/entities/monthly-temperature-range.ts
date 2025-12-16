import { Column, Entity, ManyToOne, OneToMany } from 'typeorm'
import { MonthlyTemperatureRange as IMonthlyTemperatureRange, Temperature } from '@peashoot/types'
import { PeashootEntity } from './peashoot-entity.js'

@Entity()
export class MonthlyTemperatureRange extends PeashootEntity<'mtr'> implements IMonthlyTemperatureRange {
    constructor() {
        super('mtr')
    }

    @Column('integer')
    month!: number

    @ManyToOne(() => Location, (location) => location.monthlyTemps)
    location!: Location[]


    @Column(() => Temperature)
    min!: Temperature

    @Column(() => Temperature)
    max!: Temperature
}