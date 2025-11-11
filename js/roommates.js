// Roommates page functionality
let allRoommates = [];
let filteredRoommates = [];

document.addEventListener('DOMContentLoaded', async function() {
    console.log('DOM loaded, initializing roommates page');
    
    // Check if updateAuthUI exists
    if (typeof updateAuthUI === 'function') {
        updateAuthUI();
    } else {
        console.warn('updateAuthUI function not found');
    }
    
    await loadRoommates();
    setupFilters();
});

async function loadRoommates() {
    const loadingState = document.getElementById('loadingState');
    const roommateListings = document.getElementById('roommateListings');
    const noResults = document.getElementById('noResults');
    
    console.log('Loading roommates...');
    
    try {
        // Show loading state
        if (loadingState) loadingState.classList.remove('hidden');
        if (roommateListings) roommateListings.classList.add('hidden');
        if (noResults) noResults.classList.add('hidden');
        
        const response = await fetch('http://localhost:3000/api/roommates');
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const roommates = await response.json();
        console.log('Loaded roommates:', roommates.length, roommates);
        
        allRoommates = roommates;
        filteredRoommates = [...allRoommates];
        
        if (loadingState) loadingState.classList.add('hidden');
        
        if (allRoommates.length === 0) {
            if (noResults) noResults.classList.remove('hidden');
        } else {
            displayRoommates(filteredRoommates);
            if (roommateListings) roommateListings.classList.remove('hidden');
        }
    } catch (error) {
        console.error('Error loading roommates:', error);
        if (loadingState) {
            loadingState.innerHTML = `
                <div class="text-red-500 text-center py-8">
                    <div class="text-6xl mb-4">⚠️</div>
                    <h3 class="text-2xl font-bold mb-2">Failed to Load Roommate Requests</h3>
                    <p class="text-lg">Error: ${error.message}</p>
                    <button onclick="location.reload()" class="mt-4 bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700">Retry</button>
                </div>
            `;
        }
    }
}

