// PGs page functionality
let allPGs = [];
let filteredPGs = [];

document.addEventListener('DOMContentLoaded', async function() {
    updateAuthUI();
    await loadPGs();
    setupFilters();
});

async function loadPGs() {
    const loadingState = document.getElementById('loadingState');
    const pgListings = document.getElementById('pgListings');
    const noResults = document.getElementById('noResults');
    
    console.log('Loading PGs...');
    
    try {
        // Add cache-busting parameter to ensure fresh data
        const response = await fetch(`http://localhost:3000/api/pgs?t=${Date.now()}`);
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Loaded PGs:', data.length, data);
        
        allPGs = data;
        filteredPGs = [...allPGs];
        
        loadingState.classList.add('hidden');
        
        if (allPGs.length === 0) {
            noResults.classList.remove('hidden');
        } else {
            displayPGs(filteredPGs);
            pgListings.classList.remove('hidden');
        }
    } catch (error) {
        console.error('Error loading PGs:', error);
        loadingState.innerHTML = `
            <div class="text-red-500 text-center py-8">
                <div class="text-6xl mb-4">⚠️</div>
                <h3 class="text-2xl font-bold mb-2">Failed to Load PGs</h3>
                <p class="text-lg">Error: ${error.message}</p>
                <button onclick="location.reload()" class="mt-4 bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">Retry</button>
            </div>
        `;
    }
}

function displayPGs(pgs) {
    const pgListings = document.getElementById('pgListings');
    const noResults = document.getElementById('noResults');
    
    if (pgs.length === 0) {
        pgListings.classList.add('hidden');
        noResults.classList.remove('hidden');
        return;
    }
    
    noResults.classList.add('hidden');
    pgListings.classList.remove('hidden');
    
    pgListings.innerHTML = pgs.map(pg => {
        // Handle double-encoded amenities
        let amenities = [];
        try {
            if (pg.amenities) {
                // Try parsing once
                let parsed = JSON.parse(pg.amenities);
                // If it's still a string, parse again (double-encoded)
                if (typeof parsed === 'string') {
                    parsed = JSON.parse(parsed);
                }
                amenities = Array.isArray(parsed) ? parsed : [];
            }
        } catch (e) {
            console.warn('Failed to parse amenities for PG:', pg.title, e);
            amenities = [];
        }
        
        const images = pg.images ? JSON.parse(pg.images) : [];
        const hasImages = images.length > 0 && images[0] !== '' && images[0] !== null;
        
        return `
            <div class="bg-white bg-opacity-95 backdrop-blur-md p-6 rounded-2xl shadow-lg hover:shadow-xl transition duration-300 text-left">
                ${hasImages ? `
                    <div class="relative w-full h-48 mb-4 overflow-hidden rounded-lg">
                        ${images.map((img, index) => `
                            <img class="w-full h-full object-cover image-slide ${index === 0 ? '' : 'hidden'}" 
                                 src="${img}" 
                                 alt="${pg.title}"
                                 onerror="this.style.display='none'" />
                        `).join('')}
                        ${images.length > 1 ? `
                            <button onclick="slidePrev(this)" class="absolute left-2 top-1/2 -translate-y-1/2 bg-white bg-opacity-70 hover:bg-opacity-90 px-3 py-2 rounded-full shadow transition">
                                &#8592;
                            </button>
                            <button onclick="slideNext(this)" class="absolute right-2 top-1/2 -translate-y-1/2 bg-white bg-opacity-70 hover:bg-opacity-90 px-3 py-2 rounded-full shadow transition">
                                &#8594;
                            </button>
                        ` : ''}
                    </div>
                ` : `
                    <div class="w-full h-32 mb-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg flex items-center justify-center border-2 border-dashed border-blue-200">
                        <div class="text-center text-blue-400">
                            <div class="text-3xl mb-1">🏠</div>
                            <p class="text-sm font-medium">No photos available</p>
                            <p class="text-xs">Contact owner for more details</p>
                        </div>
                    </div>
                `}
                
                <div class="mb-4">
                    <h3 class="text-xl font-bold text-gray-800 mb-2">${pg.title}</h3>
                    <div class="flex items-center gap-2 mb-2">
                        <span class="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                            ₹${parseInt(pg.rent_amount).toLocaleString()}/month
                        </span>
                        <span class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                            ${pg.sharing_type.replace('_', ' ')}
                        </span>
                        <span class="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                            ${pg.property_type.toUpperCase()}
                        </span>
                    </div>
                    <p class="text-gray-600 mb-2">📍 ${pg.location}, ${pg.area}</p>
                    ${pg.distance_from_college ? `<p class="text-sm text-gray-500 mb-2">🎓 ${pg.distance_from_college} from NMIMS</p>` : ''}
                    ${pg.description ? `<p class="text-gray-700 text-sm mb-3">${pg.description.substring(0, 100)}${pg.description.length > 100 ? '...' : ''}</p>` : ''}
                </div>
                
                ${amenities.length > 0 ? `
                    <div class="mb-4">
                        <p class="text-sm font-medium text-gray-700 mb-2">Amenities:</p>
                        <div class="flex flex-wrap gap-1">
                            ${amenities.slice(0, 4).map(amenity => `
                                <span class="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">${amenity}</span>
                            `).join('')}
                            ${amenities.length > 4 ? `<span class="text-xs text-gray-500">+${amenities.length - 4} more</span>` : ''}
                        </div>
                    </div>
                ` : ''}
                
                <div class="flex flex-col sm:flex-row gap-3">
                    <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pg.title + ' ' + pg.location)}" 
                       target="_blank" 
                       class="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-300 text-center text-sm">
                        📍 View on Map
                    </a>
                    <button onclick="rentPG(${pg.id})" 
                            class="flex-1 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition duration-300 text-center text-sm">
                        🏠 Rent Now
                    </button>
                    <a href="https://wa.me/${pg.contact_number || pg.whatsapp_number || '918827007325'}?text=Hi%2C%20I'm%20interested%20in%20${encodeURIComponent(pg.title)}%20listed%20on%20CampusCrib." 
                       target="_blank" 
                       class="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition duration-300 text-center text-sm">
                        💬 WhatsApp
                    </a>
                </div>
                
                <div class="mt-3 text-xs text-gray-500 text-center">
                    Posted by ${pg.owner_name || 'Owner'} • ${new Date(pg.created_at).toLocaleDateString()}
                </div>
            </div>
        `;
    }).join('');
}

