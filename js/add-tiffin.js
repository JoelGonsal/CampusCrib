// Add Tiffin functionality
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    if (!isLoggedIn()) {
        window.location.href = 'login.html';
        return;
    }
    
    updateAuthUI();
    
    // Handle form submission
    const addTiffinForm = document.getElementById('addTiffinForm');
    addTiffinForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Get menu items
        const menuItemInputs = document.querySelectorAll('.menu-item');
        const menuItems = Array.from(menuItemInputs)
            .map(input => input.value.trim())
            .filter(item => item !== '');
        
        // Get delivery areas
        const deliveryAreaInputs = document.querySelectorAll('.delivery-area');
        const deliveryAreas = Array.from(deliveryAreaInputs)
            .map(input => input.value.trim())
            .filter(area => area !== '');
        
        // Get form data
        const formData = {
            service_name: document.getElementById('serviceName').value,
            meal_type: document.getElementById('mealType').value,
            location: document.getElementById('location').value,
            area: document.getElementById('area').value,
            price_per_meal: parseFloat(document.getElementById('pricePerMeal').value),
            cuisine_type: document.getElementById('cuisineType').value,
            delivery_time: document.getElementById('deliveryTime').value,
            description: document.getElementById('description').value,
            contact_number: document.getElementById('contactNumber').value,
            whatsapp_number: document.getElementById('whatsappNumber').value,
            menu_items: menuItems,
            delivery_areas: deliveryAreas
        };
        
        try {
            const result = await apiCall('/tiffins', {
                method: 'POST',
                body: JSON.stringify(formData)
            });
            
            if (result.success) {
                showMessage('Tiffin service posted successfully! Redirecting to dashboard...', false);
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 2000);
            } else {
                showMessage(result.data.message || 'Failed to post tiffin service', true);
            }
        } catch (error) {
            console.error('Error posting tiffin service:', error);
            showMessage('Network error. Please try again.', true);
        }
    });
});

function addMenuItem() {
    const container = document.getElementById('menuItemsContainer');
    const newInput = document.createElement('input');
    newInput.type = 'text';
    newInput.className = 'menu-item w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500';
    newInput.placeholder = 'e.g., Another menu item';
    container.appendChild(newInput);
}

function addDeliveryArea() {
    const container = document.getElementById('deliveryAreasContainer');
    const newInput = document.createElement('input');
    newInput.type = 'text';
    newInput.className = 'delivery-area w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500';
    newInput.placeholder = 'e.g., Another delivery area';
    container.appendChild(newInput);
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