function displayRoommates(roommates) {
    console.log('Displaying roommates:', roommates.length);
    
    const roommateListings = document.getElementById('roommateListings');
    const noResults = document.getElementById('noResults');
    
    console.log('Elements found:', {
        roommateListings: !!roommateListings,
        noResults: !!noResults
    });
    
    if (roommates.length === 0) {
        if (roommateListings) roommateListings.classList.add('hidden');
        if (noResults) noResults.classList.remove('hidden');
        return;
    }
    
    if (noResults) noResults.classList.add('hidden');
    if (roommateListings) roommateListings.classList.remove('hidden');
    
    console.log('Generating HTML for roommates...');
    
    const html = roommates.map(roommate => {
        const lifestylePreferences = roommate.lifestyle_preferences ? JSON.parse(roommate.lifestyle_preferences) : [];
        
        const genderColors = {
            'male': 'bg-blue-100 text-blue-800',
            'female': 'bg-pink-100 text-pink-800',
            'any': 'bg-purple-100 text-purple-800'
        };
        
        const genderIcons = {
            'male': '👨',
            'female': '👩',
            'any': '👫'
        };
        
        return `
            <div class="bg-white bg-opacity-95 backdrop-blur-md p-6 rounded-xl shadow-lg hover:shadow-xl transition duration-300 text-left">
                <div class="mb-4">
                    <div class="flex items-center gap-3 mb-3">
                        <div class="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold text-lg">
                            ${(roommate.full_name && roommate.full_name.length > 0) ? roommate.full_name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                            <h3 class="text-xl font-bold text-gray-800">${roommate.full_name || 'Anonymous User'}</h3>
                            <p class="text-gray-600 text-sm">${roommate.course || 'NMIMS Student'}</p>
                        </div>
                    </div>
                    
                    <div class="flex items-center gap-2 mb-3">
                        <span class="${genderColors[roommate.looking_for_gender] || 'bg-gray-100 text-gray-800'} px-3 py-1 rounded-full text-sm font-medium">
                            ${genderIcons[roommate.looking_for_gender]} Looking for ${roommate.looking_for_gender === 'any' ? 'Any Gender' : roommate.looking_for_gender}
                        </span>
                        <span class="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                            ₹${parseInt(roommate.budget_max).toLocaleString()} budget
                        </span>
                    </div>
                    
                    <p class="text-gray-600 mb-2">📍 Preferred Location: ${roommate.preferred_location}</p>
                    
                    ${roommate.budget_min && roommate.budget_min !== roommate.budget_max ? `
                        <p class="text-sm text-gray-500 mb-2">💰 Budget Range: ₹${parseInt(roommate.budget_min).toLocaleString()} - ₹${parseInt(roommate.budget_max).toLocaleString()}</p>
                    ` : ''}
                    
                    ${roommate.sharing_preference && roommate.sharing_preference !== 'any' ? `
                        <p class="text-sm text-gray-500 mb-2">🏠 Prefers: ${roommate.sharing_preference.replace('_', ' ')}</p>
                    ` : ''}
                </div>
                
                ${roommate.about_me ? `
                    <div class="mb-4">
                        <p class="text-sm font-medium text-gray-700 mb-2">About:</p>
                        <p class="text-gray-700 text-sm bg-gray-50 p-3 rounded-lg">${roommate.about_me.substring(0, 150)}${roommate.about_me.length > 150 ? '...' : ''}</p>
                    </div>
                ` : ''}
                
                ${lifestylePreferences.length > 0 ? `
                    <div class="mb-4">
                        <p class="text-sm font-medium text-gray-700 mb-2">Lifestyle Preferences:</p>
                        <div class="flex flex-wrap gap-1">
                            ${lifestylePreferences.slice(0, 4).map(pref => `
                                <span class="bg-indigo-100 text-indigo-700 px-2 py-1 rounded text-xs">${pref}</span>
                            `).join('')}
                            ${lifestylePreferences.length > 4 ? `<span class="text-xs text-gray-500">+${lifestylePreferences.length - 4} more</span>` : ''}
                        </div>
                    </div>
                ` : ''}
                
                <div class="flex flex-col sm:flex-row gap-3">
                    <button onclick="sendRoommateRequest(${roommate.id})" 
                            class="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition duration-300 text-center text-sm">
                        🤝 Send Request
                    </button>
                    <a href="https://wa.me/${roommate.contact_number || roommate.whatsapp_number || '918827007325'}?text=Hi%20${encodeURIComponent(roommate.full_name || 'there')}%2C%20I%20saw%20your%20roommate%20request%20on%20CampusCrib%20and%20I'm%20interested%20in%20connecting." 
                       target="_blank" 
                       class="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition duration-300 text-center text-sm">
                        💬 WhatsApp
                    </a>
                </div>
                
                <div class="mt-3 text-xs text-gray-500 text-center">
                    Posted ${new Date(roommate.created_at).toLocaleDateString()} • Looking in ${roommate.preferred_location}
                </div>
            </div>
        `;
    }).join('');
    
    console.log('Generated HTML length:', html.length);
    roommateListings.innerHTML = html;
}

function setupFilters() {
    const searchInput = document.getElementById('searchInput');
    const genderFilter = document.getElementById('genderFilter');
    const budgetFilter = document.getElementById('budgetFilter');
    
    console.log('Setting up filters, elements found:', {
        searchInput: !!searchInput,
        genderFilter: !!genderFilter,
        budgetFilter: !!budgetFilter
    });
    
    function applyFilters() {
        const searchTerm = searchInput.value.toLowerCase();
        const gender = genderFilter.value;
        const budgetRange = budgetFilter.value;
        
        filteredRoommates = allRoommates.filter(roommate => {
            // Search filter
            const matchesSearch = !searchTerm || 
                (roommate.full_name && roommate.full_name.toLowerCase().includes(searchTerm)) ||
                roommate.preferred_location.toLowerCase().includes(searchTerm) ||
                (roommate.about_me && roommate.about_me.toLowerCase().includes(searchTerm)) ||
                (roommate.course && roommate.course.toLowerCase().includes(searchTerm));
            
            // Gender filter
            const matchesGender = !gender || roommate.looking_for_gender === gender;
            
            // Budget filter
            let matchesBudget = true;
            if (budgetRange) {
                const [min, max] = budgetRange.split('-').map(Number);
                const budget = parseInt(roommate.budget_max);
                matchesBudget = budget >= min && budget <= max;
            }
            
            return matchesSearch && matchesGender && matchesBudget;
        });
        
        displayRoommates(filteredRoommates);
    }
    
    if (searchInput) searchInput.addEventListener('input', applyFilters);
    if (genderFilter) genderFilter.addEventListener('change', applyFilters);
    if (budgetFilter) budgetFilter.addEventListener('change', applyFilters);
}