function setupFilters() {
    const searchInput = document.getElementById('searchInput');
    const propertyTypeFilter = document.getElementById('propertyTypeFilter');
    const budgetFilter = document.getElementById('budgetFilter');
    
    console.log('Setting up filters...');
    console.log('Elements found:', {
        searchInput: !!searchInput,
        propertyTypeFilter: !!propertyTypeFilter,
        budgetFilter: !!budgetFilter
    });
    
    function applyFilters() {
        const searchTerm = searchInput.value.toLowerCase();
        const propertyType = propertyTypeFilter.value;
        const budgetRange = budgetFilter.value;
        
        console.log('Applying filters:', { searchTerm, propertyType, budgetRange });
        console.log('Total PGs before filter:', allPGs.length);
        
        if (propertyType) {
            console.log('Available property types:', allPGs.map(pg => pg.property_type));
        }
        
        filteredPGs = allPGs.filter(pg => {
            // Search filter
            const matchesSearch = !searchTerm || 
                pg.title.toLowerCase().includes(searchTerm) ||
                pg.location.toLowerCase().includes(searchTerm) ||
                pg.area.toLowerCase().includes(searchTerm);
            
            // Property type filter
            const matchesPropertyType = !propertyType || pg.property_type === propertyType;
            
            // Budget filter
            let matchesBudget = true;
            if (budgetRange) {
                const [min, max] = budgetRange.split('-').map(Number);
                const rent = parseInt(pg.rent_amount);
                matchesBudget = rent >= min && rent <= max;
            }
            
            if (propertyType) {
                console.log(`PG: ${pg.title}, Type: ${pg.property_type}, Matches: ${matchesPropertyType}`);
            }
            
            return matchesSearch && matchesPropertyType && matchesBudget;
        });
        
        console.log('Filtered PGs:', filteredPGs.length);
        displayPGs(filteredPGs);
    }
    
    searchInput.addEventListener('input', applyFilters);
    propertyTypeFilter.addEventListener('change', applyFilters);
    budgetFilter.addEventListener('change', applyFilters);
}

// Image slider functions
function slideNext(button) {
    const container = button.closest('.relative');
    const images = container.querySelectorAll('.image-slide');
    let currentIndex = Array.from(images).findIndex(img => !img.classList.contains('hidden'));
    
    images[currentIndex].classList.add('hidden');
    currentIndex = (currentIndex + 1) % images.length;
    images[currentIndex].classList.remove('hidden');
}

function slidePrev(button) {
    const container = button.closest('.relative');
    const images = container.querySelectorAll('.image-slide');
    let currentIndex = Array.from(images).findIndex(img => !img.classList.contains('hidden'));
    
    images[currentIndex].classList.add('hidden');
    currentIndex = currentIndex === 0 ? images.length - 1 : currentIndex - 1;
    images[currentIndex].classList.remove('hidden');
}

