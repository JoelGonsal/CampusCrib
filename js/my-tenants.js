// Check authentication
const token = localStorage.getItem('token');
console.log('Token check:', token ? 'Token exists' : 'No token found');

if (!token) {
    console.log('No token found, redirecting to login');
    alert('Please login first to view your tenants');
    window.location.href = 'index.html';
}

// Logout functionality is handled by auth.js

// Load tenants
async function loadTenants() {
    const loadingState = document.getElementById('loadingState');
    const tenantsContainer = document.getElementById('tenantsContainer');
    const emptyState = document.getElementById('emptyState');
    
    try {
        // Show loading state
        loadingState.style.display = 'flex';
        tenantsContainer.style.display = 'none';
        emptyState.style.display = 'none';
        
        const response = await fetch('http://localhost:3000/api/my-tenants', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch tenants');
        }

        const tenants = await response.json();
        
        // Hide loading state
        loadingState.style.display = 'none';
        
        displayTenants(tenants);
    } catch (error) {
        console.error('Error loading tenants:', error);
        loadingState.style.display = 'none';
        emptyState.style.display = 'block';
        emptyState.innerHTML = `
            <div class="text-center py-16">
                <div class="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg class="w-12 h-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                </div>
                <h3 class="text-xl font-semibold text-gray-900 mb-2">Error Loading Tenants</h3>
                <p class="text-gray-600 mb-6">There was an error loading your tenants. Please try again.</p>
                <button onclick="loadTenants()" class="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105">
                    Try Again
                </button>
            </div>
        `;
    }
}

function displayTenants(tenants) {
    const container = document.getElementById('tenantsContainer');
    const emptyState = document.getElementById('emptyState');

    if (tenants.length === 0) {
        container.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }

    container.style.display = 'grid';
    container.style.gridTemplateColumns = 'repeat(auto-fill, minmax(320px, 1fr))';
    container.style.gap = '1.5rem';
    emptyState.style.display = 'none';

    container.innerHTML = tenants.map(tenant => `
        <div class="listing-card bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
            <div class="listing-header flex justify-between items-start mb-4">
                <div class="flex items-center">
                    <div class="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg mr-3">
                        ${tenant.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h3 class="text-xl font-bold text-gray-900">${tenant.full_name}</h3>
                        <p class="text-gray-600 text-sm">${tenant.course}</p>
                    </div>
                </div>
                <span class="status-badge bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold">
                    ✅ Active
                </span>
            </div>
            
            <div class="bg-blue-50 p-4 rounded-lg mb-4">
                <h4 class="text-sm font-semibold text-blue-900 mb-2">Property Details</h4>
                <p class="text-blue-800 font-medium">${tenant.pg_title}</p>
                <p class="text-blue-600 text-sm flex items-center mt-1">
                    <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    </svg>
                    ${tenant.location}
                </p>
            </div>

            <div class="grid grid-cols-2 gap-3 mb-4">
                <div class="bg-purple-50 p-3 rounded-lg">
                    <p class="text-xs text-purple-600 font-medium mb-1">Rental Type</p>
                    <p class="text-sm font-bold text-purple-900 capitalize">${tenant.rental_type}</p>
                </div>
                <div class="bg-green-50 p-3 rounded-lg">
                    <p class="text-xs text-green-600 font-medium mb-1">Start Date</p>
                    <p class="text-sm font-bold text-green-900">${new Date(tenant.start_date).toLocaleDateString()}</p>
                </div>
            </div>

            <div class="space-y-3 mb-4">
                <div class="flex items-center justify-between py-2 border-b border-gray-100">
                    <span class="text-sm text-gray-600">Email</span>
                    <a href="mailto:${tenant.email}" class="text-sm font-medium text-blue-600 hover:text-blue-800">${tenant.email}</a>
                </div>
                <div class="flex items-center justify-between py-2 border-b border-gray-100">
                    <span class="text-sm text-gray-600">Phone</span>
                    <a href="tel:${tenant.phone}" class="text-sm font-medium text-blue-600 hover:text-blue-800">${tenant.phone}</a>
                </div>
                ${tenant.end_date ? `
                <div class="flex items-center justify-between py-2">
                    <span class="text-sm text-gray-600">End Date</span>
                    <span class="text-sm font-medium text-gray-900">${new Date(tenant.end_date).toLocaleDateString()}</span>
                </div>
                ` : ''}
            </div>

            <div class="bg-gray-50 p-4 rounded-lg mb-4">
                <h4 class="text-sm font-semibold text-gray-900 mb-3">Tenant Information</h4>
                <div class="grid grid-cols-1 gap-2 text-sm">
                    ${tenant.occupation ? `
                    <div class="flex justify-between">
                        <span class="text-gray-600">Occupation:</span>
                        <span class="font-medium">${tenant.occupation}</span>
                    </div>
                    ` : ''}
                    ${tenant.company_name ? `
                    <div class="flex justify-between">
                        <span class="text-gray-600">Company:</span>
                        <span class="font-medium">${tenant.company_name}</span>
                    </div>
                    ` : ''}
                    ${tenant.monthly_income ? `
                    <div class="flex justify-between">
                        <span class="text-gray-600">Income:</span>
                        <span class="font-medium">₹${parseInt(tenant.monthly_income).toLocaleString()}</span>
                    </div>
                    ` : ''}
                    ${tenant.id_proof_type ? `
                    <div class="flex justify-between">
                        <span class="text-gray-600">ID Proof:</span>
                        <span class="font-medium">${tenant.id_proof_type} - ${tenant.id_proof_number}</span>
                    </div>
                    ` : ''}
                </div>
            </div>

            ${tenant.emergency_contact_name || tenant.local_guardian_name || tenant.special_requirements ? `
            <div class="bg-yellow-50 p-4 rounded-lg mb-4">
                <h4 class="text-sm font-semibold text-yellow-900 mb-3">Emergency & Additional Info</h4>
                <div class="space-y-2 text-sm">
                    ${tenant.emergency_contact_name ? `<p><span class="text-yellow-700">Emergency Contact:</span> <span class="font-medium">${tenant.emergency_contact_name} (${tenant.emergency_contact_phone})</span></p>` : ''}
                    ${tenant.local_guardian_name ? `<p><span class="text-yellow-700">Local Guardian:</span> <span class="font-medium">${tenant.local_guardian_name} (${tenant.local_guardian_phone})</span></p>` : ''}
                    ${tenant.special_requirements ? `<p><span class="text-yellow-700">Special Requirements:</span> <span class="font-medium">${tenant.special_requirements}</span></p>` : ''}
                </div>
            </div>
            ` : ''}

            <div class="flex gap-3">
                <button class="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition duration-300 text-sm font-medium" onclick="contactTenant('${tenant.phone}')">
                    📞 Call
                </button>
                <button class="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-300 text-sm font-medium" onclick="emailTenant('${tenant.email}')">
                    ✉️ Email
                </button>
                <a href="https://wa.me/${tenant.phone}?text=Hi%20${encodeURIComponent(tenant.full_name)}%2C%20this%20is%20regarding%20your%20stay%20at%20${encodeURIComponent(tenant.pg_title)}" 
                   target="_blank" 
                   class="flex-1 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition duration-300 text-center text-sm font-medium">
                    💬 WhatsApp
                </a>
            </div>
        </div>
    `).join('');
}

function contactTenant(phone) {
    window.open(`tel:${phone}`);
}

function emailTenant(email) {
    window.open(`mailto:${email}`);
}

// Load tenants on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, starting to load tenants');
    loadTenants();
});