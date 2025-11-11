// Add Roommate functionality
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    if (!isLoggedIn()) {
        window.location.href = 'login.html';
        return;
    }
    
    updateAuthUI();
    
    // Handle form submission
    const addRoommateForm = document.getElementById('addRoommateForm');
    addRoommateForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Get selected lifestyle preferences
        const lifestyleCheckboxes = document.querySelectorAll('.lifestyle-checkbox:checked');
        const lifestylePreferences = Array.from(lifestyleCheckboxes).map(cb => cb.value);
        
        // Get form data
        const formData = {
            looking_for_gender: document.getElementById('lookingForGender').value,
            preferred_location: document.getElementById('preferredLocation').value,
            budget_min: document.getElementById('budgetMin').value ? parseFloat(document.getElementById('budgetMin').value) : null,
            budget_max: parseFloat(document.getElementById('budgetMax').value),
            sharing_preference: document.getElementById('sharingPreference').value,
            about_me: document.getElementById('aboutMe').value,
            contact_number: document.getElementById('contactNumber').value,
            whatsapp_number: document.getElementById('whatsappNumber').value,
            lifestyle_preferences: lifestylePreferences
        };
        
        try {
            const result = await apiCall('/roommates', {
                method: 'POST',
                body: JSON.stringify(formData)
            });
            
            if (result.success) {
                showMessage('Roommate request posted successfully! Redirecting to dashboard...', false);
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 2000);
            } else {
                showMessage(result.data.message || 'Failed to post roommate request', true);
            }
        } catch (error) {
            console.error('Error posting roommate request:', error);
            showMessage('Network error. Please try again.', true);
        }
    });
});

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