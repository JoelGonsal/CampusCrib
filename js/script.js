// ---------- Image Slider Logic ----------
function slideNext(button) {
  const slides = button.closest('.relative').querySelectorAll('.image-slide');
  if (slides.length <= 1) return;
  
  const current = [...slides].findIndex(slide => !slide.classList.contains('hidden'));
  slides[current].classList.add('hidden');
  slides[(current + 1) % slides.length].classList.remove('hidden');
}

function slidePrev(button) {
  const slides = button.closest('.relative').querySelectorAll('.image-slide');
  if (slides.length <= 1) return;
  
  const current = [...slides].findIndex(slide => !slide.classList.contains('hidden'));
  slides[current].classList.add('hidden');
  slides[(current - 1 + slides.length) % slides.length].classList.remove('hidden');
}

// ---------- Tiffin Menu Modal Logic ----------
function showMenu(imageSrc) {
  const menuImage = document.getElementById('menuImage');
  const menuModal = document.getElementById('menuModal');

  if (menuImage && menuModal) {
    menuImage.src = imageSrc;
    menuModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
  }
}

function closeMenu() {
  const menuModal = document.getElementById('menuModal');
  if (menuModal) {
    menuModal.classList.add('hidden');
    document.getElementById('menuImage').src = ""; // Clear src on close
    document.body.style.overflow = 'auto'; // Restore scrolling
  }
}

// ---------- Navbar Shadow on Scroll ----------
window.addEventListener('scroll', () => {
  const navbar = document.getElementById('navbar');
  if (navbar) {
    if (window.scrollY > 20) {
      navbar.classList.add('shadow-lg', 'bg-opacity-90');
    } else {
      navbar.classList.remove('shadow-lg', 'bg-opacity-90');
    }
  }
});

// ---------- Smooth Scrolling for Anchor Links ----------
document.addEventListener('DOMContentLoaded', function() {
  const links = document.querySelectorAll('a[href^="#"]');
  links.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
});

// ---------- Close Modal on Outside Click ----------
document.addEventListener('click', function(e) {
  const menuModal = document.getElementById('menuModal');
  if (menuModal && e.target === menuModal) {
    closeMenu();
  }
});

// ---------- Escape Key to Close Modal ----------
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    closeMenu();
  }
});

// ---------- Loading Animation ----------
function showLoading(elementId) {
  const element = document.getElementById(elementId);
  if (element) {
    element.innerHTML = `
      <div class="flex items-center justify-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span class="ml-2 text-gray-600">Loading...</span>
      </div>
    `;
  }
}

// ---------- Error Display ----------
function showError(elementId, message) {
  const element = document.getElementById(elementId);
  if (element) {
    element.innerHTML = `
      <div class="text-center py-8">
        <div class="text-red-500 text-4xl mb-2">⚠️</div>
        <p class="text-red-600 font-medium">${message}</p>
        <button onclick="location.reload()" class="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Try Again
        </button>
      </div>
    `;
  }
}

// ---------- Format Currency ----------
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

// ---------- Format Date ----------
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

// ---------- Debounce Function for Search ----------
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
