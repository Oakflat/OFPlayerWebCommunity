import { createIndexedDbDataService } from './indexedDbDataService'
import { createLocalDataService } from './localDataService'
import { createMetadataService } from '../metadataService'

export function createDataService(options = {}) {
  const driver = options.driver ?? 'indexeddb'
  const metadataService = options.metadataService ?? createMetadataService()

  switch (driver) {
    case 'local':
      return createLocalDataService({
        ...options,
        metadataService,
      })
    case 'indexeddb':
    default:
      return createIndexedDbDataService({
        ...options,
        metadataService,
        fallback:
          options.fallback ??
          createLocalDataService({
            ...options,
            metadataService,
          }),
      })
  }
}
