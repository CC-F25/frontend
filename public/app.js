// API Configuration
const API_CONFIG = {
    USERS_API: 'https://users-microservice-258517926293.us-central1.run.app/users',
    PREFERENCES_API: 'https://YOUR_COMPOSITE_SERVICE_URL/user-preferences'  // Update this!
};

// DOM Elements
const form = document.getElementById('signupForm');
const messageDiv = document.getElementById('message');
const submitBtn = document.getElementById('submitBtn');

/**
 * Display a message to the user
 * @param {string} text - Message text to display
 * @param {string} type - Message type: 'success' or 'error'
 */
function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    messageDiv.style.display = 'block';
    
    // Auto-hide message after 5 seconds
    setTimeout(() => {
        messageDiv.style.display = 'none';
    }, 5000);
}

/**
 * Create a new user account
 * @param {Object} userData - User information (name, email, phone)
 * @returns {Promise<Object>} Created user object with ID
 */
async function createUser(userData) {
    const response = await fetch(API_CONFIG.USERS_API, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            name: userData.name,
            email: userData.email,
            phone_number: userData.phone,
            housing_preference: "apartment",  // Default value
            listing_group: "other"  // Default value
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to create user');
    }

    return response.json();
}

/**
 * Create user preferences
 * @param {string} userId - User ID from the created user
 * @param {Object} preferencesData - Apartment preferences
 * @returns {Promise<Object>} Created preferences object
 */
async function createPreferences(userId, preferencesData) {
    const response = await fetch(API_CONFIG.PREFERENCES_API, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            user_id: userId,
            ...preferencesData
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to create preferences');
    }

    return response.json();
}

/**
 * Get form data and structure it for the API
 * @returns {Object} Object containing userData and preferencesData
 */
function getFormData() {
    // Get elements with error checking
    const nameEl = document.getElementById('name');
    const emailEl = document.getElementById('email');
    const phoneEl = document.getElementById('phone');
    const maxBudgetEl = document.getElementById('maxBudget');
    const minSizeEl = document.getElementById('minSize');
    const locationAreaEl = document.getElementById('locationArea');
    const roomsEl = document.getElementById('rooms');

    // Check for missing fields
    if (!nameEl) throw new Error('Name field not found');
    if (!emailEl) throw new Error('Email field not found');
    if (!phoneEl) throw new Error('Phone field not found');
    if (!maxBudgetEl) throw new Error('Max Budget field not found');
    if (!minSizeEl) throw new Error('Min Size field not found');
    if (!locationAreaEl) throw new Error('Location Area field not found');
    if (!roomsEl) throw new Error('Rooms field not found');

    return {
        userData: {
            name: nameEl.value.trim(),
            email: emailEl.value.trim(),
            phone: phoneEl.value.trim()
        },
        preferencesData: {
            max_budget: parseFloat(maxBudgetEl.value),
            min_size: parseFloat(minSizeEl.value),
            location_area: locationAreaEl.value.trim(),
            rooms: parseInt(roomsEl.value)
        }
    };
}

/**
 * Handle form submission
 * @param {Event} e - Form submit event
 */
async function handleSubmit(e) {
    e.preventDefault();
    
    // Disable button to prevent double submission
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating Account...';

    try {
        const { userData, preferencesData } = getFormData();

        // Step 1: Create user account
        console.log('Creating user account...');
        const user = await createUser(userData);
        console.log('User created:', user);

        // TEMPORARILY SKIP PREFERENCES FOR TESTING
        showMessage('User created successfully! User ID: ' + user.id, 'success');
        form.reset();
        return; // Exit early to test just user creation

        // Step 2: Create preferences for the user
        console.log('Creating user preferences...');
        const preferences = await createPreferences(user.id, preferencesData);
        console.log('Preferences created:', preferences);

        // Success! Show success message and reset form
        showMessage('Account created successfully! Welcome aboard! 🎉', 'success');
        form.reset();
        
        // Optional: Redirect to another page after successful signup
        // Uncomment the lines below if you want to redirect
        // setTimeout(() => {
        //     window.location.href = '/home.html';
        // }, 2000);

    } catch (error) {
        console.error('Error during signup:', error);
        showMessage(`Error: ${error.message}`, 'error');
    } finally {
        // Re-enable the submit button
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create Account';
    }
}

// Add event listener when DOM is ready
if (form) {
    form.addEventListener('submit', handleSubmit);
} else {
    console.error('Sign up form not found!');
}