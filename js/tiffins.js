// Tiffins page functionality
let allTiffins = [];
let filteredTiffins = [];

document.addEventListener('DOMContentLoaded', async function() {
    updateAuthUI();
    await loadTiffins();
    setupFilters();
});

async function loadTiffins() {
    const loadingState = document.getElementById('loadingState');
    const tiffinListings = document.getElementById('tiffinListings');
    const noResults = document.getElementById('noResults');
    
    try {
        const result = await apiCall('/tiffins');
        
        if (result && result.success) {
            allTiffins = result.data;
            filteredTiffins = [...allTiffins];
            
            loadingState.classList.add('hidden');
            
            if (allTiffins.length === 0) {
                noResults.classList.remove('hidden');
            } else {
                displayTiffins(filteredTiffins);
                tiffinListings.classList.remove('hidden');
                // Check subscription status after displaying tiffins
                setTimeout(() => checkSubscriptionStatus(), 500);
            }
        } else {
            throw new Error('Failed to load tiffin services');
        }
    } catch (error) {
        console.error('Error loading tiffins:', error);
        loadingState.innerHTML = `
            <div class="text-red-500 text-center py-8">
                <div class="text-6xl mb-4">⚠️</div>
                <h3 class="text-2xl font-bold mb-2">Failed to Load Tiffin Services</h3>
                <p class="text-lg">Please check your connection and try again.</p>
                <button onclick="location.reload()" class="mt-4 bg-yellow-600 text-white px-6 py-2 rounded hover:bg-yellow-700">Retry</button>
            </div>
        `;
    }
}

function displayTiffins(tiffins) {
    const tiffinListings = document.getElementById('tiffinListings');
    const noResults = document.getElementById('noResults');
    
    if (tiffins.length === 0) {
        tiffinListings.classList.add('hidden');
        noResults.classList.remove('hidden');
        return;
    }
    
    noResults.classList.add('hidden');
    tiffinListings.classList.remove('hidden');
    
    tiffinListings.innerHTML = tiffins.map(tiffin => {
        const menuItems = tiffin.menu_items ? JSON.parse(tiffin.menu_items) : [];
        const deliveryAreas = tiffin.delivery_areas ? JSON.parse(tiffin.delivery_areas) : [];
        const menuImages = tiffin.menu_images ? JSON.parse(tiffin.menu_images) : [];
        
        const mealTypeColors = {
            'veg': 'bg-green-100 text-green-800',
            'non_veg': 'bg-red-100 text-red-800',
            'both': 'bg-orange-100 text-orange-800'
        };
        
        return `
            <div class="bg-white bg-opacity-95 backdrop-blur-md p-6 rounded-xl shadow-lg hover:shadow-xl transition duration-300 text-left">
                <div class="mb-4">
                    <h3 class="text-xl font-bold text-gray-800 mb-2">${tiffin.service_name}</h3>
                    <div class="flex items-center gap-2 mb-2">
                        <span class="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                            ₹${parseInt(tiffin.price_per_meal)}/meal
                        </span>
                        <span class="${mealTypeColors[tiffin.meal_type] || 'bg-gray-100 text-gray-800'} px-3 py-1 rounded-full text-sm font-medium">
                            ${tiffin.meal_type === 'veg' ? '🥬 Veg' : tiffin.meal_type === 'non_veg' ? '🍗 Non-Veg' : '🍽️ Both'}
                        </span>
                    </div>
                    <p class="text-gray-600 mb-2">📍 ${tiffin.location}, ${tiffin.area}</p>
                    ${tiffin.cuisine_type ? `<p class="text-sm text-gray-500 mb-2">🍛 ${tiffin.cuisine_type}</p>` : ''}
                    ${tiffin.description ? `<p class="text-gray-700 text-sm mb-3">${tiffin.description.substring(0, 100)}${tiffin.description.length > 100 ? '...' : ''}</p>` : ''}
                </div>
                
                ${menuItems.length > 0 ? `
                    <div class="mb-4">
                        <p class="text-sm font-medium text-gray-700 mb-2">Today's Menu:</p>
                        <div class="bg-gray-50 p-3 rounded-lg">
                            <ul class="text-sm text-gray-700 space-y-1">
                                ${menuItems.slice(0, 3).map(item => `<li>• ${item}</li>`).join('')}
                                ${menuItems.length > 3 ? `<li class="text-gray-500">• +${menuItems.length - 3} more items</li>` : ''}
                            </ul>
                        </div>
                    </div>
                ` : ''}
                
                ${deliveryAreas.length > 0 ? `
                    <div class="mb-4">
                        <p class="text-sm font-medium text-gray-700 mb-2">Delivery Areas:</p>
                        <div class="flex flex-wrap gap-1">
                            ${deliveryAreas.slice(0, 3).map(area => `
                                <span class="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">${area}</span>
                            `).join('')}
                            ${deliveryAreas.length > 3 ? `<span class="text-xs text-gray-500">+${deliveryAreas.length - 3} more</span>` : ''}
                        </div>
                    </div>
                ` : ''}
                
                ${tiffin.delivery_time ? `
                    <div class="mb-4">
                        <p class="text-sm text-gray-600">⏰ Delivery Time: ${tiffin.delivery_time}</p>
                    </div>
                ` : ''}
                
                <div class="flex flex-col sm:flex-row gap-3">
                    ${menuImages.length > 0 ? `
                        <button onclick="showMenu('${menuImages[0]}')" 
                                class="flex-1 bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition duration-300 text-sm">
                            📋 View Menu
                        </button>
                    ` : ''}
                    <button onclick="subscribeTo(${tiffin.id})" 
                            id="subscribe-btn-${tiffin.id}"
                            class="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-300 text-sm">
                        📅 Subscribe
                    </button>
                    <a href="https://wa.me/${tiffin.contact_number || tiffin.whatsapp_number || '918827007325'}?text=Hi%2C%20I%20want%20to%20order%20tiffin%20from%20${encodeURIComponent(tiffin.service_name)}%20listed%20on%20CampusCrib." 
                       target="_blank" 
                       class="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition duration-300 text-center text-sm">
                        🍽️ Order Now
                    </a>
                </div>
                
                <div class="mt-3 text-xs text-gray-500 text-center">
                    By ${tiffin.owner_name || 'Chef'} • ${new Date(tiffin.created_at).toLocaleDateString()}
                </div>
            </div>
        `;
    }).join('');
}

