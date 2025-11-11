// Check authentication
const token = localStorage.getItem('token');
console.log('Token check:', token ? 'Token exists' : 'No token found');

if (!token) {
    console.log('No token found, redirecting to login');
    alert('Please login first to view roommate requests');
    window.location.href = 'index.html';
}

// Load received roommate requests
async function loadReceivedRequests() {
    console.log('Loading received roommate requests...');
    
    const loadingState = document.getElementById('loadingState');
    const requestsContainer = document.getElementById('requestsContainer');
    const emptyState = document.getElementById('emptyState');
    
    try {
        // Show loading state
        if (loadingState) loadingState.style.display = 'flex';
        if (requestsContainer) requestsContainer.style.display = 'none';
        if (emptyState) emptyState.style.display = 'none';
        
        const response = await fetch('http://localhost:3000/api/my-roommate-post-requests', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
            throw new Error(`Failed to fetch requests: ${response.status}`);
        }

        const requests = await response.json();
        console.log('Requests received:', requests);
        
        // Hide loading state
        if (loadingState) loadingState.style.display = 'none';
        
        displayReceivedRequests(requests);
    } catch (error) {
        console.error('Error loading requests:', error);
        if (loadingState) loadingState.style.display = 'none';
        if (emptyState) {
            emptyState.style.display = 'block';
            emptyState.innerHTML = `
                <div class="text-center py-16">
                    <div class="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg class="w-12 h-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                    </div>
                    <h3 class="text-xl font-semibold text-gray-900 mb-2">Error Loading Requests</h3>
                    <p class="text-gray-600 mb-6">Error: ${error.message}</p>
                    <button onclick="loadReceivedRequests()" class="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105">
                        Try Again
                    </button>
                </div>
            `;
        }
    }
}

