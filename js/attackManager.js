
import * as dataStorage from './dataStorage.js';
import * as uiManager from './uiManager.js';
import * as modalManager from './modalManager.js';
import * as tagManager from './tagManager.js';
import * as visualizationManager from './visualizationManager.js';

let DOM = {};
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

    // Initialize the new tag input and suggestion UI
    const startTagElements = {
        tagInput: DOM.startAttackTagInput,
        selectedTagsContainer: DOM.startAttackSelectedTags,
        suggestedTagsContainer: DOM.startAttackSuggestedTags
    };
    uiManager.renderTagInputWithSuggestions(
        startTagElements,
        dataStorage.getLocationTriggers(),
        selectedStartTags,
        toggleStartTagSelection,
        '', // Initial filter is empty
        'location' // Tag type for top suggestions
    );

    // Add event listener for input changes to filter suggestions
    DOM.startAttackTagInput.oninput = () => {
        uiManager.renderTagInputWithSuggestions(
            startTagElements,
            dataStorage.getLocationTriggers(),
            selectedStartTags,
            toggleStartTagSelection,
            DOM.startAttackTagInput.value,
            'location'
        );
    };

    modalManager.openModal('start-attack-modal');
}

/**
 * Toggles the selection of a tag in the start attack modal.
 * This is called by clicking on suggested tags or selected tags.
 * @param {string} tag - The tag to toggle.
 */
function toggleStartTagSelection(tag) {
    if (selectedStartTags.includes(tag)) {
        selectedStartTags = selectedStartTags.filter(t => t !== tag);
    } else {
        selectedStartTags.push(tag);
    }
    // Re-render the tag input UI to reflect changes
    const startTagElements = {
        tagInput: DOM.startAttackTagInput,
        selectedTagsContainer: DOM.startAttackSelectedTags,
        suggestedTagsContainer: DOM.startAttackSuggestedTags
    };
    uiManager.renderTagInputWithSuggestions(
        startTagElements,
        dataStorage.getLocationTriggers(),
        selectedStartTags,
        toggleStartTagSelection,
        DOM.startAttackTagInput.value,
        'location'
    );
}

/**
 * Handles adding a new location/trigger tag from the start attack modal's input.
 */
