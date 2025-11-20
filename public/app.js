// =================== CONFIG: CHANGE THESE ===================
// Replace with the actual external IP/host + port of each microservice.
const USERS_BASE    = "http://USERS_VM_IP:8000";     // Users microservice
const PREFS_BASE    = "http://PREFERENCES_VM_IP:8080"; // Preferences microservice
const LISTINGS_BASE = "http://35.224.251.138:8000"; // Apt Listings microservice
// ===========================================================

// Grab DOM elements
const userForm        = document.getElementById("userForm");
const userStatusEl    = document.getElementById("userStatus");
const currentUserIdEl = document.getElementById("currentUserId");

const prefsForm       = document.getElementById("prefsForm");
const prefsStatusEl   = document.getElementById("prefsStatus");
const prefsUserIdEl   = document.getElementById("prefsUserId");

const searchForm      = document.getElementById("searchForm");
const searchUserIdEl  = document.getElementById("searchUserId");
const resultsDiv      = document.getElementById("results");

// Helper: keep the "current user ID" synced across sections
function setCurrentUserId(id) {
  currentUserIdEl.textContent = id;
  prefsUserIdEl.value = id;
  searchUserIdEl.value = id;
}

// ------------------- 0. Create User (Users MS) -------------------
userForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  userStatusEl.textContent = "Creating user…";

  const formData = new FormData(userForm);
  const payload = {
    name: formData.get("name"),
    email: formData.get("email"),
    // If your UserCreate model has more fields, add them here
  };

  try {
    const resp = await fetch(`${USERS_BASE}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`Error ${resp.status}: ${text}`);
    }

    const user = await resp.json();
    console.log("User created:", user);
    userStatusEl.innerHTML = `User created ✅<br>UUID: <code>${user.id}</code>`;
    setCurrentUserId(user.id);
  } catch (err) {
    console.error(err);
    userStatusEl.textContent = `Error creating user: ${err.message}`;
  }
});

// ------------------- 1. Save / Update Preferences (Prefs MS) -------------------
prefsForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  prefsStatusEl.textContent = "Saving preferences…";

  const formData = new FormData(prefsForm);
  const payload = {
    user_id: formData.get("userId"),
    max_budget: Number(formData.get("maxBudget")),
    min_size: Number(formData.get("minSize")),
    location_area: formData.get("locationArea"),
    rooms: Number(formData.get("rooms")),
  };

  try {
    const resp = await fetch(`${PREFS_BASE}/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`Error ${resp.status}: ${text}`);
    }

    const data = await resp.json();
    console.log("Preferences saved:", data);
    prefsStatusEl.textContent = "Preferences saved successfully ✅";
  } catch (err) {
    console.error(err);
    prefsStatusEl.textContent = `Error saving preferences: ${err.message}`;
  }
});

// ------------------- 2. Search Using Preferences (Prefs + Listings MS) -------------------
searchForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  resultsDiv.innerHTML = "Searching with preferences…";

  const formData = new FormData(searchForm);
  const userId = formData.get("userId");

  try {
    // 1) Load preferences for this user
    const prefsResp = await fetch(`${PREFS_BASE}/${userId}`);
    if (!prefsResp.ok) {
      const text = await prefsResp.text();
      throw new Error(`Could not load preferences (status ${prefsResp.status}): ${text}`);
    }
    const prefs = await prefsResp.json();
    console.log("Loaded preferences:", prefs);

    // 2) Use preferences to query Listings MS
    const params = new URLSearchParams();

    // Map preference fields → query params expected by Listings MS
    if (prefs.max_budget != null) params.append("max_rent", prefs.max_budget);
    if (prefs.location_area)      params.append("city", prefs.location_area);
    // Your listings service currently filters only on min_rent in code,
    // but including max_rent & city in query params is fine; you can extend backend later.

    const listingsResp = await fetch(`${LISTINGS_BASE}/listings?${params.toString()}`);
    if (!listingsResp.ok) {
      const text = await listingsResp.text();
      throw new Error(`Error fetching listings (status ${listingsResp.status}): ${text}`);
    }

    const listings = await listingsResp.json();
    console.log("Listings:", listings);
    renderListings(listings, prefs);
  } catch (err) {
    console.error(err);
    resultsDiv.innerHTML = `<p style="color:red;">${err.message}</p>`;
  }
});

function renderListings(listings, prefs) {
  if (!Array.isArray(listings) || listings.length === 0) {
    resultsDiv.innerHTML = "<p>No matching apartments found.</p>";
    return;
  }

  resultsDiv.innerHTML = "";

  // Optional: show the preferences used
  const prefsInfo = document.createElement("div");
  prefsInfo.className = "small";
  prefsInfo.innerHTML = `
    <p><strong>Using preferences:</strong>
       Max Budget = $${prefs.max_budget},
       Rooms = ${prefs.rooms},
       Area = ${prefs.location_area}</p>`;
  resultsDiv.appendChild(prefsInfo);

  listings.forEach((apt) => {
    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <strong>${apt.title || "Apartment"}</strong><br>
      ${apt.address?.city || ""} ${apt.address?.state || ""}<br>
      Rent: $${apt.monthly_rent} — ${apt.num_bedrooms ?? "?"} BR<br>
      <span class="small">ID: ${apt.id}</span>
    `;

    resultsDiv.appendChild(card);
  });
}