// Roommate Request functionality
async function sendRoommateRequest(roommatePostId) {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Please login to send a roommate request');
        window.location.href = 'index.html';
        return;
    }

    // Check if already sent request
    try {
        const statusResponse = await fetch(`http://localhost:3000/api/roommates/${roommatePostId}/request-status`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (statusResponse.ok) {
            const status = await statusResponse.json();
            if (status.hasRequested) {
                alert('You have already sent a request for this roommate post!');
                return;
            }
        }
    } catch (error) {
        console.error('Error checking request status:', error);
    }

    // Show request form modal
    showRoommateRequestModal(roommatePostId);
}

function showRoommateRequestModal(roommatePostId) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
        <div class="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 class="text-xl font-bold mb-4">Send Roommate Request</h3>
            <form id="roommateRequestForm">
                <div class="mb-4">
                    <label class="block text-sm font-medium mb-2">Message (Optional)</label>
                    <textarea name="message" class="w-full p-2 border rounded" rows="3" placeholder="Introduce yourself and why you'd be a good roommate..."></textarea>
                </div>
                
                <div class="mb-4">
                    <label class="block text-sm font-medium mb-2">Preferred Move-in Date</label>
                    <input type="date" name="preferred_move_in_date" class="w-full p-2 border rounded">
                </div>
                
                <div class="mb-4">
                    <label class="block text-sm font-medium mb-2">Budget Contribution (₹)</label>
                    <input type="number" name="budget_contribution" class="w-full p-2 border rounded" placeholder="Your monthly budget contribution">
                </div>
                
                <div class="mb-4">
                    <label class="block text-sm font-medium mb-2">Occupation</label>
                    <input type="text" name="occupation" class="w-full p-2 border rounded" placeholder="Student/Working Professional">
                </div>
                
                <div class="mb-4">
                    <label class="block text-sm font-medium mb-2">Company/College Name</label>
                    <input type="text" name="company_name" class="w-full p-2 border rounded" placeholder="NMIMS/Company Name">
                </div>
                
                <div class="mb-4">
                    <label class="block text-sm font-medium mb-2">Lifestyle Notes</label>
                    <textarea name="lifestyle_notes" class="w-full p-2 border rounded" rows="2" placeholder="Your lifestyle preferences, habits, etc."></textarea>
                </div>
                
                <div class="mb-4">
                    <label class="block text-sm font-medium mb-2">Preferred Contact Method</label>
                    <select name="contact_preference" class="w-full p-2 border rounded">
                        <option value="whatsapp">WhatsApp</option>
                        <option value="phone">Phone</option>
                        <option value="email">Email</option>
                    </select>
                </div>
                
                <div class="mb-4">
                    <label class="block text-sm font-medium mb-2">Emergency Contact Name</label>
                    <input type="text" name="emergency_contact_name" class="w-full p-2 border rounded">
                </div>
                
                <div class="mb-4">
                    <label class="block text-sm font-medium mb-2">Emergency Contact Phone</label>
                    <input type="tel" name="emergency_contact_phone" class="w-full p-2 border rounded">
                </div>
                
                <div class="flex gap-3">
                    <button type="button" onclick="closeRoommateRequestModal()" class="flex-1 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">
                        Cancel
                    </button>
                    <button type="submit" class="flex-1 bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">
                        Send Request
                    </button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Handle form submission
    document.getElementById('roommateRequestForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await submitRoommateRequest(roommatePostId, new FormData(e.target));
    });
}

function closeRoommateRequestModal() {
    const modal = document.querySelector('.fixed.inset-0');
    if (modal) {
        modal.remove();
    }
}

async function submitRoommateRequest(roommatePostId, formData) {
    const token = localStorage.getItem('token');
    
    try {
        const requestData = {};
        for (let [key, value] of formData.entries()) {
            if (value.trim()) {
                requestData[key] = value;
            }
        }
        
        const response = await fetch(`http://localhost:3000/api/roommates/${roommatePostId}/request`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(requestData)
        });

        const result = await response.json();

        if (response.ok) {
            alert('Roommate request sent successfully!');
            closeRoommateRequestModal();
        } else {
            alert(result.message || 'Error sending roommate request');
        }
    } catch (error) {
        console.error('Error sending roommate request:', error);
        alert('Error sending roommate request');
    }
}