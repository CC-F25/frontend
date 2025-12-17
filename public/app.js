// API Configuration
const CONFIG = {
    CLOUD: {
        USERS: 'https://users-microservice-258517926293.us-central1.run.app',
        BOOKINGS: 'https://bookings-microservice-258517926293.us-central1.run.app',
        LISTINGS: 'https://apartment-listings-258517926293.us-central1.run.app',
        PREFERENCES: 'https://preferences-proxy-258517926293.us-central1.run.app'
    },
    LOCAL: {
        USERS: 'http://localhost:8001',
        BOOKINGS: 'http://localhost:8002',
        PREFERENCES: 'http://localhost:8003',
        LISTINGS: 'http://localhost:8004'
    }
};

let currentMode = 'CLOUD'; // Default to Cloud

// DOM Elements
const form = document.getElementById('signupForm');
const messageDiv = document.getElementById('message');
const submitBtn = document.getElementById('submitBtn');

// Navigation Logic
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));

    // Show target section
    document.getElementById(`${sectionId}-section`).classList.add('active');

    // Activate nav item
    const navIndex = ['home', 'listings', 'bookings'].indexOf(sectionId);
    if (navIndex >= 0) {
        document.querySelectorAll('.nav-item')[navIndex].classList.add('active');
    }

    // Auto-load data if needed
    if (sectionId === 'listings') fetchListings();
}

function toggleLocalMode() {
    const isChecked = document.getElementById('localModeToggle').checked;
    currentMode = isChecked ? 'LOCAL' : 'CLOUD';
    console.log(`Switched to ${currentMode} mode.`);

    // Refresh current view
    if (document.getElementById('listings-section').classList.contains('active')) {
        fetchListings();
    }
}

function getApiUrl(service) {
    return CONFIG[currentMode][service];
}

/**
 * Display a message to the user
 */
function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    messageDiv.style.display = 'block';
    setTimeout(() => { messageDiv.style.display = 'none'; }, 5000);
}

// ---------------------------------------------------------
// USERS & PREFERENCES (Signup)
// ---------------------------------------------------------

async function createUser(userData) {
    const response = await fetch(`${getApiUrl('USERS')}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: userData.name,
            email: userData.email,
            phone_number: userData.phone,
            housing_preference: "apartment",
            listing_group: "other"
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to create user');
    }
    return response.json();
}

async function createPreferences(userId, preferencesData) {
    // Note: Preferences API logic varies slightly between services, adapting to standard
    const response = await fetch(`${getApiUrl('PREFERENCES')}/preferences`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            user_id: userId,
            ...preferencesData
        })
    });

    if (!response.ok) {
        // Preferences failures shouldn't block the UI flow entirely, but alert needs to show
        console.warn("Preferences creation failed");
    }
    return response.json();
}

async function handleSubmit(e) {
    e.preventDefault();
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating Account...';

    try {
        const userData = {
            name: document.getElementById('name').value.trim(),
            email: document.getElementById('email').value.trim(),
            phone: document.getElementById('phone').value.trim()
        };

        const preferencesData = {
            max_budget: parseFloat(document.getElementById('maxBudget').value),
            min_size: parseFloat(document.getElementById('minSize').value),
            location_area: [document.getElementById('locationArea').value.trim()],
            rooms: parseInt(document.getElementById('rooms').value)
        };

        console.log('Creating user...');
        const user = await createUser(userData);
        showMessage(`Account created! User ID: ${user.user_id || user.id}`, 'success');

        // Try creating preferences
        await createPreferences(user.user_id || user.id, preferencesData).catch(e => console.error(e));

        form.reset();
    } catch (error) {
        console.error(error);
        showMessage(`Error: ${error.message}`, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create Account';
    }
}

if (form) form.addEventListener('submit', handleSubmit);


// ---------------------------------------------------------
// LISTINGS
// ---------------------------------------------------------

async function fetchListings() {
    const tbody = document.getElementById('listings-body');
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Loading listings...</td></tr>';

    const minRent = document.getElementById('filter-min-rent').value;
    const maxRent = document.getElementById('filter-max-rent').value;

    let query = '?';
    if (minRent) query += `min_rent=${minRent}&`;
    if (maxRent) query += `max_rent=${maxRent}&`;

    try {
        const response = await fetch(`${getApiUrl('LISTINGS')}/listings${query}`);
        if (!response.ok) throw new Error("Failed to fetch listings");

        const listings = await response.json();
        renderListings(listings);
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="6" class="error" style="text-align:center;">Could not load listings. Ensure the Listings Service is running on ${getApiUrl('LISTINGS')}</td></tr>`;
        console.error(error);
    }
}

