/**
 * JSDoc Global Type Definitions for Tuk-Tuk
 * Provides rich autocomplete and type checking without forcing TypeScript migration.
 */

/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} name
 * @property {string} [phone]
 * @property {string} [avatar]
 * @property {number} [level]
 * @property {boolean} [isVip]
 * @property {number} [diamonds]
 */

/**
 * @typedef {Object} Room
 * @property {string} id
 * @property {string} title
 * @property {string} hostId
 * @property {string} hostName
 * @property {string} [avatar]
 * @property {number} [memberCount]
 */

/**
 * @typedef {Object} SeatItem
 * @property {number} index
 * @property {string|null} userId
 * @property {string|null} userName
 * @property {string|null} userAvatar
 * @property {boolean} isMuted
 * @property {boolean} isLocked
 * @property {boolean} isHost
 */

export default {};
