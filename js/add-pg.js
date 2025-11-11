// Add PG functionality
let selectedImages = [];

document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    if (!isLoggedIn()) {
        window.location.href = 'login.html';
        return;
    }
    
    updateAuthUI();
    
    // Handle form submission
    const addPGForm = document.getElementById('addPGForm');
    addPGForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Create FormData for file upload
        const formData = new FormData();
        
        // Add text fields
        formData.append('title', document.getElementById('title').value);
        formData.append('property_type', document.getElementById('propertyType').value);
        formData.append('location', document.getElementById('location').value);
        formData.append('area', document.getElementById('area').value);
        formData.append('rent_amount', parseFloat(document.getElementById('rentAmount').value));
        formData.append('sharing_type', document.getElementById('sharingType').value);
        formData.append('gender_preference', document.getElementById('genderPreference').value);
        formData.append('description', document.getElementById('description').value);
        formData.append('contact_number', document.getElementById('contactNumber').value);
        formData.append('whatsapp_number', document.getElementById('whatsappNumber').value);
        formData.append('distance_from_college', document.getElementById('distanceFromCollege').value);
        formData.append('available_from', document.getElementById('availableFrom').value || '');
        
        // Get selected amenities
        const amenityCheckboxes = document.querySelectorAll('.amenity-checkbox:checked');
        const amenities = Array.from(amenityCheckboxes).map(cb => cb.value);
        formData.append('amenities', JSON.stringify(amenities));
        
        // Add images
        selectedImages.forEach(file => {
            formData.append('images', file);
        });
        
        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            if (!token) {
                showMessage('Authentication required. Please login again.', true);
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
                return;
            }
            
            const response = await fetch('http://localhost:3000/api/pgs', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });
            
            const result = await response.json();
            
            if (response.ok) {
                showMessage('PG listing posted successfully! Redirecting to dashboard...', false);
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 2000);
            } else {
                console.error('Server response:', result);
                if (response.status === 401 || response.status === 403) {
                    showMessage('Authentication failed. Please login again.', true);
                    setTimeout(() => {
                        localStorage.removeItem('authToken');
                        localStorage.removeItem('token');
                        localStorage.removeItem('userData');
                        window.location.href = 'login.html';
                    }, 2000);
                } else {
                    showMessage(result.message || 'Failed to post PG listing', true);
                }
            }
        } catch (error) {
            console.error('Error posting PG:', error);
            showMessage('Network error. Please try again.', true);
        }
    });
});

function handleImageUpload(event) {
    const files = Array.from(event.target.files);
    const maxFiles = 5;
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    // Validate file count
    if (selectedImages.length + files.length > maxFiles) {
        showMessage(`You can only upload up to ${maxFiles} images`, true);
        return;
    }
    
    // Validate each file
    for (let file of files) {
        if (file.size > maxSize) {
            showMessage(`File ${file.name} is too large. Maximum size is 5MB`, true);
            return;
        }
        
        if (!file.type.startsWith('image/')) {
            showMessage(`File ${file.name} is not an image`, true);
            return;
        }
    }
    
    // Add files to selected images
    selectedImages.push(...files);
    updateImagePreview();
}

function updateImagePreview() {
    const previewContainer = document.getElementById('imagePreview');
    const uploadArea = document.getElementById('uploadArea');
    
    if (selectedImages.length === 0) {
        previewContainer.classList.add('hidden');
        uploadArea.classList.remove('hidden');
        return;
    }
    
    previewContainer.classList.remove('hidden');
    uploadArea.classList.add('hidden');
    
    previewContainer.innerHTML = selectedImages.map((file, index) => {
        const url = URL.createObjectURL(file);
        return `
            <div class="relative">
                <img src="${url}" alt="Preview ${index + 1}" class="w-full h-24 object-cover rounded-lg">
                <button type="button" onclick="removeImage(${index})" 
                        class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600">
                    ×
                </button>
                <p class="text-xs text-gray-500 mt-1 truncate">${file.name}</p>
            </div>
        `;
    }).join('');
    
    // Add "Add more" button if under limit
    if (selectedImages.length < 5) {
        previewContainer.innerHTML += `
            <div class="border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 transition-colors"
                 onclick="document.getElementById('imageUpload').click()">
                <svg class="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                </svg>
                <span class="text-xs text-gray-500">Add more</span>
            </div>
        `;
    }
}

function removeImage(index) {
    selectedImages.splice(index, 1);
    updateImagePreview();
    
    // Reset file input
    document.getElementById('imageUpload').value = '';
}

function showMessage(message, isError = false) {
    const messageDiv = document.getElementById('message');
    if (messageDiv) {
        messageDiv.textContent = message;
        messageDiv.className = `mt-4 p-3 rounded ${isError ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`;
        messageDiv.classList.remove('hidden');
        
        setTimeout(() => {
            messageDiv.classList.add('hidden');
        }, 5000);
    }
}