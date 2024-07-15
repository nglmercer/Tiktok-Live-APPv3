// customSelect.js
import { fetchSimplifiedState } from './simplifiedState.js';

export async function createGiftSelector(containerId, onChange, initialSelectedValue = null) {
    try {
        const simplifiedState = await fetchSimplifiedState();
        const gifts = simplifiedState.availableGifts;

        const container = document.getElementById(containerId);
        if (!container) {
            throw new Error(`No element found with ID: ${containerId}`);
        }

        // Clear any existing content
        container.innerHTML = '';

        // Create the input for search
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Search gifts...';
        input.classList.add('custom-select-input');
        container.appendChild(input);

        // Create the dropdown container
        const dropdown = document.createElement('div');
        dropdown.classList.add('custom-select-dropdown');
        container.appendChild(dropdown);

        // Function to set selected option
        function setSelectedOption(gift) {
            input.value = gift.name;
            input.dataset.value = gift.giftId;
            if (onChange && typeof onChange === 'function') {
                onChange(containerId, input.dataset.value);
            }
        }

        // Populate the dropdown with options
        gifts.forEach(gift => {
            const option = document.createElement('div');
            option.classList.add('custom-select-option');
            option.innerHTML = `<img src="${gift.imageUrl}" alt="${gift.name}" style="width:20px; height:20px;"/> ${gift.name} (Diamonds: ${gift.diamondcost})`;
            option.dataset.value = gift.giftId;
            dropdown.appendChild(option);

            // Add click event to select the option
            option.addEventListener('click', () => {
                setSelectedOption(gift);
                dropdown.classList.remove('show');
            });
        });

        // Show dropdown on focus
        input.addEventListener('focus', () => {
            dropdown.classList.add('show');
        });

        // Hide dropdown on blur
        input.addEventListener('blur', () => {
            setTimeout(() => dropdown.classList.remove('show'), 200); // Delay to allow click
        });

        // Filter options on input
        input.addEventListener('input', () => {
            const filter = input.value.toLowerCase();
            const options = dropdown.querySelectorAll('.custom-select-option');
            options.forEach(option => {
                const text = option.textContent.toLowerCase();
                if (text.includes(filter)) {
                    option.style.display = '';
                } else {
                    option.style.display = 'none';
                }
            });
        });

        // Set the initial selected value if provided
        if (initialSelectedValue !== null) {
            const initialGift = gifts.find(gift => gift.giftId === parseInt(initialSelectedValue, 10));
            if (initialGift) {
                setSelectedOption(initialGift);
            }
        }

    } catch (error) {
        console.error('Error in createGiftSelector:', error);
    }
}

// Function to get the selected value
export function getSelectedValue(containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
        throw new Error(`No element found with ID: ${containerId}`);
    }
    const input = container.querySelector('.custom-select-input');
    return input ? input.dataset.value : null;
}