export async function handleAddNewStartTagFromModal() {
    const newTag = DOM.startAttackTagInput.value.trim();
    if (newTag) {
        const locationTriggers = dataStorage.getLocationTriggers();
        if (!locationTriggers.includes(newTag)) {
            dataStorage.updateLocationTriggers([...locationTriggers, newTag]);
            dataStorage.saveData(); // Save the new tag
            // Automatically select the newly added tag
            if (!selectedStartTags.includes(newTag)) {
                selectedStartTags.push(newTag);
            }
            DOM.startAttackTagInput.value = ''; // Clear input
            // Re-render the tag input UI
            const startTagElements = {
                tagInput: DOM.startAttackTagInput,
                selectedTagsContainer: DOM.startAttackSelectedTags,
                suggestedTagsContainer: DOM.startAttackSuggestedTags
            };
            uiManager.renderTagInputWithSuggestions(
                startTagElements,
                dataStorage.getLocationTriggers(),
                selectedStartTags,
                toggleStartTagSelection,
                '', // Clear filter after adding
                'location'
            );
            uiManager.updateUI(); // Update main UI for tag management section
        } else {
            // If tag exists, just select it if not already selected
            if (!selectedStartTags.includes(newTag)) {
                selectedStartTags.push(newTag);
                DOM.startAttackTagInput.value = ''; // Clear input
                const startTagElements = {
                    tagInput: DOM.startAttackTagInput,
                    selectedTagsContainer: DOM.startAttackSelectedTags,
                    suggestedTagsContainer: DOM.startAttackSuggestedTags
                };
                uiManager.renderTagInputWithSuggestions(
                    startTagElements,
                    dataStorage.getLocationTriggers(),
                    selectedStartTags,
                    toggleStartTagSelection,
                    '',
                    'location'
                );
            } else {
                await uiManager.showAlert('Tag Exists', 'This location/trigger tag is already selected!');
            }
        }
    }
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
    if (selectedStartTags.length === 0) {
        await uiManager.showAlert('No Tags Selected', 'Please select at least one location/trigger tag.');
        return;
    }

    const newAttack = {
        id: Date.now(),
        startTime: startTime,
        endTime: null,
        initialSeverity: initialSeverity,
        currentSeverity: initialSeverity,
        locationTriggers: [...selectedStartTags],
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

    // Initialize the new tag input and suggestion UI for mitigation
    const mitigationTagElements = {
        tagInput: DOM.addMitigationTagInput,
        selectedTagsContainer: DOM.addMitigationSelectedTags,
        suggestedTagsContainer: DOM.addMitigationSuggestedTags
    };
    uiManager.renderTagInputWithSuggestions(
        mitigationTagElements,
        dataStorage.getMitigations(),
        selectedMitigationTags,
        toggleMitigationTagSelection,
        '', // Initial filter is empty
        'mitigation' // Tag type for top suggestions
    );

    // Add event listener for input changes to filter suggestions
    DOM.addMitigationTagInput.oninput = () => {
        uiManager.renderTagInputWithSuggestions(
            mitigationTagElements,
            dataStorage.getMitigations(),
            selectedMitigationTags,
            toggleMitigationTagSelection,
            DOM.addMitigationTagInput.value,
            'mitigation'
        );
    };

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
    // Re-render the tag input UI to reflect changes
    const mitigationTagElements = {
        tagInput: DOM.addMitigationTagInput,
        selectedTagsContainer: DOM.addMitigationSelectedTags,
        suggestedTagsContainer: DOM.addMitigationSuggestedTags
    };
    uiManager.renderTagInputWithSuggestions(
        mitigationTagElements,
        dataStorage.getMitigations(),
        selectedMitigationTags,
        toggleMitigationTagSelection,
        DOM.addMitigationTagInput.value,
        'mitigation'
    );
}

/**
 * Handles adding a new mitigation tag from the add mitigation modal's input.
 */
export async function handleAddNewMitigationTagFromModal() {
    const newTag = DOM.addMitigationTagInput.value.trim();
    if (newTag) {
        const mitigations = dataStorage.getMitigations();
        if (!mitigations.includes(newTag)) {
            dataStorage.updateMitigations([...mitigations, newTag]);
            dataStorage.saveData(); // Save the new tag
            // Automatically select the newly added tag
            if (!selectedMitigationTags.includes(newTag)) {
                selectedMitigationTags.push(newTag);
            }
            DOM.addMitigationTagInput.value = ''; // Clear input
            // Re-render the tag input UI
            const mitigationTagElements = {
                tagInput: DOM.addMitigationTagInput,
                selectedTagsContainer: DOM.addMitigationSelectedTags,
                suggestedTagsContainer: DOM.addMitigationSuggestedTags
            };
            uiManager.renderTagInputWithSuggestions(
                mitigationTagElements,
                dataStorage.getMitigations(),
                selectedMitigationTags,
                toggleMitigationTagSelection,
                '', // Clear filter after adding
                'mitigation'
            );
            uiManager.updateUI(); // Update main UI for tag management section
        } else {
            // If tag exists, just select it if not already selected
            if (!selectedMitigationTags.includes(newTag)) {
                selectedMitigationTags.push(newTag);
                DOM.addMitigationTagInput.value = ''; // Clear input
                const mitigationTagElements = {
                    tagInput: DOM.addMitigationTagInput,
                    selectedTagsContainer: DOM.addMitigationSelectedTags,
                    suggestedTagsContainer: DOM.addMitigationSuggestedTags
                };
                uiManager.renderTagInputWithSuggestions(
                    mitigationTagElements,
                    dataStorage.getMitigations(),
                    selectedMitigationTags,
                    toggleMitigationTagSelection,
                    '',
                    'mitigation'
                );
            } else {
                await uiManager.showAlert('Tag Exists', 'This mitigation tag is already selected!');
            }
        }
    }
}

/**
 * Confirms and adds a mitigation attempt.
 */
async function confirmAddMitigation() {
    const activeAttack = dataStorage.getActiveAttack();
    if (!activeAttack) return;

    const timestamp = new Date(DOM.mitigationDatetimeInput.value).getTime();
    const newSeverity = parseInt(DOM.mitigationSeverityInput.value);

    if (isNaN(timestamp) || !newSeverity || newSeverity < 1 || newSeverity > 10) {
        await uiManager.showAlert('Invalid Input', 'Please provide a valid date/time and severity (1-10).');
        return;
    }
    if (selectedMitigationTags.length === 0) {
        await uiManager.showAlert('No Tags Selected', 'Please select at least one mitigation tag.');
        return;
    }

    const mitigationAttempt = {
        timestamp: timestamp,
        tags: [...selectedMitigationTags],
        severityAfter: newSeverity
    };

    dataStorage.addMitigationAttempt(mitigationAttempt);
    dataStorage.updateActiveAttackSeverity(newSeverity);
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
        dataStorage.addAttack(activeAttack);
        dataStorage.setActiveAttack(null);
        dataStorage.saveData();
        uiManager.updateUI();
        visualizationManager.renderVisualizations();
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
