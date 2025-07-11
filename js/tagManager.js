import * as dataStorage from './dataStorage.js';
import * as uiManager from './uiManager.js';

let DOM = {}; // Will store references to DOM elements

/**
 * Initializes the TagManager with DOM elements.
 * @param {Object} domElements - An object containing references to DOM elements.
 */
export function init(domElements) {
    DOM = domElements;
}

/**
 * Adds a new location/trigger tag.
 */
export async function addLocationTriggerTag() {
    const newTag = DOM.newLocationTriggerTagInput.value.trim();
    if (newTag) {
        const locationTriggers = dataStorage.getLocationTriggers();
        if (!locationTriggers.includes(newTag)) {
            dataStorage.updateLocationTriggers([...locationTriggers, newTag]);
            DOM.newLocationTriggerTagInput.value = '';
            dataStorage.saveData();
            uiManager.updateUI();
        } else {
            await uiManager.showAlert('Tag Exists', 'This location/trigger tag already exists!');
        }
    }
}

/**
 * Deletes a location/trigger tag.
 * @param {string} tagToDelete - The tag to delete.
 */
export async function deleteLocationTriggerTag(tagToDelete) {
    const confirmed = await uiManager.showAlert('Confirm Deletion', `Are you sure you want to delete "${tagToDelete}"? This cannot be undone.`, true);
    if (confirmed) {
        let locationTriggers = dataStorage.getLocationTriggers();
        locationTriggers = locationTriggers.filter(tag => tag !== tagToDelete);
        dataStorage.updateLocationTriggers(locationTriggers);
        dataStorage.saveData();
        uiManager.updateUI();
    }
}

/**
 * Adds a new mitigation/relief tag.
 */
export async function addMitigationReliefTag() {
    const newTag = DOM.newMitigationReliefTagInput.value.trim();
    if (newTag) {
        const mitigations = dataStorage.getMitigations();
        if (!mitigations.includes(newTag)) {
            dataStorage.updateMitigations([...mitigations, newTag]);
            DOM.newMitigationReliefTagInput.value = '';
            dataStorage.saveData();
            uiManager.updateUI();
        } else {
            await uiManager.showAlert('Tag Exists', 'This mitigation/relief tag already exists!');
        }
    }
}

/**
 * Deletes a mitigation/relief tag.
 * @param {string} tagToDelete - The tag to delete.
 */
export async function deleteMitigationReliefTag(tagToDelete) {
    const confirmed = await uiManager.showAlert('Confirm Deletion', `Are you sure you want to delete "${tagToDelete}"? This cannot be undone.`, true);
    if (confirmed) {
        let mitigations = dataStorage.getMitigations();
        mitigations = mitigations.filter(tag => tag !== tagToDelete);
        dataStorage.updateMitigations(mitigations);
        dataStorage.saveData();
        uiManager.updateUI();
    }
}
