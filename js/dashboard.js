// Dashboard functionality
document.addEventListener('DOMContentLoaded', async function() {
    if (!isLoggedIn()) {
        window.location.href = 'login.html';
        return;
    }

    // Test server connection
    try {
        const testResult = await fetch('http://localhost:3000/api/pgs');
        console.log('Server connection test:', testResult.status);
    } catch (error) {
        console.error('Server connection failed:', error);
        showMessage('Cannot connect to server. Please make sure the backend is running.', true);
    }

    await loadUserListings();
});

async function loadUserListings() {
    const listingsContainer = document.getElementById('userListings');
    
    try {
        const result = await apiCall('/user/listings');
        
        if (result.success) {
            const { pgs, tiffins, roommates } = result.data;
            
            let html = '';
            
            if (pgs.length > 0) {
                html += '<h4 class="font-semibold text-lg mb-2">Your PG Listings</h4>';
                pgs.forEach(pg => {
                    html += `
                        <div id="pg-${pg.id}" class="border-l-4 border-blue-500 pl-4 mb-4 bg-gray-50 p-3 rounded-r-lg">
                            <div class="flex justify-between items-start">
                                <div class="flex-1">
                                    <div class="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                                        <div>
                                            <label class="text-xs text-gray-500">Title</label>
                                            <p class="font-medium editable" data-field="title" data-type="pg" data-id="${pg.id}">${pg.title}</p>
                                        </div>
                                        <div>
                                            <label class="text-xs text-gray-500">Rent Amount</label>
                                            <p class="text-sm editable" data-field="rent_amount" data-type="pg" data-id="${pg.id}">₹${pg.rent_amount}/month</p>
                                        </div>
                                        <div>
                                            <label class="text-xs text-gray-500">Location</label>
                                            <p class="text-sm editable" data-field="location" data-type="pg" data-id="${pg.id}">${pg.location}</p>
                                        </div>
                                        <div>
                                            <label class="text-xs text-gray-500">Contact</label>
                                            <p class="text-sm editable" data-field="contact_number" data-type="pg" data-id="${pg.id}">${pg.contact_number}</p>
                                        </div>
                                    </div>
                                    <p class="text-xs text-gray-500">Posted: ${new Date(pg.created_at).toLocaleDateString()}</p>
                                </div>
                                <div class="flex gap-2 ml-4">
                                    <button onclick="toggleEditMode('pg-${pg.id}')" 
                                            class="text-blue-600 hover:text-blue-800 text-sm px-2 py-1 rounded hover:bg-blue-100">
                                        Edit
                                    </button>
                                    <button onclick="deleteListing('pg', ${pg.id}, '${pg.title}')" 
                                            class="text-red-600 hover:text-red-800 text-sm px-2 py-1 rounded hover:bg-red-100">
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
                });
            }
            
            if (tiffins.length > 0) {
                html += '<h4 class="font-semibold text-lg mb-2 mt-6">Your Tiffin Services</h4>';
                tiffins.forEach(tiffin => {
                    html += `
                        <div id="tiffin-${tiffin.id}" class="border-l-4 border-green-500 pl-4 mb-4 bg-gray-50 p-3 rounded-r-lg">
                            <div class="flex justify-between items-start">
                                <div class="flex-1">
                                    <div class="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                                        <div>
                                            <label class="text-xs text-gray-500">Service Name</label>
                                            <p class="font-medium editable" data-field="service_name" data-type="tiffin" data-id="${tiffin.id}">${tiffin.service_name}</p>
                                        </div>
                                        <div>
                                            <label class="text-xs text-gray-500">Price per Meal</label>
                                            <p class="text-sm editable" data-field="price_per_meal" data-type="tiffin" data-id="${tiffin.id}">₹${tiffin.price_per_meal}/meal</p>
                                        </div>
                                        <div>
                                            <label class="text-xs text-gray-500">Location</label>
                                            <p class="text-sm editable" data-field="location" data-type="tiffin" data-id="${tiffin.id}">${tiffin.location}</p>
                                        </div>
                                        <div>
                                            <label class="text-xs text-gray-500">Contact</label>
                                            <p class="text-sm editable" data-field="contact_number" data-type="tiffin" data-id="${tiffin.id}">${tiffin.contact_number}</p>
                                        </div>
                                    </div>
                                    <p class="text-xs text-gray-500">Posted: ${new Date(tiffin.created_at).toLocaleDateString()}</p>
                                </div>
                                <div class="flex gap-2 ml-4">
                                    <button onclick="viewSubscribers(${tiffin.id}, '${tiffin.service_name}')" 
                                            class="text-purple-600 hover:text-purple-800 text-sm px-2 py-1 rounded hover:bg-purple-100">
                                        Subscribers
                                    </button>
                                    <button onclick="toggleEditMode('tiffin-${tiffin.id}')" 
                                            class="text-blue-600 hover:text-blue-800 text-sm px-2 py-1 rounded hover:bg-blue-100">
                                        Edit
                                    </button>
                                    <button onclick="deleteListing('tiffin', ${tiffin.id}, '${tiffin.service_name}')" 
                                            class="text-red-600 hover:text-red-800 text-sm px-2 py-1 rounded hover:bg-red-100">
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
                });
            }
            
            if (roommates.length > 0) {
                html += '<h4 class="font-semibold text-lg mb-2 mt-6">Your Roommate Requests</h4>';
                roommates.forEach(roommate => {
                    html += `
                        <div id="roommate-${roommate.id}" class="border-l-4 border-purple-500 pl-4 mb-4 bg-gray-50 p-3 rounded-r-lg">
                            <div class="flex justify-between items-start">
                                <div class="flex-1">
                                    <div class="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                                        <div>
                                            <label class="text-xs text-gray-500">Looking For</label>
                                            <p class="font-medium editable" data-field="looking_for_gender" data-type="roommate" data-id="${roommate.id}">Looking for ${roommate.looking_for_gender} roommate</p>
                                        </div>
                                        <div>
                                            <label class="text-xs text-gray-500">Budget</label>
                                            <p class="text-sm editable" data-field="budget_max" data-type="roommate" data-id="${roommate.id}">₹${roommate.budget_max} max</p>
                                        </div>
                                        <div>
                                            <label class="text-xs text-gray-500">Preferred Location</label>
                                            <p class="text-sm editable" data-field="preferred_location" data-type="roommate" data-id="${roommate.id}">${roommate.preferred_location}</p>
                                        </div>
                                        <div>
                                            <label class="text-xs text-gray-500">Contact</label>
                                            <p class="text-sm editable" data-field="contact_number" data-type="roommate" data-id="${roommate.id}">${roommate.contact_number}</p>
                                        </div>
                                    </div>
                                    <p class="text-xs text-gray-500">Posted: ${new Date(roommate.created_at).toLocaleDateString()}</p>
                                </div>
                                <div class="flex gap-2 ml-4">
                                    <button onclick="toggleEditMode('roommate-${roommate.id}')" 
                                            class="text-blue-600 hover:text-blue-800 text-sm px-2 py-1 rounded hover:bg-blue-100">
                                        Edit
                                    </button>
                                    <button onclick="deleteListing('roommate', ${roommate.id}, 'Roommate Request')" 
                                            class="text-red-600 hover:text-red-800 text-sm px-2 py-1 rounded hover:bg-red-100">
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
                });
            }
            
            if (html === '') {
                html = '<p class="text-gray-600">No listings yet. Start by posting your first listing!</p>';
            }
            
            listingsContainer.innerHTML = html;
        } else {
            listingsContainer.innerHTML = '<p class="text-red-600">Failed to load listings.</p>';
        }
    } catch (error) {
        console.error('Error loading listings:', error);
        listingsContainer.innerHTML = '<p class="text-red-600">Error loading listings.</p>';
    }
}

function deleteListing(type, id, title) {
    const modal = document.getElementById('deleteModal');
    const message = document.getElementById('deleteMessage');
    const confirmBtn = document.getElementById('confirmDeleteBtn');
    
    message.textContent = `Are you sure you want to delete "${title}"? This action cannot be undone.`;
    modal.classList.remove('hidden');
    
    // Remove any existing event listeners
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
    
    // Add new event listener
    newConfirmBtn.addEventListener('click', async () => {
        newConfirmBtn.disabled = true;
        newConfirmBtn.textContent = 'Deleting...';
        newConfirmBtn.classList.add('opacity-50');
        
        await performDelete(type, id);
        closeDeleteModal();
        
        // Reset button state
        newConfirmBtn.disabled = false;
        newConfirmBtn.textContent = 'Delete';
        newConfirmBtn.classList.remove('opacity-50');
    });
}

async function performDelete(type, id) {
    try {
        let endpoint;
        switch(type) {
            case 'pg':
                endpoint = `/pgs/${id}`;
                break;
            case 'tiffin':
                endpoint = `/tiffins/${id}`;
                break;
            case 'roommate':
                endpoint = `/roommates/${id}`;
                break;
            default:
                throw new Error('Invalid listing type');
        }
        
        const result = await apiCall(endpoint, {
            method: 'DELETE'
        });
        
        if (result.success) {
            showMessage('Listing deleted successfully!', false);
            // Reload listings
            await loadUserListings();
        } else {
            showMessage(result.data.message || 'Failed to delete listing', true);
        }
    } catch (error) {
        console.error('Error deleting listing:', error);
        showMessage('Network error. Please try again.', true);
    }
}

function closeDeleteModal() {
    const modal = document.getElementById('deleteModal');
    modal.classList.add('hidden');
}



function toggleEditMode(containerId) {
    const container = document.getElementById(containerId);
    const editables = container.querySelectorAll('.editable');
    const editBtn = container.querySelector('button[onclick*="toggleEditMode"]');
    
    const isEditing = container.classList.contains('editing');
    
    if (isEditing) {
        // Save changes
        saveChanges(container, editables, editBtn);
    } else {
        // Enter edit mode
        enterEditMode(container, editables, editBtn);
    }
}

function enterEditMode(container, editables, editBtn) {
    container.classList.add('editing');
    editBtn.textContent = 'Save';
    editBtn.classList.remove('text-blue-600', 'hover:text-blue-800');
    editBtn.classList.add('text-green-600', 'hover:text-green-800');
    
    editables.forEach(element => {
        const field = element.dataset.field;
        let currentValue = element.textContent;
        
        // Extract numeric values for price fields
        if (field.includes('amount') || field.includes('price') || field.includes('budget')) {
            currentValue = currentValue.replace(/[₹,/month/meal/max]/g, '').trim();
        }
        
        // Create input based on field type
        let input;
        if (field === 'looking_for_gender') {
            input = document.createElement('select');
            input.innerHTML = `
                <option value="male" ${currentValue.includes('male') && !currentValue.includes('female') ? 'selected' : ''}>Male</option>
                <option value="female" ${currentValue.includes('female') ? 'selected' : ''}>Female</option>
                <option value="any" ${currentValue.includes('any') ? 'selected' : ''}>Any</option>
            `;
        } else if (field.includes('amount') || field.includes('price') || field.includes('budget')) {
            input = document.createElement('input');
            input.type = 'number';
            input.value = currentValue;
        } else {
            input = document.createElement('input');
            input.type = 'text';
            input.value = currentValue;
        }
        
        input.className = 'w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-400';
        input.dataset.originalValue = element.textContent;
        
        element.style.display = 'none';
        element.parentNode.insertBefore(input, element.nextSibling);
    });
}

async function saveChanges(container, editables, editBtn) {
    const updates = {};
    const type = editables[0].dataset.type;
    const id = editables[0].dataset.id;
    
    // Collect changes
    editables.forEach(element => {
        const input = element.nextSibling;
        const field = element.dataset.field;
        let newValue = input.value.trim();
        
        // Format the display value
        if (field === 'looking_for_gender') {
            element.textContent = `Looking for ${newValue} roommate`;
            updates[field] = newValue;
        } else if (field === 'rent_amount') {
            element.textContent = `₹${newValue}/month`;
            updates[field] = parseFloat(newValue);
        } else if (field === 'price_per_meal') {
            element.textContent = `₹${newValue}/meal`;
            updates[field] = parseFloat(newValue);
        } else if (field === 'budget_max') {
            element.textContent = `₹${newValue} max`;
            updates[field] = parseFloat(newValue);
        } else {
            element.textContent = newValue;
            updates[field] = newValue;
        }
        
        element.style.display = 'block';
        input.remove();
    });
    
    // Save to server
    try {
        editBtn.disabled = true;
        editBtn.textContent = 'Saving...';
        
        let endpoint;
        switch(type) {
            case 'pg':
                endpoint = `/pgs/${id}`;
                break;
            case 'tiffin':
                endpoint = `/tiffins/${id}`;
                break;
            case 'roommate':
                endpoint = `/roommates/${id}`;
                break;
        }
        
        console.log('Saving changes:', { endpoint, updates, type, id });
        
        const result = await apiCall(endpoint, {
            method: 'PATCH',
            body: JSON.stringify(updates)
        });
        
        console.log('API result:', result);
        
        if (result && result.success) {
            showMessage('Changes saved successfully!', false);
        } else {
            const errorMessage = result?.data?.message || result?.error || 'Failed to save changes';
            showMessage(errorMessage, true);
            console.error('Save failed:', result);
            // Revert changes on error
            await loadUserListings();
            return;
        }
    } catch (error) {
        console.error('Error saving changes:', error);
        showMessage(`Network error: ${error.message}`, true);
        // Revert changes on error
        await loadUserListings();
        return;
    }
    
    // Reset edit mode
    container.classList.remove('editing');
    editBtn.textContent = 'Edit';
    editBtn.classList.remove('text-green-600', 'hover:text-green-800');
    editBtn.classList.add('text-blue-600', 'hover:text-blue-800');
    editBtn.disabled = false;
}

async function viewSubscribers(tiffinId, serviceName) {
    try {
        const result = await apiCall(`/tiffins/${tiffinId}/subscribers`);
        
        if (result.success) {
            const subscribers = result.data;
            showSubscribersModal(serviceName, subscribers);
        } else {
            showMessage(result.data.message || 'Failed to load subscribers', true);
        }
    } catch (error) {
        console.error('Error loading subscribers:', error);
        showMessage('Network error. Please try again.', true);
    }
}

function showSubscribersModal(serviceName, subscribers) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    
    let subscribersHtml = '';
    if (subscribers.length === 0) {
        subscribersHtml = '<p class="text-gray-500 text-center py-8">No subscribers yet</p>';
    } else {
        subscribersHtml = subscribers.map(sub => `
            <div class="border border-gray-200 rounded-lg p-4 mb-3">
                <div class="flex justify-between items-start mb-2">
                    <div>
                        <h4 class="font-semibold text-gray-800">${sub.full_name}</h4>
                        <p class="text-sm text-gray-600">${sub.email}</p>
                        <p class="text-sm text-gray-600">📞 ${sub.phone}</p>
                    </div>
                    <span class="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                        ${sub.subscription_type}
                    </span>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <div>
                        <span class="text-gray-500">Start Date:</span>
                        <span class="ml-1">${new Date(sub.start_date).toLocaleDateString()}</span>
                    </div>
                    ${sub.end_date ? `
                        <div>
                            <span class="text-gray-500">End Date:</span>
                            <span class="ml-1">${new Date(sub.end_date).toLocaleDateString()}</span>
                        </div>
                    ` : ''}
                    <div class="md:col-span-2">
                        <span class="text-gray-500">Delivery Address:</span>
                        <p class="ml-1 text-gray-700">${sub.delivery_address}</p>
                    </div>
                    ${sub.special_instructions ? `
                        <div class="md:col-span-2">
                            <span class="text-gray-500">Special Instructions:</span>
                            <p class="ml-1 text-gray-700">${sub.special_instructions}</p>
                        </div>
                    ` : ''}
                </div>
                
                <div class="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center">
                    <span class="text-xs text-gray-500">
                        Subscribed: ${new Date(sub.created_at).toLocaleDateString()}
                    </span>
                    <a href="https://wa.me/${sub.phone}?text=Hi%20${encodeURIComponent(sub.full_name)}%2C%20this%20is%20regarding%20your%20tiffin%20subscription%20for%20${encodeURIComponent(serviceName)}" 
                       target="_blank"
                       class="text-green-600 hover:text-green-800 text-sm font-medium">
                        💬 WhatsApp
                    </a>
                </div>
            </div>
        `).join('');
    }
    
    modal.innerHTML = `
        <div class="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-xl font-bold">Subscribers for "${serviceName}"</h3>
                <button onclick="closeSubscribersModal()" class="text-gray-500 hover:text-gray-700">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
            
            <div class="mb-4">
                <p class="text-sm text-gray-600">Total Subscribers: <span class="font-semibold">${subscribers.length}</span></p>
            </div>
            
            <div class="max-h-96 overflow-y-auto">
                ${subscribersHtml}
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function closeSubscribersModal() {
    const modal = document.querySelector('.fixed.inset-0.bg-black');
    if (modal) {
        modal.remove();
    }
}

function showMessage(message, isError = false) {
    // Create a temporary message element
    const messageDiv = document.createElement('div');
    messageDiv.textContent = message;
    messageDiv.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
        isError ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
    }`;
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.remove();
    }, 3000);
}