function displayReceivedRequests(requests) {
    console.log('Displaying received requests:', requests);
    
    const container = document.getElementById('requestsContainer');
    const emptyState = document.getElementById('emptyState');

    if (requests.length === 0) {
        if (container) container.style.display = 'none';
        if (emptyState) emptyState.style.display = 'block';
        return;
    }

    if (container) {
        container.style.display = 'grid';
        container.style.gridTemplateColumns = 'repeat(auto-fill, minmax(320px, 1fr))';
        container.style.gap = '1.5rem';
    }
    if (emptyState) emptyState.style.display = 'none';

    const statusColors = {
        'pending': 'bg-yellow-100 text-yellow-800',
        'accepted': 'bg-green-100 text-green-800',
        'rejected': 'bg-red-100 text-red-800'
    };

    const statusIcons = {
        'pending': '⏳',
        'accepted': '✅',
        'rejected': '❌'
    };

    container.innerHTML = requests.map(request => `
        <div class="listing-card bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
            <div class="listing-header flex justify-between items-start mb-4">
                <div class="flex items-center">
                    <div class="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white font-bold text-lg mr-3">
                        ${request.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h3 class="text-xl font-bold text-gray-900">${request.full_name}</h3>
                        <p class="text-gray-600 text-sm">${request.course}</p>
                    </div>
                </div>
                <span class="status-badge ${statusColors[request.status]} px-3 py-1 rounded-full text-xs font-semibold">
                    ${statusIcons[request.status]} ${request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                </span>
            </div>
            
            <div class="bg-blue-50 p-4 rounded-lg mb-4">
                <h4 class="text-sm font-semibold text-blue-900 mb-2">Your Roommate Post</h4>
                <p class="text-blue-800 text-sm">👥 Looking for ${request.looking_for_gender} roommate</p>
                <p class="text-blue-600 text-sm">📍 ${request.preferred_location}</p>
                <p class="text-blue-600 text-sm">💰 Budget: ₹${parseInt(request.budget_max).toLocaleString()}</p>
            </div>

            <div class="space-y-3 mb-4">
                <div class="flex items-center justify-between py-2 border-b border-gray-100">
                    <span class="text-sm text-gray-600">Email</span>
                    <a href="mailto:${request.email}" class="text-sm font-medium text-blue-600 hover:text-blue-800">${request.email}</a>
                </div>
                <div class="flex items-center justify-between py-2 border-b border-gray-100">
                    <span class="text-sm text-gray-600">Phone</span>
                    <a href="tel:${request.phone}" class="text-sm font-medium text-blue-600 hover:text-blue-800">${request.phone}</a>
                </div>
                <div class="flex items-center justify-between py-2 border-b border-gray-100">
                    <span class="text-sm text-gray-600">Request Date</span>
                    <span class="text-sm font-medium text-gray-900">${new Date(request.created_at).toLocaleDateString()}</span>
                </div>
                ${request.preferred_move_in_date ? `
                <div class="flex items-center justify-between py-2">
                    <span class="text-sm text-gray-600">Preferred Move-in</span>
                    <span class="text-sm font-medium text-gray-900">${new Date(request.preferred_move_in_date).toLocaleDateString()}</span>
                </div>
                ` : ''}
            </div>

            ${request.message || request.budget_contribution || request.occupation || request.lifestyle_notes ? `
            <div class="bg-gray-50 p-4 rounded-lg mb-4">
                <h4 class="text-sm font-semibold text-gray-900 mb-3">Request Details</h4>
                <div class="space-y-2 text-sm">
                    ${request.message ? `<p><span class="text-gray-600">Message:</span> <span class="font-medium">${request.message}</span></p>` : ''}
                    ${request.budget_contribution ? `<p><span class="text-gray-600">Budget Contribution:</span> <span class="font-medium">₹${parseInt(request.budget_contribution).toLocaleString()}</span></p>` : ''}
                    ${request.occupation ? `<p><span class="text-gray-600">Occupation:</span> <span class="font-medium">${request.occupation}</span></p>` : ''}
                    ${request.company_name ? `<p><span class="text-gray-600">Company:</span> <span class="font-medium">${request.company_name}</span></p>` : ''}
                    ${request.lifestyle_notes ? `<p><span class="text-gray-600">Lifestyle:</span> <span class="font-medium">${request.lifestyle_notes}</span></p>` : ''}
                    ${request.contact_preference ? `<p><span class="text-gray-600">Prefers Contact via:</span> <span class="font-medium capitalize">${request.contact_preference}</span></p>` : ''}
                </div>
            </div>
            ` : ''}

            ${request.emergency_contact_name ? `
            <div class="bg-yellow-50 p-4 rounded-lg mb-4">
                <h4 class="text-sm font-semibold text-yellow-900 mb-3">Emergency Contact</h4>
                <div class="space-y-1 text-sm">
                    <p><span class="text-yellow-700">Name:</span> <span class="font-medium">${request.emergency_contact_name}</span></p>
                    ${request.emergency_contact_phone ? `<p><span class="text-yellow-700">Phone:</span> <span class="font-medium">${request.emergency_contact_phone}</span></p>` : ''}
                </div>
            </div>
            ` : ''}

            <div class="flex gap-3">
                ${request.status === 'pending' ? `
                    <button class="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition duration-300 text-sm font-medium" onclick="updateRequestStatus(${request.id}, 'accepted')">
                        ✅ Accept
                    </button>
                    <button class="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition duration-300 text-sm font-medium" onclick="updateRequestStatus(${request.id}, 'rejected')">
                        ❌ Reject
                    </button>
                ` : `
                    <span class="flex-1 text-center py-2 text-sm font-medium text-gray-500">
                        Request ${request.status}
                    </span>
                `}
                <a href="https://wa.me/${request.phone}?text=Hi%20${encodeURIComponent(request.full_name)}%2C%20regarding%20your%20roommate%20request%20on%20CampusCrib" 
                   target="_blank" 
                   class="flex-1 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition duration-300 text-center text-sm font-medium">
                    💬 WhatsApp
                </a>
            </div>
        </div>
    `).join('');
}

async function updateRequestStatus(requestId, status) {
    const action = status === 'accepted' ? 'accept' : 'reject';
    
    if (!confirm(`Are you sure you want to ${action} this request?`)) {
        return;
    }

    try {
        const response = await fetch(`http://localhost:3000/api/roommate-requests/${requestId}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status })
        });

        if (!response.ok) {
            throw new Error(`Failed to ${action} request`);
        }

        alert(`Request ${status} successfully`);
        loadReceivedRequests(); // Reload the list
    } catch (error) {
        console.error(`Error ${action}ing request:`, error);
        alert(`Error ${action}ing request`);
    }
}

// Load requests on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, starting to load received requests');
    loadReceivedRequests();
});