function renderListings(listings) {
    const tbody = document.getElementById('listings-body');
    tbody.innerHTML = '';

    if (listings.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No listings found matching your criteria.</td></tr>';
        return;
    }

    listings.forEach(l => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${l.title}</strong></td>
            <td>${l.num_bedrooms} Bed / ${l.num_bathrooms} Bath</td>
            <td>${l.square_feet} sqft</td>
            <td>${l.address.city}, ${l.address.state}</td>
            <td class="price-cell">$${l.monthly_rent}/mo</td>
            <td>
                <button class="book-btn small-btn" onclick="bookListing('${l.id}')">Book</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// ---------------------------------------------------------
// BOOKINGS
// ---------------------------------------------------------

async function bookListing(listingId) {
    const userId = prompt("Enter your User ID to book this apartment:");
    if (!userId) return;

    try {
        const response = await fetch(`${getApiUrl('BOOKINGS')}/bookings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: userId,
                listing_id: listingId
            })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || "Booking failed");
        }

        alert("Booking Successful! Check 'My Bookings' tab.");
    } catch (error) {
        alert(`Booking Failed: ${error.message}`);
    }
}

async function loadUserBookings() {
    const userId = document.getElementById('booking-user-id').value.trim();
    if (!userId) {
        alert("Please enter a User ID");
        return;
    }

    const listContainer = document.getElementById('bookings-list');
    listContainer.innerHTML = '<p>Loading bookings...</p>';

    try {
        // 1. Get List of Bookings
        const response = await fetch(`${getApiUrl('BOOKINGS')}/bookings/user/${userId}`);
        const bookings = await response.json();

        if (bookings.length === 0) {
            listContainer.innerHTML = '<p>No bookings found for this user.</p>';
            return;
        }

        listContainer.innerHTML = '';

        // 2. Fetch Details for each (Client-Side Composition for richer UI)
        // Note: The Bookings service has /bookings/{id}/details, we could use that too.

        for (const b of bookings) {
            // Get details for listing info
            let listingTitle = "Loading...";
            try {
                const detailRes = await fetch(`${getApiUrl('BOOKINGS')}/bookings/${b.id}/details`);
                const details = await detailRes.json();
                if (details.listing_info && details.listing_info.title) {
                    listingTitle = details.listing_info.title;
                }
            } catch (e) {
                listingTitle = "Apartment (Details Unavailable)";
            }

            const item = document.createElement('div');
            item.className = 'booking-item';
            item.innerHTML = `
                <div class="booking-header">
                    <strong>Booking ID: ${b.id}</strong>
                    <span>${new Date(b.created_at || Date.now()).toLocaleDateString()}</span>
                </div>
                <p><strong>Property:</strong> ${listingTitle}</p>
                <div class="booking-actions" style="margin-top:10px;">
                    <button onclick="deleteBooking('${b.id}')">Cancel Booking</button>
                </div>
            `;
            listContainer.appendChild(item);
        }

    } catch (error) {
        listContainer.innerHTML = `<p class="error">Error loading bookings: ${error.message}</p>`;
    }
}

async function deleteBooking(bookingId) {
    if (!confirm("Are you sure you want to cancel this booking?")) return;

    try {
        const response = await fetch(`${getApiUrl('BOOKINGS')}/bookings/${bookingId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            alert("Booking cancelled.");
            loadUserBookings(); // Refresh
        } else {
            alert("Failed to cancel booking.");
        }
    } catch (error) {
        alert("Error cancelling booking.");
    }
}
