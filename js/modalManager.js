let DOM = {}; // To store references to modal DOM elements

/**
 * Initializes the ModalManager with DOM elements.
 * @param {Object} domElements - An object containing references to DOM elements.
 */
export function init(domElements) {
    DOM = domElements;
}

/**
 * Opens a modal by adding the 'show' class.
 * @param {string} modalId - The ID of the modal element.
 */
export function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('show');
    } else {
        console.error(`Modal with ID '${modalId}' not found.`);
    }
}

/**
 * Closes a modal by removing the 'show' class.
 * @param {string} modalId - The ID of the modal element.
 */
export function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
    } else {
        console.error(`Modal with ID '${modalId}' not found.`);
    }
}
