// Check authentication
const token = localStorage.getItem('token');
console.log('Token check:', token ? 'Token exists' : 'No token found');

if (!token) {
    console.log('No token found, redirecting to login');
    alert('Please login first to view your rentals');
    window.location.href = 'index.html';
}

// Logout functionality is handled by auth.js

// Load rentals
async function loadRentals() {
    console.log('Loading rentals...');
    console.log('Token:', token);
    
    const loadingState = document.getElementById('loadingState');
    const rentalsContainer = document.getElementById('rentalsContainer');
    const emptyState = document.getElementById('emptyState');
    
    console.log('Elements found:', {
        loadingState: !!loadingState,
        rentalsContainer: !!rentalsContainer,
        emptyState: !!emptyState
    });
    
    try {
        // Show loading state
        if (loadingState) loadingState.style.display = 'flex';
        if (rentalsContainer) rentalsContainer.style.display = 'none';
        if (emptyState) emptyState.style.display = 'none';
        
        console.log('Making API call...');
        const response = await fetch('http://localhost:3000/api/my-rentals', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);

        if (!response.ok) {
            const errorText = await response.text();
            console.log('Error response:', errorText);
            throw new Error(`Failed to fetch rentals: ${response.status} - ${errorText}`);
        }

        const rentals = await response.json();
        console.log('Rentals received:', rentals);
        
        // Hide loading state
        if (loadingState) loadingState.style.display = 'none';
        
        displayRentals(rentals);
    } catch (error) {
        console.error('Error loading rentals:', error);
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
                    <h3 class="text-xl font-semibold text-gray-900 mb-2">Error Loading Rentals</h3>
                    <p class="text-gray-600 mb-6">Error: ${error.message}</p>
                    <button onclick="loadRentals()" class="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105">
                        Try Again
                    </button>
                </div>
            `;
        }
    }
}

function displayRentals(rentals) {
    console.log('Displaying rentals:', rentals);
    console.log('Rentals count:', rentals.length);
    
    const container = document.getElementById('rentalsContainer');
    const emptyState = document.getElementById('emptyState');

    console.log('Display elements:', {
        container: !!container,
        emptyState: !!emptyState
    });

    if (rentals.length === 0) {
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

    container.innerHTML = rentals.map(rental => `
        <div class="listing-card bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
            <div class="listing-header flex justify-between items-start mb-4">
                <div>
                    <h3 class="text-xl font-bold text-gray-900 mb-1">${rental.title}</h3>
                    <p class="text-gray-600 text-sm flex items-center">
                        <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        </svg>
                        ${rental.location}
                    </p>
                </div>
                <span class="status-badge bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold">
                    ✅ Active
                </span>
            </div>
            
            <div class="grid grid-cols-2 gap-4 mb-4">
                <div class="bg-blue-50 p-3 rounded-lg">
                    <p class="text-xs text-blue-600 font-medium mb-1">Monthly Rent</p>
                    <p class="text-lg font-bold text-blue-900">₹${parseInt(rental.rent_amount).toLocaleString()}</p>
                    <p class="text-xs text-blue-600">${rental.sharing_type.replace('_', ' ')}</p>
                </div>
                <div class="bg-purple-50 p-3 rounded-lg">
                    <p class="text-xs text-purple-600 font-medium mb-1">Rental Type</p>
                    <p class="text-lg font-bold text-purple-900 capitalize">${rental.rental_type}</p>
                    <p class="text-xs text-purple-600">Duration</p>
                </div>
            </div>

            <div class="space-y-3 mb-4">
                <div class="flex items-center justify-between py-2 border-b border-gray-100">
                    <span class="text-sm text-gray-600">Start Date</span>
                    <span class="text-sm font-medium text-gray-900">${new Date(rental.start_date).toLocaleDateString()}</span>
                </div>
                ${rental.end_date ? `
                <div class="flex items-center justify-between py-2 border-b border-gray-100">
                    <span class="text-sm text-gray-600">End Date</span>
                    <span class="text-sm font-medium text-gray-900">${new Date(rental.end_date).toLocaleDateString()}</span>
                </div>
                ` : ''}
                <div class="flex items-center justify-between py-2 border-b border-gray-100">
                    <span class="text-sm text-gray-600">Owner</span>
                    <span class="text-sm font-medium text-gray-900">${rental.owner_name}</span>
                </div>
                <div class="flex items-center justify-between py-2">
                    <span class="text-sm text-gray-600">Owner Phone</span>
                    <a href="tel:${rental.owner_phone}" class="text-sm font-medium text-blue-600 hover:text-blue-800">${rental.owner_phone}</a>
                </div>
            </div>

            ${rental.emergency_contact_name || rental.occupation || rental.company_name || rental.monthly_income || rental.special_requirements ? `
            <div class="bg-gray-50 p-4 rounded-lg mb-4">
                <h4 class="text-sm font-semibold text-gray-900 mb-3">Additional Information</h4>
                <div class="space-y-2 text-sm">
                    ${rental.emergency_contact_name ? `<p><span class="text-gray-600">Emergency Contact:</span> <span class="font-medium">${rental.emergency_contact_name} (${rental.emergency_contact_phone})</span></p>` : ''}
                    ${rental.occupation ? `<p><span class="text-gray-600">Occupation:</span> <span class="font-medium">${rental.occupation}</span></p>` : ''}
                    ${rental.company_name ? `<p><span class="text-gray-600">Company:</span> <span class="font-medium">${rental.company_name}</span></p>` : ''}
                    ${rental.monthly_income ? `<p><span class="text-gray-600">Monthly Income:</span> <span class="font-medium">₹${parseInt(rental.monthly_income).toLocaleString()}</span></p>` : ''}
                    ${rental.special_requirements ? `<p><span class="text-gray-600">Special Requirements:</span> <span class="font-medium">${rental.special_requirements}</span></p>` : ''}
                </div>
            </div>
            ` : ''}

            <div class="flex gap-3">
                <a href="https://wa.me/${rental.owner_phone}?text=Hi%2C%20I'm%20your%20tenant%20at%20${encodeURIComponent(rental.title)}" 
                   target="_blank" 
                   class="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition duration-300 text-center text-sm font-medium">
                    💬 Contact Owner
                </a>
                <button class="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition duration-300 text-sm font-medium" onclick="cancelRental(${rental.id})">
                    ❌ Cancel Rental
                </button>
            </div>
        </div>
    `).join('');
}

async function cancelRental(rentalId) {
    if (!confirm('Are you sure you want to cancel this rental?')) {
        return;
    }

    try {
        const response = await fetch(`http://localhost:3000/api/rentals/${rentalId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to cancel rental');
        }

        alert('Rental cancelled successfully');
        loadRentals(); // Reload the list
    } catch (error) {
        console.error('Error cancelling rental:', error);
        alert('Error cancelling rental');
    }
}

// Load rentals on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, starting to load rentals');
    loadRentals();
});