// Rental functionality
async function rentPG(pgId) {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Please login to rent a PG');
        window.location.href = 'index.html';
        return;
    }

    // Check if already rented
    try {
        const statusResponse = await fetch(`http://localhost:3000/api/pgs/${pgId}/rental-status`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (statusResponse.ok) {
            const status = await statusResponse.json();
            if (status.isRented) {
                alert('You are already renting this PG!');
                return;
            }
        }
    } catch (error) {
        console.error('Error checking rental status:', error);
    }

    // Show rental form modal
    showRentalModal(pgId);
}

function showRentalModal(pgId) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
        <div class="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 class="text-xl font-bold mb-4">Rent PG</h3>
            <form id="rentalForm">
                <div class="mb-4">
                    <label class="block text-sm font-medium mb-2">Rental Type</label>
                    <select name="rental_type" class="w-full p-2 border rounded" required>
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                        <option value="semester">Semester</option>
                    </select>
                </div>
                
                <div class="mb-4">
                    <label class="block text-sm font-medium mb-2">Start Date</label>
                    <input type="date" name="start_date" class="w-full p-2 border rounded" required>
                </div>
                
                <div class="mb-4">
                    <label class="block text-sm font-medium mb-2">End Date (Optional)</label>
                    <input type="date" name="end_date" class="w-full p-2 border rounded">
                </div>
                
                <div class="mb-4">
                    <label class="block text-sm font-medium mb-2">Emergency Contact Name</label>
                    <input type="text" name="emergency_contact_name" class="w-full p-2 border rounded" required>
                </div>
                
                <div class="mb-4">
                    <label class="block text-sm font-medium mb-2">Emergency Contact Phone</label>
                    <input type="tel" name="emergency_contact_phone" class="w-full p-2 border rounded" required>
                </div>
                
                <div class="mb-4">
                    <label class="block text-sm font-medium mb-2">Occupation</label>
                    <input type="text" name="occupation" class="w-full p-2 border rounded" placeholder="Student/Working Professional">
                </div>
                
                <div class="mb-4">
                    <label class="block text-sm font-medium mb-2">Company/College Name</label>
                    <input type="text" name="company_name" class="w-full p-2 border rounded">
                </div>
                
                <div class="mb-4">
                    <label class="block text-sm font-medium mb-2">Monthly Income (₹)</label>
                    <input type="number" name="monthly_income" class="w-full p-2 border rounded">
                </div>
                
                <div class="mb-4">
                    <label class="block text-sm font-medium mb-2">ID Proof Type</label>
                    <select name="id_proof_type" class="w-full p-2 border rounded">
                        <option value="">Select ID Proof</option>
                        <option value="aadhar">Aadhar Card</option>
                        <option value="pan">PAN Card</option>
                        <option value="passport">Passport</option>
                        <option value="driving_license">Driving License</option>
                        <option value="college_id">College ID</option>
                    </select>
                </div>
                
                <div class="mb-4">
                    <label class="block text-sm font-medium mb-2">ID Proof Number</label>
                    <input type="text" name="id_proof_number" class="w-full p-2 border rounded">
                </div>
                
                <div class="mb-4">
                    <label class="block text-sm font-medium mb-2">Local Guardian Name</label>
                    <input type="text" name="local_guardian_name" class="w-full p-2 border rounded">
                </div>
                
                <div class="mb-4">
                    <label class="block text-sm font-medium mb-2">Local Guardian Phone</label>
                    <input type="tel" name="local_guardian_phone" class="w-full p-2 border rounded">
                </div>
                
                <div class="mb-4">
                    <label class="block text-sm font-medium mb-2">Special Requirements</label>
                    <textarea name="special_requirements" class="w-full p-2 border rounded" rows="3" placeholder="Any special requirements or notes..."></textarea>
                </div>
                
                <div class="flex gap-3">
                    <button type="button" onclick="closeRentalModal()" class="flex-1 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">
                        Cancel
                    </button>
                    <button type="submit" class="flex-1 bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700">
                        Submit Application
                    </button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Handle form submission
    document.getElementById('rentalForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await submitRentalApplication(pgId, new FormData(e.target));
    });
}

function closeRentalModal() {
    const modal = document.querySelector('.fixed.inset-0');
    if (modal) {
        modal.remove();
    }
}

async function submitRentalApplication(pgId, formData) {
    const token = localStorage.getItem('token');
    
    try {
        const rentalData = {};
        for (let [key, value] of formData.entries()) {
            if (value.trim()) {
                rentalData[key] = value;
            }
        }
        
        const response = await fetch(`http://localhost:3000/api/pgs/${pgId}/rent`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(rentalData)
        });

        const result = await response.json();

        if (response.ok) {
            alert('Rental application submitted successfully!');
            closeRentalModal();
        } else {
            alert(result.message || 'Error submitting rental application');
        }
    } catch (error) {
        console.error('Error submitting rental application:', error);
        alert('Error submitting rental application');
    }
}