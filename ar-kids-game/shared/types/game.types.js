/**
 * Shared type definitions for the AR Kids Treasure Hunt game.
 * Used as JSDoc references across frontend and backend.
 */

/**
 * @typedef {Object} GameItem
 * @property {string} id
 * @property {string} model
 * @property {string} icon
 * @property {string} voiceKey
 * @property {string} color
 * @property {number} scale
 */

/**
 * @typedef {Object} LevelConfig
 * @property {number} level
 * @property {number} objectCount
 * @property {number} findsToAdvance
 * @property {number} spawnRadius
 * @property {number} floatSpeed
 * @property {number} rotationSpeed
 */

/**
 * @typedef {Object} GameConfigResponse
 * @property {number} difficulty
 * @property {string} language
 * @property {Record<string, GameItem>} items
 * @property {Object} levels
 * @property {Object} rewards
 */

export {};
