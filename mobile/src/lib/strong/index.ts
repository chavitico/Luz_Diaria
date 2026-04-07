// Strong's Concordance — barrel export
//
// Import order reflects the dependency chain:
//   types → mockData (raw data) → repository (abstraction) → service (public API)
//
// External code should import from:
//   - './types'      for type definitions
//   - './service'    for data-access functions
//   - './repository' if it needs to swap/extend the data source
//
// Do NOT import from './mockData' outside this module.
export * from './types';
export * from './repository';
export * from './service';
