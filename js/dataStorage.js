const STORAGE_KEY_ATTACKS = 'mentalHealthTracker_attacks';
const STORAGE_KEY_LOCATION_TRIGGERS = 'mentalHealthTracker_locationTriggers';
const STORAGE_KEY_MITIGATIONS = 'mentalHealthTracker_mitigations';

let attacks = [];
let locationTriggers = ['alone', 'phone call', 'driving', 'work', 'social gathering'];
let mitigations = ['drinking tea', 'going for a walk', 'playing a game', 'deep breathing', 'talking to a friend'];
let activeAttack = null;


/**
 * Loads all data from localStorage into module variables.
 */
export function loadData() {
    const storedAttacks = JSON.parse(localStorage.getItem(STORAGE_KEY_ATTACKS)) || [];
    activeAttack = storedAttacks.find(attack => attack.endTime === null) || null;

    // If an active attack was found, remove it from the historical attacks array
    // to prevent duplicates when it's eventually ended and pushed back.
    if (activeAttack) {
        attacks = storedAttacks.filter(attack => attack.id !== activeAttack.id);
    } else {
        attacks = storedAttacks;
    }

    locationTriggers = JSON.parse(localStorage.getItem(STORAGE_KEY_LOCATION_TRIGGERS)) || locationTriggers;
    mitigations = JSON.parse(localStorage.getItem(STORAGE_KEY_MITIGATIONS)) || mitigations;
}

/**
 * Saves all current data to localStorage.
 */
export function saveData() {
    // Combine active attack with historical attacks for saving
    const allAttacksToSave = activeAttack ? [...attacks, activeAttack] : [...attacks];
    localStorage.setItem(STORAGE_KEY_ATTACKS, JSON.stringify(allAttacksToSave));
    localStorage.setItem(STORAGE_KEY_LOCATION_TRIGGERS, JSON.stringify(locationTriggers));
    localStorage.setItem(STORAGE_KEY_MITIGATIONS, JSON.stringify(mitigations));
}

/**
 * Returns the current array of historical attacks.
 * @returns {Array} An array of attack objects.
 */
export function getAttacks() {
    return attacks;
}

/**
 * Returns the current array of location/trigger tags.
 * @returns {Array} An array of strings.
 */
export function getLocationTriggers() {
    return locationTriggers;
}

/**
 * Returns the current array of mitigation/relief tags.
 * @returns {Array} An array of strings.
 */
export function getMitigations() {
    return mitigations;
}

/**
 * Returns the currently active attack object.
 * @returns {Object|null} The active attack object or null if none.
 */
export function getActiveAttack() {
    return activeAttack;
}

/**
 * Sets the active attack object.
 * @param {Object|null} attack - The attack object to set as active, or null to clear.
 */
export function setActiveAttack(attack) {
    activeAttack = attack;
}

/**
 * Adds a new attack to the historical attacks array.
 * @param {Object} attack - The attack object to add.
 */
export function addAttack(attack) {
    attacks.push(attack);
}

/**
 * Updates the location/trigger tags array.
 * @param {string[]} newTags - The new array of tags.
 */
export function updateLocationTriggers(newTags) {
    locationTriggers = newTags;
}

/**
 * Updates the mitigation/relief tags array.
 * @param {string[]} newTags - The new array of tags.
 */
export function updateMitigations(newTags) {
    mitigations = newTags;
}

/**
 * Updates the current severity of the active attack.
 * @param {number} severity - The new severity level.
 */
export function updateActiveAttackSeverity(severity) {
    if (activeAttack) {
        activeAttack.currentSeverity = severity;
    }
}

/**
 * Adds a mitigation attempt to the active attack.
 * @param {Object} attempt - The mitigation attempt object.
 */
export function addMitigationAttempt(attempt) {
    if (activeAttack) {
        activeAttack.mitigationAttempts.push(attempt);
    }
}
