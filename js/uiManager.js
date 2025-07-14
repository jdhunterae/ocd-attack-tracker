import * as dataStorage from './dataStorage.js';
import * as modalManager from './modalManager.js';
import * as attackManager from './attackManager.js';
import * as visualizationManager from './visualizationManager.js';

let DOM = {};

/**
 * Initializes the UIManager with DOM elements.
 * @param {Object} domElements - An object containing references to DOM elements.
 */
export function init(domElements) {
    DOM = domElements;
    // console.log('UIManager initialized with DOM elements:', DOM); // Uncomment for debugging if needed
}

/**
 * Formats a Date object into a readable string.
 * @param {number} timestamp - The timestamp to format.
 * @returns {string} Formatted date string.
 */
function formatDateTime(timestamp) {
    return new Date(timestamp).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Gets a color based on severity level.
 * @param {number} severity - The severity level (1-10).
 * @returns {string} Hex color code.
 */
function getSeverityColor(severity) {
    if (severity <= 3) return '#22c55e';
    if (severity <= 6) return '#f59e0b';
    return '#ef4444';
}

/**
 * Renders tags into a given container with optional deletion functionality.
 * @param {HTMLElement} container - The DOM element to render tags into.
 * @param {string[]} tagsArray - The array of tags to display.
 * @param {function} deleteHandler - Function to call when a delete button is clicked.
 */
export function renderTags(container, tagsArray, deleteHandler = null) {
    container.innerHTML = '';
    tagsArray.forEach(tag => {
        const badge = document.createElement('span');
        badge.className = 'tag-badge';
        badge.textContent = tag;
        if (deleteHandler) {
            const deleteBtn = document.createElement('span');
            deleteBtn.className = 'tag-badge-delete';
            deleteBtn.innerHTML = '&times;';
            deleteBtn.dataset.tag = tag;
            badge.appendChild(deleteBtn);
        }
        container.appendChild(badge);
    });

    if (deleteHandler) {
        container.removeEventListener('click', handleTagDeleteClick); // Remove existing listener
        container.addEventListener('click', handleTagDeleteClick); // Add new listener
    }

    function handleTagDeleteClick(event) {
        if (event.target.classList.contains('tag-badge-delete')) {
            const tagToDelete = event.target.dataset.tag;
            deleteHandler(tagToDelete);
        }
    }
}

/**
 * Renders the tag input field, selected tags, and suggested tags within a modal.
 * @param {object} elements - Object containing DOM elements for this specific tag section (e.g., tagInput, selectedTagsContainer, suggestedTagsContainer).
 * @param {string[]} allAvailableTags - All tags the user has created (e.g., locationTriggers or mitigations).
 * @param {string[]} currentSelectedTags - The tags currently selected for the attack/mitigation.
 * @param {function} toggleSelectionHandler - Function to call when a suggested tag is clicked (to add/remove it from selected).
 * @param {string} inputFilter - The current text in the input field for filtering suggestions.
 * @param {string} tagType - 'location' or 'mitigation' to determine which top tags to show.
 */
export function renderTagInputWithSuggestions(elements, allAvailableTags, currentSelectedTags, toggleSelectionHandler, inputFilter = '', tagType) {
    // Render selected tags
    elements.selectedTagsContainer.innerHTML = '';
    currentSelectedTags.forEach(tag => {
        const badge = document.createElement('span');
        badge.className = 'tag-badge bg-indigo-600 text-white cursor-pointer';
        badge.textContent = tag;
        const removeBtn = document.createElement('span');
        removeBtn.className = 'tag-badge-delete';
        removeBtn.innerHTML = '&times;';
        removeBtn.onclick = () => toggleSelectionHandler(tag); // Click to remove from selected
        badge.appendChild(removeBtn);
        elements.selectedTagsContainer.appendChild(badge);
    });

    // Filter and render suggested tags
    elements.suggestedTagsContainer.innerHTML = '';
    const filteredTags = allAvailableTags
        .filter(tag => tag.toLowerCase().includes(inputFilter.toLowerCase()) && !currentSelectedTags.includes(tag))
        .sort((a, b) => a.localeCompare(b)); // Sort alphabetically

    // Get top tags from visualizationManager
    const topTags = tagType === 'location' ? visualizationManager.getTopTriggers() : visualizationManager.getTopMitigations();
    const topTagNames = topTags.map(item => item[0]); // Extract tag names

    // Combine filtered tags with top tags, prioritize top tags, ensure uniqueness
    const suggestionsToShow = [];
    // Add top tags first, if not already selected
    topTagNames.forEach(tag => {
        if (!currentSelectedTags.includes(tag) && !suggestionsToShow.includes(tag)) {
            suggestionsToShow.push(tag);
        }
    });

    // Add other filtered tags, ensuring they are not duplicates and not already in top suggestions
    filteredTags.forEach(tag => {
        if (!currentSelectedTags.includes(tag) && !suggestionsToShow.includes(tag) && suggestionsToShow.length < 10) { // Limit total suggestions
            suggestionsToShow.push(tag);
        }
    });

    // Sort the final list of suggestions
    suggestionsToShow.sort((a, b) => a.localeCompare(b));

    suggestionsToShow.slice(0, 10).forEach(tag => { // Display a maximum of 10 suggestions
        const badge = document.createElement('span');
        badge.className = 'tag-badge bg-indigo-100 text-indigo-600 cursor-pointer';
        badge.textContent = tag;
        badge.onclick = () => toggleSelectionHandler(tag); // Click to add to selected
        elements.suggestedTagsContainer.appendChild(badge);
    });

    if (suggestionsToShow.length === 0 && inputFilter.length > 0 && !allAvailableTags.includes(inputFilter)) {
        // Optionally show a message if no suggestions and input is new
        const noResults = document.createElement('span');
        noResults.className = 'text-gray-500 text-sm';
        noResults.textContent = `No matching tags. Press "Add" to create "${inputFilter}".`;
        elements.suggestedTagsContainer.appendChild(noResults);
    }
}


/**
 * Updates the main UI display based on the active attack status.
 */
export function updateUI() {
    const activeAttack = dataStorage.getActiveAttack();
    const locationTriggers = dataStorage.getLocationTriggers();
    const mitigations = dataStorage.getMitigations();

    if (activeAttack) {
        DOM.noActiveAttackDisplay.classList.add('hidden');
        DOM.activeAttackDisplay.classList.remove('hidden');
        DOM.startAttackBtn.classList.add('hidden');

        DOM.attackStartTimeSpan.textContent = formatDateTime(activeAttack.startTime);
        DOM.attackCurrentSeveritySpan.textContent = activeAttack.currentSeverity;
        DOM.attackSeverityBar.style.width = `${activeAttack.currentSeverity * 10}%`;
        DOM.attackSeverityBar.style.backgroundColor = getSeverityColor(activeAttack.currentSeverity);
        DOM.attackTagsSpan.textContent = [...activeAttack.locationTriggers].join(', ');

        DOM.mitigationList.innerHTML = '';
        activeAttack.mitigationAttempts.forEach(attempt => {
            const li = document.createElement('li');
            li.innerHTML = `<span class="font-semibold">${formatDateTime(attempt.timestamp)}:</span> ${attempt.tags.join(', ')} (Severity changed to <span class="font-bold" style="color: ${getSeverityColor(attempt.severityAfter)};">${attempt.severityAfter}</span>)`;
            DOM.mitigationList.appendChild(li);
        });
    } else {
        DOM.noActiveAttackDisplay.classList.remove('hidden');
        DOM.activeAttackDisplay.classList.add('hidden');
        DOM.startAttackBtn.classList.remove('hidden');
    }

    // Always re-render tag management sections
    renderTags(DOM.locationTriggerTagsDiv, locationTriggers, (tag) => {
        attackManager.requestDeleteLocationTriggerTag(tag);
    });
    renderTags(DOM.mitigationReliefTagsDiv, mitigations, (tag) => {
        attackManager.requestDeleteMitigationReliefTag(tag);
    });
}

/**
 * Displays a custom alert modal.
 * @param {string} title - The title of the alert.
 * @param {string} message - The message content.
 * @param {boolean} isConfirm - If true, shows a "Cancel" button.
 * @returns {Promise<boolean>} Resolves true if OK is clicked, false if Cancel.
 */
export function showAlert(title, message, isConfirm = false) {
    return new Promise(resolve => {
        if (!DOM.customAlertModal || !DOM.customAlertTitle || !DOM.customAlertMessage || !DOM.customAlertOkBtn || !DOM.customAlertCancelBtn) {
            console.error("ERROR: Custom alert modal elements are missing from DOM. Cannot show custom alert.");
            if (isConfirm) {
                resolve(confirm(message));
            } else {
                alert(message);
                resolve(true);
            }
            return;
        }

        DOM.customAlertTitle.textContent = title;
        DOM.customAlertMessage.textContent = message;

        DOM.customAlertCancelBtn.classList.toggle('hidden', !isConfirm);

        DOM.customAlertOkBtn.onclick = null;
        DOM.customAlertCancelBtn.onclick = null;

        DOM.customAlertOkBtn.onclick = () => {
            modalManager.closeModal('custom-alert-modal');
            resolve(true);
        };

        if (isConfirm) {
            DOM.customAlertCancelBtn.onclick = () => {
                modalManager.closeModal('custom-alert-modal');
                resolve(false);
            };
        }

        modalManager.openModal('custom-alert-modal');
    });
}
