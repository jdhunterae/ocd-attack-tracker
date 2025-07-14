import * as dataStorage from './dataStorage.js';
import * as uiManager from './uiManager.js';
import * as modalManager from './modalManager.js';
import * as tagManager from './tagManager.js';
import * as visualizationManager from './visualizationManager.js';

let DOM = {}; // Will store references to DOM elements
let selectedStartTags = []; // Temporary state for start attack modal
let selectedMitigationTags = []; // Temporary state for add mitigation modal

/**
 * Initializes the AttackManager with DOM elements.
 * @param {Object} domElements - An object containing references to DOM elements.
 */
export function init(domElements) {
    DOM = domElements;

    // Attach event listeners for modal confirmation buttons
    DOM.confirmStartAttackBtn.addEventListener('click', confirmStartAttack);
    DOM.confirmAddMitigationBtn.addEventListener('click', confirmAddMitigation);
}

/**
 * Handles starting a new attack.
 */
export function handleStartAttack() {
    selectedStartTags = []; // Reset selected tags for new attack

    // Populate modal with current date/time and tags
    DOM.startDatetimeInput.value = new Date().toISOString().slice(0, 16);
    DOM.initialSeverityInput.value = 5;
    uiManager.renderSelectableTags(DOM.startAttackTagSelection, dataStorage.getLocationTriggers(), selectedStartTags, toggleStartTagSelection);
    modalManager.openModal('start-attack-modal');
}

/**
 * Toggles the selection of a tag in the start attack modal.
 * @param {string} tag - The tag to toggle.
 */
function toggleStartTagSelection(tag) {
    if (selectedStartTags.includes(tag)) {
        selectedStartTags = selectedStartTags.filter(t => t !== tag);
    } else {
        selectedStartTags.push(tag);
    }

    uiManager.renderSelectableTags(DOM.startAttackTagSelection, dataStorage.getLocationTriggers(), selectedStartTags, toggleStartTagSelection);
}

/**
 * Confirms and creates a new attack.
 */
async function confirmStartAttack() {
    const startTime = new Date(DOM.startDatetimeInput.value).getTime();
    const initialSeverity = parseInt(DOM.initialSeverityInput.value);

    if (isNaN(startTime) || !initialSeverity || initialSeverity < 1 || initialSeverity > 10) {
        await uiManager.showAlert('Invalid Input', 'Please provide a valid start date/time and severity (1-10).');
        return;
    }

    const newAttack = {
        id: Date.now(), // Unique ID for the attack
        startTime: startTime,
        endTime: null,
        initialSeverity: initialSeverity,
        currentSeverity: initialSeverity,
        locationTriggers: [...selectedStartTags], // Clone the array
        mitigationAttempts: []
    };

    dataStorage.setActiveAttack(newAttack);
    dataStorage.saveData();
    uiManager.updateUI();
    modalManager.closeModal('start-attack-modal');
}

/**
 * Handles adding a mitigation attempt to the active attack.
 */
export async function handleAddMitigation() {
    const activeAttack = dataStorage.getActiveAttack();
    if (!activeAttack) {
        await uiManager.showAlert('No Active Attack', 'Please start an attack first before adding mitigations.');
        return;
    }

    selectedMitigationTags = []; // Reset selected tags for new mitigation

    // Populate modal with current date/time and tags
    DOM.mitigationDatetimeInput.value = new Date().toISOString().slice(0, 16);
    DOM.mitigationSeverityInput.value = activeAttack.currentSeverity; // Default to current severity
    uiManager.renderSelectableTags(DOM.addMitigationTagSelection, dataStorage.getMitigations(), selectedMitigationTags, toggleMitigationTagSelection);
    modalManager.openModal('add-mitigation-modal');
}

/**
 * Toggles the selection of a tag in the add mitigation modal.
 * @param {string} tag - The tag to toggle.
 */
function toggleMitigationTagSelection(tag) {
    if (selectedMitigationTags.includes(tag)) {
        selectedMitigationTags = selectedMitigationTags.filter(t => t !== tag);
    } else {
        selectedMitigationTags.push(tag);
    }

    uiManager.renderSelectableTags(DOM.addMitigationTagSelection, dataStorage.getMitigations(), selectedMitigationTags, toggleMitigationTagSelection);
}

/**
 * Confirms and adds a mitigation attempt.
 */
async function confirmAddMitigation() {
    const activeAttack = dataStorage.getActiveAttack();
    if (!activeAttack) return; // Should not happen if modal is only opened when activeAttack exists

    const timestamp = new Date(DOM.mitigationDatetimeInput.value).getTime();
    const newSeverity = parseInt(DOM.mitigationSeverityInput.value);

    if (isNaN(timestamp) || !newSeverity || newSeverity < 1 || newSeverity > 10) {
        await uiManager.showAlert('Invalid Input', 'Please provide a valid date/time and severity (1-10).');
        return;
    }

    const mitigationAttempt = {
        timestamp: timestamp,
        tags: [...selectedMitigationTags], // Clone the array
        severityAfter: newSeverity
    };

    dataStorage.addMitigationAttempt(mitigationAttempt);
    dataStorage.updateActiveAttackSeverity(newSeverity); // Update current severity
    dataStorage.saveData();
    uiManager.updateUI();
    modalManager.closeModal('add-mitigation-modal');
}

/**
 * Handles ending the active attack.
 */
export async function handleEndAttack() {
    const activeAttack = dataStorage.getActiveAttack();
    if (!activeAttack) return;

    const confirmed = await uiManager.showAlert('Confirm End Attack', 'Are you sure you want to end this attack?', true);
    if (confirmed) {
        activeAttack.endTime = Date.now();
        dataStorage.addAttack(activeAttack); // Add to historical attacks
        dataStorage.setActiveAttack(null); // Clear active attack
        dataStorage.saveData();
        uiManager.updateUI();
        visualizationManager.renderVisualizations(); // Re-render visualizations as data has changed
    }
}

/**
 * Requests deletion of a location/trigger tag. Called from uiManager.
 * This acts as a bridge to prevent direct circular dependency between uiManager and tagManager.
 * @param {string} tag - The tag to delete.
 */
export function requestDeleteLocationTriggerTag(tag) {
    tagManager.deleteLocationTriggerTag(tag);
}

/**
 * Requests deletion of a mitigation/relief tag. Called from uiManager.
 * @param {string} tag - The tag to delete.
 */
export function requestDeleteMitigationReliefTag(tag) {
    tagManager.deleteMitigationReliefTag(tag);
}