function setupFilters() {
    const searchInput = document.getElementById('searchInput');
    const mealTypeFilter = document.getElementById('mealTypeFilter');
    const priceFilter = document.getElementById('priceFilter');
    
    function applyFilters() {
        const searchTerm = searchInput.value.toLowerCase();
        const mealType = mealTypeFilter.value;
        const priceRange = priceFilter.value;
        
        filteredTiffins = allTiffins.filter(tiffin => {
            // Search filter
            const matchesSearch = !searchTerm || 
                tiffin.service_name.toLowerCase().includes(searchTerm) ||
                tiffin.location.toLowerCase().includes(searchTerm) ||
                tiffin.area.toLowerCase().includes(searchTerm) ||
                (tiffin.cuisine_type && tiffin.cuisine_type.toLowerCase().includes(searchTerm));
            
            // Meal type filter
            const matchesMealType = !mealType || tiffin.meal_type === mealType;
            
            // Price filter
            let matchesPrice = true;
            if (priceRange) {
                const [min, max] = priceRange.split('-').map(Number);
                const price = parseInt(tiffin.price_per_meal);
                matchesPrice = price >= min && price <= max;
            }
            
            return matchesSearch && matchesMealType && matchesPrice;
        });
        
        displayTiffins(filteredTiffins);
    }
    
    searchInput.addEventListener('input', applyFilters);
    mealTypeFilter.addEventListener('change', applyFilters);
    priceFilter.addEventListener('change', applyFilters);
}

