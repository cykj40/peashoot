import 'reflect-metadata' // This must be the first import
import * as rimraf from 'rimraf'
import { initApp } from './application/app.js'
import { createLogger } from './logger.js'
import { initializeNewDbWithData } from './seed-db.js'
import { Logger } from 'winston'
import { DATABASE_PATH } from './paths.js'
import * as fs from 'fs'

const PORT = process.env.port ?? 3000
const logger = createLogger({ level: 'debug' })

async function main(logger: Logger) {
	// Only delete database if explicitly requested via env var, not on every hot reload
	if (process.env.RESET_DB === 'true' || !fs.existsSync(DATABASE_PATH)) {
		try {
			rimraf.sync(DATABASE_PATH)
		} catch (error) {
			logger.warn('Could not delete database file (may be locked), will try to reinitialize', { error })
		}
	}
	await initializeNewDbWithData(logger)
	const app = initApp(logger)
	app.listen(PORT, () => {
		logger.info(`Server is running on port ${PORT}`)
	})
}

main(logger).catch(console.error)
