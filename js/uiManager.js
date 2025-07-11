import * as dataStorage from './dataStorage.js';
import * as modalManager from './modalManager.js';
import * as attackManager from './attackManager.js';

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

            // Use a data attribute to store the tag for deletion handler
            deleteBtn.dataset.tag = tag;
            badge.appendChild(deleteBtn);
        }
        container.appendChild(badge);
    });

    // Attach event listener to the container for delegation
    if (deleteHandler) {
        container.removeEventListener('click', handleTagDeleteClick); // Prevent duplicate listeners
        container.addEventListener('click', handleTagDeleteClick);
    }
}

/**
 * Event handler for deleting tags using delegation.
 * @param {Event} event - The click event.
 */
function handleTagDeleteClick(event) {
    if (event.target.classList.contains('tag-badge-delete')) {
        const tagToDelete = event.target.dataset.tag;

        // The deleteHandler passed to renderTags will be responsible for calling the correct tagManager function
        // For now, we'll assume a global event listener or direct call from tagManager.
        // This structure needs a slight adjustment in tagManager or script.js to work.
        // For now, we'll make the deleteHandler directly call the tagManager function.
        // This function is just for internal delegation.
    }
}


/**
 * Renders selectable tags for modals.
 * @param {HTMLElement} container - The DOM element to render tags into.
 * @param {string[]} tagsArray - The array of tags to display.
 * @param {string[]} selectedTags - Array of currently selected tags.
 * @param {function} toggleHandler - Function to call when a tag is clicked.
 */
export function renderSelectableTags(container, tagsArray, selectedTags, toggleHandler) {
    container.innerHTML = '';
    tagsArray.forEach(tag => {
        const badge = document.createElement('span');
        const isSelected = selectedTags.includes(tag);
        badge.className = `tag-badge cursor-pointer ${isSelected ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-600'}`;
        badge.textContent = tag;
        badge.onclick = () => toggleHandler(tag);
        container.appendChild(badge);
    });
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
        // This is a callback for the delete button. We need to call a function in tagManager.
        // To avoid circular dependencies, we'll pass a direct reference or use a global event.
        // For now, we'll make this a direct call via attackManager (which has access to tagManager).
        // A better approach might be to have script.js handle the top-level delete events.
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
