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
 * Calculates the duration between two timestamps in a readable format.
 * @param {number} startTime - The start timestamp.
 * @param {number} endTime - The end timestamp.
 * @returns {string} Formatted duration string.
 */
function formatDuration(startTime, endTime) {
    const durationMs = endTime - startTime;
    const seconds = Math.floor((durationMs / 1000) % 60);
    const minutes = Math.floor((durationMs / (1000 * 60)) % 60);
    const hours = Math.floor((durationMs / (1000 * 60 * 60)) % 24);
    const days = Math.floor(durationMs / (1000 * 60 * 60 * 24));

    let parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`); // Always show seconds if no other values

    return parts.join(' ');
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

    // Render attack history
    renderAttackHistory();
}

/**
 * Renders the historical attacks into the attack history section.
 */
function renderAttackHistory() {
    const attacks = dataStorage.getAttacks();
    DOM.attackHistoryList.innerHTML = ''; // Clear previous history list

    if (attacks.length === 0) {
        DOM.noHistoryMessage.classList.remove('hidden');
        return;
    } else {
        DOM.noHistoryMessage.classList.add('hidden');
    }

    // Sort attacks by end time, newest first
    const sortedAttacks = [...attacks].sort((a, b) => b.endTime - a.endTime);

    sortedAttacks.forEach(attack => {
        const attackCard = document.createElement('div');
        attackCard.className = 'bg-white p-4 rounded-lg shadow-sm border border-gray-200';

        const startTime = formatDateTime(attack.startTime);
        const endTime = attack.endTime ? formatDateTime(attack.endTime) : 'Ongoing';
        const duration = attack.endTime ? formatDuration(attack.startTime, attack.endTime) : 'N/A';

        let mitigationDetails = '';
        if (attack.mitigationAttempts && attack.mitigationAttempts.length > 0) {
            mitigationDetails = `
                <h4 class="font-semibold text-sm mt-2 mb-1 text-gray-700">Mitigations:</h4>
                <ul class="list-disc list-inside text-sm text-gray-600">
            `;
            attack.mitigationAttempts.forEach(attempt => {
                mitigationDetails += `<li>${formatDateTime(attempt.timestamp)}: ${attempt.tags.join(', ')} (Severity to <span class="font-bold" style="color: ${getSeverityColor(attempt.severityAfter)};">${attempt.severityAfter}</span>)</li>`;
            });
            mitigationDetails += `</ul>`;
        } else {
            mitigationDetails = `<p class="text-sm text-gray-600 mt-2">No mitigations recorded.</p>`;
        }

        attackCard.innerHTML = `
            <p class="text-md font-bold text-gray-800">Started: ${startTime}</p>
            <p class="text-md font-bold text-gray-800">Ended: ${endTime}</p>
            <p class="text-sm text-gray-700">Duration: ${duration}</p>
            <p class="text-sm text-gray-700">Initial Severity: <span class="font-bold" style="color: ${getSeverityColor(attack.initialSeverity)};">${attack.initialSeverity}</span></p>
            <p class="text-sm text-gray-700">Final Severity: <span class="font-bold" style="color: ${getSeverityColor(attack.currentSeverity)};">${attack.currentSeverity}</span></p>
            <p class="text-sm text-gray-700">Triggers: ${attack.locationTriggers.join(', ')}</p>
            ${mitigationDetails}
        `;
        DOM.attackHistoryList.appendChild(attackCard);
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