// Menu modal functions
function showMenu(imageSrc) {
    const menuImage = document.getElementById('menuImage');
    const menuModal = document.getElementById('menuModal');

    if (menuImage && menuModal) {
        menuImage.src = imageSrc;
        menuModal.classList.remove('hidden');
    }
}

function closeMenu() {
    const menuModal = document.getElementById('menuModal');
    if (menuModal) {
        menuModal.classList.add('hidden');
        document.getElementById('menuImage').src = "";
    }
}

// Subscription functions
async function subscribeTo(tiffinId) {
    if (!isLoggedIn()) {
        alert('Please login to subscribe to tiffin services');
        window.location.href = 'login.html';
        return;
    }

    // Show subscription modal
    showSubscriptionModal(tiffinId);
}

function showSubscriptionModal(tiffinId) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
        <div class="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 class="text-xl font-bold mb-4">Subscribe to Tiffin Service</h3>
            <form id="subscriptionForm">
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Subscription Type</label>
                    <select id="subscriptionType" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                    </select>
                </div>
                
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                    <input type="date" id="startDate" required 
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                           min="${new Date().toISOString().split('T')[0]}">
                </div>
                
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-2">End Date (Optional)</label>
                    <input type="date" id="endDate" 
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                </div>
                
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Delivery Address</label>
                    <textarea id="deliveryAddress" required rows="3" 
                              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Enter your complete delivery address"></textarea>
                </div>
                
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                    <input type="tel" id="phoneNumber" required 
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                           placeholder="Your contact number">
                </div>
                
                <div class="mb-6">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Special Instructions (Optional)</label>
                    <textarea id="specialInstructions" rows="2" 
                              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Any special dietary requirements or instructions"></textarea>
                </div>
                
                <div class="flex gap-3">
                    <button type="button" onclick="closeSubscriptionModal()" 
                            class="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition">
                        Cancel
                    </button>
                    <button type="submit" 
                            class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                        Subscribe
                    </button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Handle form submission
    document.getElementById('subscriptionForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await submitSubscription(tiffinId);
    });
}

async function submitSubscription(tiffinId) {
    const formData = {
        subscription_type: document.getElementById('subscriptionType').value,
        start_date: document.getElementById('startDate').value,
        end_date: document.getElementById('endDate').value || null,
        delivery_address: document.getElementById('deliveryAddress').value,
        phone_number: document.getElementById('phoneNumber').value,
        special_instructions: document.getElementById('specialInstructions').value || null
    };
    
    try {
        const result = await apiCall(`/tiffins/${tiffinId}/subscribe`, {
            method: 'POST',
            body: JSON.stringify(formData)
        });
        
        if (result.success) {
            alert('Successfully subscribed to tiffin service!');
            closeSubscriptionModal();
            
            // Update button to show subscribed state
            const button = document.getElementById(`subscribe-btn-${tiffinId}`);
            if (button) {
                button.textContent = '✅ Subscribed';
                button.className = 'flex-1 bg-green-600 text-white px-4 py-2 rounded-lg cursor-not-allowed text-sm';
                button.disabled = true;
            }
        } else {
            alert(result.data.message || 'Failed to subscribe');
        }
    } catch (error) {
        console.error('Error subscribing:', error);
        alert('Network error. Please try again.');
    }
}

function closeSubscriptionModal() {
    const modal = document.querySelector('.fixed.inset-0.bg-black');
    if (modal) {
        modal.remove();
    }
}

// Check subscription status for each tiffin when page loads
async function checkSubscriptionStatus() {
    if (!isLoggedIn()) return;
    
    for (const tiffin of allTiffins) {
        try {
            const result = await apiCall(`/tiffins/${tiffin.id}/subscription-status`);
            if (result.success && result.data.isSubscribed) {
                const button = document.getElementById(`subscribe-btn-${tiffin.id}`);
                if (button) {
                    button.textContent = '✅ Subscribed';
                    button.className = 'flex-1 bg-green-600 text-white px-4 py-2 rounded-lg cursor-not-allowed text-sm';
                    button.disabled = true;
                }
            }
        } catch (error) {
            console.error('Error checking subscription status:', error);
        }
    }
}