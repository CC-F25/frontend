let CURRENT_JWT = null; // Stores the token we get from our Users Service
let CURRENT_USER_ID = null;

// API Configuration
const CONFIG = {
    CLOUD: {
        USERS: 'https://users-microservice-258517926293.us-central1.run.app',
        BOOKINGS: 'https://bookings-microservice-258517926293.us-central1.run.app',
        LISTINGS: 'https://listings-proxy-258517926293.us-central1.run.app/',
        PREFERENCES: 'https://preferences-proxy-258517926293.us-central1.run.app/'
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
    
    // Auto-load bookings if user is logged in
    if (sectionId === 'bookings') {
        if (CURRENT_USER_ID) {
            // Ensure the input is filled (in case they refreshed or moved around)
            document.getElementById('booking-user-id').value = CURRENT_USER_ID;
            loadUserBookings();
        }
    }
}

function toggleLocalMode() {
    const isChecked = document.getElementById('localModeToggle').checked;
    currentMode = isChecked ? 'LOCAL' : 'CLOUD';
    console.log(`Switched to ${currentMode} mode.`);
    if (document.getElementById('listings-section').classList.contains('active')) {
        fetchListings();
    }
}

function getApiUrl(service) {
    return CONFIG[currentMode][service];
}

function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    messageDiv.style.display = 'block';
    setTimeout(() => { messageDiv.style.display = 'none'; }, 5000);
}

// ---------------------------------------------------------
// AUTHENTICATION & ORCHESTRATION
// ---------------------------------------------------------

async function handleCredentialResponse(response) {
    console.log("Google Token Received:", response.credential);

    try {
        const res = await fetch(`${CONFIG.CLOUD.USERS}/auth/google?google_token=${response.credential}`, {
            method: 'POST'
        });

        if (!res.ok) throw new Error("Login Failed");

        const data = await res.json();
        
        CURRENT_JWT = data.access_jwt;
        CURRENT_USER_ID = data.user.id;

        const bookingInput = document.getElementById('booking-user-id');
        if (bookingInput) bookingInput.value = CURRENT_USER_ID;
        
        // Hide Login Button
        document.getElementById("auth-section").style.display = "none";

        // Logic to skip form if user already has phone number
        if (data.user.phone_number) {
            console.log("User exists. Redirecting...");
            const subtitle = document.querySelector(".subtitle");
            subtitle.innerHTML = `✅ <strong>Welcome back, ${data.user.name}!</strong>`;
            subtitle.style.color = "green";
            setTimeout(() => showSection('listings'), 1000);
        } else {
            console.log("New User. Showing form...");
            const subtitle = document.querySelector(".subtitle");
            subtitle.innerHTML = `✅ <strong>Logged in as: ${data.user.name}</strong><br>Please complete your profile below.`;
            subtitle.style.color = "green";

            // Pre-fill fields
            document.getElementById('name').value = data.user.name;
            document.getElementById('email').value = data.user.email;
            
            // Pre-fill optional fields if they exist
            document.getElementById('location').value = data.user.location || '';
            document.getElementById('bio').value = data.user.bio || '';

            const form = document.getElementById('signupForm');
            form.style.display = 'block';
            setTimeout(() => { form.style.opacity = '1'; }, 10);
        }

    } catch (error) {
        console.error("Auth Error:", error);
        alert("Login failed.");
    }
}
window.handleCredentialResponse = handleCredentialResponse;

// ---------------------------------------------------------
// PROFILE UPDATES (Identity + Preferences)
// ---------------------------------------------------------

async function updateUser(userId, userData) {
    const response = await fetch(`${getApiUrl('USERS')}/users/${userId}`, {
        method: 'PATCH',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${CURRENT_JWT}`
        },
        body: JSON.stringify({
            name: userData.name,
            phone_number: userData.phone,
            bio: userData.bio,
            location: userData.location
        })
    });

    if (!response.ok) {
        const error = await response.json();
        const errorMessage = typeof error.detail === 'object' 
            ? JSON.stringify(error.detail) 
            : (error.detail || 'Failed to update user');
        throw new Error(errorMessage);
    }
    return response.json();
}

async function createPreferences(userId, prefData) {
    const response = await fetch(`${getApiUrl('PREFERENCES')}/user-preferences`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            user_id: userId,
            max_budget: parseInt(prefData.maxBudget),
            min_size: parseInt(prefData.minSize),
            rooms: parseInt(prefData.rooms),
            location_area: [prefData.locationArea] 
        })
    });

    if (!response.ok) {
        const error = await response.json();
        const errorMessage = typeof error.detail === 'object' 
            ? JSON.stringify(error.detail) 
            : (error.detail || 'Failed to create preferences');
        console.warn("Preferences Error:", errorMessage);
        throw new Error("Preferences: " + errorMessage);
    }
    return response.json();
}

async function handleSubmit(e) {
    e.preventDefault();
    
    if (!CURRENT_JWT || !CURRENT_USER_ID) {
        alert("Please login with Google first.");
        return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving...';

    try {
        // Prepare User Data (Identity -> Users Service)
        const userData = {
            name: document.getElementById('name').value.trim(),
            email: document.getElementById('email').value.trim(),
            phone: document.getElementById('phone').value.trim(),
            location: document.getElementById('location').value.trim(),
            bio: document.getElementById('bio').value.trim()
        };

        // Prepare Preferences Data (Criteria -> Preferences Service)
        const preferencesData = {
            maxBudget: document.getElementById('maxBudget').value,
            minSize: document.getElementById('minSize').value,
            rooms: document.getElementById('rooms').value,
            locationArea: document.getElementById('prefLocation').value.trim()
        };

        console.log('Orchestrating split write...');
        
        // Update Identity
        await updateUser(CURRENT_USER_ID, userData);

        // Create Criteria
        await createPreferences(CURRENT_USER_ID, preferencesData);

        showMessage('Profile saved successfully!', 'success');
        
        setTimeout(() => showSection('listings'), 1500);

    } catch (error) {
        console.error(error);
        showMessage(`Error: ${error.message}`, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Save Profile & Continue';
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
        // Handle pagination response format { items: [], total: ... }
        const items = Array.isArray(listings) ? listings : (listings.items || []);
        renderListings(items);
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
    if (!CURRENT_JWT) {
        alert("You must Sign In with Google first!");
        return;
    }

    const dateStr = prompt("Enter booking date (YYYY-MM-DD):", new Date().toISOString().split('T')[0]);
    if (!dateStr) return;

    const payload = {
        user_id: CURRENT_USER_ID,
        listing_id: listingId,
        booking_date: new Date(dateStr).toISOString()
    };

    try {
        const response = await fetch(`${CONFIG.CLOUD.BOOKINGS}/bookings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${CURRENT_JWT}` 
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            const data = await response.json();
            alert(`Booking Successful! ID: ${data.id}`);
        } else {
            const err = await response.json();
            alert(`Booking Failed: ${JSON.stringify(err)}`);
        }
    } catch (error) {
        console.error("Booking Error:", error);
        alert("Network error.");
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
        const response = await fetch(`${getApiUrl('BOOKINGS')}/bookings/user/${userId}`);
        const bookings = await response.json();

        if (bookings.length === 0) {
            listContainer.innerHTML = '<p>No bookings found for this user.</p>';
            return;
        }

        listContainer.innerHTML = '';

        for (const b of bookings) {
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
            loadUserBookings(); 
        } else {
            alert("Failed to cancel booking.");
        }
    } catch (error) {
        alert("Error cancelling booking.");
    }
}