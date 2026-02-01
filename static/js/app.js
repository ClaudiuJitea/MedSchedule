/**
 * MedSchedule - Doctor Appointment Scheduler
 * A modern, comprehensive JavaScript application for managing doctor appointments
 * 
 * Features:
 * - Global State Management
 * - Theme Management (Light/Dark)
 * - Navigation & Smooth Scrolling
 * - Doctor Directory with Filtering
 * - Favorites System
 * - Appointment Booking & Management
 * - Review System
 * - Toast Notifications
 * - Confetti Effects
 * - Modal System
 * - Date Picker & Time Slots
 * - Email Preview
 */

// ============================================================================
// GLOBAL STATE MANAGEMENT
// ============================================================================

const AppState = {
  currentDoctorId: null,
  currentPatientEmail: localStorage.getItem('patientEmail') || null,
  currentAppointmentId: null,
  currentReviewAppointmentId: null,
  specialties: [],
  doctors: [],
  favorites: new Set(),
  theme: localStorage.getItem('theme') || 'light',
  isLoading: false,
  selectedDate: null,
  selectedTime: null,
  selectedAppointmentType: 'in-person',
  rescheduleCalendarDate: new Date(),
  selectedRescheduleDate: null,
  selectedRescheduleTime: null
};

// Make AppState accessible globally for debugging
globalThis.AppState = AppState;

// ============================================================================
// THEME MANAGEMENT
// ============================================================================

/**
 * Initialize theme on page load
 */
function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  AppState.theme = savedTheme;
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon();
}

/**
 * Toggle between light and dark themes
 */
function toggleTheme() {
  const newTheme = AppState.theme === 'light' ? 'dark' : 'light';
  AppState.theme = newTheme;
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  updateThemeIcon();
  showToast(window.t('toast.theme.switched', { theme: newTheme }), 'info');
}

/**
 * Toggle between languages (English/Romanian)
 */
function toggleLanguage() {
  const currentLang = window.langManager.currentLang;
  const newLang = currentLang === 'en' ? 'ro' : 'en';
  window.langManager.setLanguage(newLang);

  // Update button text
  const btn = document.getElementById('lang-toggle');
  if (btn) btn.textContent = newLang === 'en' ? 'RO' : 'EN';

  showToast(`Language switched to ${newLang.toUpperCase()}`, 'info');
}

/**
 * Update the theme toggle icon
 */
function updateThemeIcon() {
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    const isDark = AppState.theme === 'dark';
    themeToggle.innerHTML = isDark
      ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
           <circle cx="12" cy="12" r="5"/>
           <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
         </svg>`
      : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
           <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
         </svg>`;
  }
}

// ============================================================================
// NAVIGATION
// ============================================================================

/**
 * Initialize navigation with scroll spy and mobile menu
 */
function initNavigation() {
  // Smooth scroll behavior is handled by CSS scroll-behavior: smooth

  // Handle scroll for navbar styling
  window.addEventListener('scroll', debounce(handleScroll, 50));

  // Initialize mobile menu
  initMobileMenu();

  // Initialize nav links
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('href').substring(1);
      scrollToSection(targetId);

      // Update active state
      navLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
    });
  });

}

/**
 * Scroll to a specific section smoothly
 * @param {string} sectionId - The ID of the section to scroll to
 */
function scrollToSection(sectionId) {
  const section = document.getElementById(sectionId);
  if (section) {
    const navHeight = document.querySelector('.navbar').offsetHeight;
    const targetPosition = section.offsetTop - navHeight - 20;
    window.scrollTo({
      top: targetPosition,
      behavior: 'smooth'
    });
  }
}

/**
 * Handle scroll events for navbar styling and scroll spy
 */
function handleScroll() {
  const navbar = document.querySelector('.navbar');
  const scrollY = window.scrollY;

  // Add shadow to navbar when scrolled
  if (scrollY > 10) {
    navbar.style.boxShadow = '0 4px 20px -4px rgba(0, 0, 0, 0.1)';
  } else {
    navbar.style.boxShadow = 'none';
  }

  // Update active nav link based on scroll position
  const sections = ['home', 'doctors', 'appointments'];
  const navHeight = navbar.offsetHeight;

  sections.forEach(sectionId => {
    const section = document.getElementById(sectionId);
    if (section) {
      const rect = section.getBoundingClientRect();
      if (rect.top <= navHeight + 50 && rect.bottom > navHeight + 50) {
        document.querySelectorAll('.nav-link').forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === `#${sectionId}`) {
            link.classList.add('active');
          }
        });
      }
    }
  });
}

/**
 * Initialize mobile menu functionality
 */
function initMobileMenu() {
  // Create mobile menu toggle button if not exists
  let mobileToggle = document.querySelector('.mobile-menu-toggle');
  if (!mobileToggle) {
    mobileToggle = document.createElement('button');
    mobileToggle.className = 'mobile-menu-toggle';
    mobileToggle.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M3 12h18M3 6h18M3 18h18"/>
                              </svg>`;
    document.querySelector('.navbar .container').appendChild(mobileToggle);
  }

  mobileToggle.addEventListener('click', openMobileMenu);
}

/**
 * Open mobile navigation menu
 */
function openMobileMenu() {
  // Create mobile nav overlay if not exists
  let overlay = document.querySelector('.mobile-nav-overlay');
  let drawer = document.querySelector('.mobile-nav-drawer');

  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'mobile-nav-overlay';
    overlay.onclick = closeMobileMenu;
    document.body.appendChild(overlay);
  }

  if (!drawer) {
    drawer = document.createElement('div');
    drawer.className = 'mobile-nav-drawer';
    drawer.innerHTML = `
      <div class="mobile-nav-header">
        <span class="nav-brand">
          <svg class="logo" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
          </svg>
          MedSchedule
        </span>
        <button class="mobile-nav-close" onclick="closeMobileMenu()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      <div class="mobile-nav-links">
        <a href="#home" class="mobile-nav-link" onclick="closeMobileMenu(); scrollToSection('home');">Home</a>
        <a href="#doctors" class="mobile-nav-link" onclick="closeMobileMenu(); scrollToSection('doctors');">Find Doctors</a>
        <a href="#appointments" class="mobile-nav-link" onclick="closeMobileMenu(); scrollToSection('appointments');">My Appointments</a>
      </div>
    `;
    document.body.appendChild(drawer);
  }

  overlay.classList.add('active');
  drawer.classList.add('active');
  document.body.style.overflow = 'hidden';
}

/**
 * Close mobile navigation menu
 */
function closeMobileMenu() {
  const overlay = document.querySelector('.mobile-nav-overlay');
  const drawer = document.querySelector('.mobile-nav-drawer');

  if (overlay) overlay.classList.remove('active');
  if (drawer) drawer.classList.remove('active');
  document.body.style.overflow = '';
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Wrapper for fetch API with error handling and loading states
 * @param {string} endpoint - API endpoint (without leading /)
 * @param {Object} options - Fetch options
 * @returns {Promise<any>} - Response data
 */
async function fetchAPI(endpoint, options = {}) {
  const url = `/api/${endpoint}`;

  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  };

  const mergedOptions = { ...defaultOptions, ...options };
  if (options.headers) {
    mergedOptions.headers = { ...defaultOptions.headers, ...options.headers };
  }

  showLoading();

  try {
    const response = await fetch(url, mergedOptions);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    showToast(error.message || 'An error occurred', 'error');
    throw error;
  } finally {
    hideLoading();
  }
}

/**
 * Show loading state
 */
function showLoading() {
  AppState.isLoading = true;
  document.body.classList.add('loading');
}

/**
 * Hide loading state
 */
function hideLoading() {
  AppState.isLoading = false;
  document.body.classList.remove('loading');
}

// ============================================================================
// DOCTORS
// ============================================================================

/**
 * Load all specialties from the API
 */
async function loadSpecialties() {
  try {
    AppState.specialties = await fetchAPI('specialties');
    renderSpecialtyFilter();
  } catch (error) {
    console.error('Failed to load specialties:', error);
  }
}

/**
 * Render specialty filter dropdown
 */
function renderSpecialtyFilter() {
  const select = document.getElementById('specialty-filter');
  if (!select) return;

  select.innerHTML = '<option value="">All Specialties</option>';
  AppState.specialties.forEach(specialty => {
    const option = document.createElement('option');
    option.value = specialty.id;
    option.textContent = specialty.name;
    select.appendChild(option);
  });

  // Add event listener for filtering
  select.addEventListener('change', () => {
    const searchTerm = document.getElementById('doctor-search')?.value || '';
    filterDoctors(select.value, searchTerm);
  });
}

/**
 * Load doctors from the API
 * @param {number|null} specialtyId - Optional specialty ID to filter by
 */
async function loadDoctors(specialtyId = null) {
  try {
    // Show skeletons initially
    const skeletons = document.getElementById('doctors-skeletons');
    const grid = document.getElementById('doctors-grid');
    if (skeletons) skeletons.style.display = 'grid';
    if (grid) grid.style.display = 'none';

    let endpoint = 'doctors';
    if (specialtyId) {
      endpoint += `?specialty_id=${specialtyId}`;
    }
    if (AppState.currentPatientEmail) {
      endpoint += `${specialtyId ? '&' : '?'}patient_email=${encodeURIComponent(AppState.currentPatientEmail)}`;
    }

    AppState.doctors = await fetchAPI(endpoint);
    renderDoctors(AppState.doctors);
  } catch (error) {
    console.error('Failed to load doctors:', error);
    // Hide skeletons on error too
    const skeletons = document.getElementById('doctors-skeletons');
    const grid = document.getElementById('doctors-grid');
    if (skeletons) skeletons.style.display = 'none';
    if (grid) {
      grid.style.display = 'grid';
      grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1/-1;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M8 12h8M12 8v8"/>
          </svg>
          <h3>${window.t('doctors.error.title')}</h3>
          <p>${window.t('doctors.error.desc')}</p>
        </div>
      `;
    }
    showToast(window.t('toast.load.error', { item: 'doctors' }), 'error');
  }
}

/**
 * Render doctors grid
 * @param {Array} doctors - Array of doctor objects
 */
function renderDoctors(doctors) {
  const grid = document.getElementById('doctors-grid');
  const skeletons = document.getElementById('doctors-skeletons');
  if (!grid) return;

  // Hide skeletons and show grid when rendering
  if (skeletons) {
    skeletons.style.display = 'none';
  }
  grid.style.display = 'grid';

  if (doctors.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1/-1;">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.35-4.35"/>
        </svg>
        <h3>${window.t('doctors.empty.title')}</h3>
        <p>${window.t('doctors.empty.desc')}</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = doctors.map(doctor => renderDoctorCard(doctor)).join('');
}

/**
 * Render a single doctor card HTML
 * @param {Object} doctor - Doctor object
 * @returns {string} - HTML string
 */
function renderDoctorCard(doctor) {
  const initials = getInitials(doctor.full_name);
  const stars = renderStars(doctor.rating || 0);
  const isFavorite = doctor.is_favorite || AppState.favorites.has(doctor.id);

  return `
    <div class="doctor-card" data-doctor-id="${doctor.id}">
      <button class="favorite-btn ${isFavorite ? 'active' : ''}" 
              onclick="event.stopPropagation(); toggleFavorite(${doctor.id})"
              aria-label="${isFavorite ? 'Remove from favorites' : 'Add to favorites'}">
        <svg viewBox="0 0 24 24" fill="${isFavorite ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
      </button>
      
      <div class="doctor-header">
        <div class="doctor-avatar">${initials}</div>
        <div class="doctor-info">
          <h3>${escapeHtml(doctor.full_name)}</h3>
          <span class="specialty-badge">${escapeHtml(doctor.specialty)}</span>
          <div class="doctor-rating">
            <span class="stars">${stars}</span>
            <span class="rating-text">${doctor.rating ? doctor.rating.toFixed(1) : 'No rating'} (${doctor.review_count || 0} reviews)</span>
          </div>
        </div>
      </div>
      
      <div class="doctor-meta">
        <span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/>
          </svg>
          ${doctor.estimated_wait_time || 15} ${window.t('doctor.wait')}
        </span>
        <span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          ${doctor.years_experience || 5}+ ${window.t('doctor.experience')}
        </span>
      </div>
      
      <p class="doctor-bio">${escapeHtml(doctor.bio || 'No bio available')}</p>
      
      <div class="doctor-actions">
        <button class="btn btn-primary" onclick="openBookingModal(${doctor.id})">
          ${window.t('doctor.book')}
        </button>
        <button class="btn btn-secondary" onclick="loadDoctorDetail(${doctor.id})">
          ${window.t('doctor.profile')}
        </button>
      </div>
    </div>
  `;
}

/**
 * Render star rating HTML
 * @param {number} rating - Rating value (0-5)
 * @returns {string} - HTML string of stars
 */
function renderStars(rating) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  let stars = '';

  // Full stars
  for (let i = 0; i < fullStars; i++) {
    stars += `<svg class="star-filled" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>`;
  }

  // Half star
  if (hasHalfStar) {
    stars += `<svg class="star-filled" viewBox="0 0 24 24" fill="currentColor">
                <defs>
                  <linearGradient id="half-${rating}">
                    <stop offset="50%" stop-color="currentColor"/>
                    <stop offset="50%" stop-color="transparent"/>
                  </linearGradient>
                </defs>
                <path fill="url(#half-${rating})" stroke="currentColor" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>`;
  }

  // Empty stars
  for (let i = 0; i < emptyStars; i++) {
    stars += `<svg class="star-empty" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>`;
  }

  return stars;
}

/**
 * Filter doctors by specialty and search term
 * @param {string} specialtyId - Specialty ID to filter by (empty string for all)
 * @param {string} searchTerm - Search term for doctor name
 */
function filterDoctors(specialtyId = '', searchTerm = '') {
  let filtered = [...AppState.doctors];

  // Filter by specialty
  if (specialtyId) {
    filtered = filtered.filter(d => d.specialty_id === parseInt(specialtyId));
  }

  // Filter by search term
  if (searchTerm.trim()) {
    const term = searchTerm.toLowerCase();
    filtered = filtered.filter(d =>
      d.full_name.toLowerCase().includes(term) ||
      d.specialty.toLowerCase().includes(term)
    );
  }

  renderDoctors(filtered);
}

/**
 * Load and display doctor detail modal
 * @param {number} doctorId - Doctor ID
 */
async function loadDoctorDetail(doctorId) {
  try {
    const [doctor, reviews, availability] = await Promise.all([
      fetchAPI(`doctors/${doctorId}`),
      fetchAPI(`doctors/${doctorId}/reviews`),
      fetchAPI(`doctors/${doctorId}/availability`)
    ]);

    const content = document.getElementById('doctor-detail-content');
    if (!content) return;

    const initials = getInitials(doctor.full_name);
    const stars = renderStars(doctor.rating || 0);

    content.innerHTML = `
      <div class="doctor-profile-header">
        <div class="doctor-avatar" style="width: 100px; height: 100px; font-size: 2.5rem;">
          ${initials}
        </div>
        <div class="doctor-profile-info">
          <h2>${escapeHtml(doctor.full_name)}</h2>
          <span class="specialty-badge">${escapeHtml(doctor.specialty)}</span>
          <div class="doctor-rating" style="margin-top: 0.75rem;">
            <span class="stars">${stars}</span>
            <span class="rating-text">${doctor.rating ? doctor.rating.toFixed(1) : 'No rating'} (${doctor.review_count || 0} ${window.t('doctor.reviews')})</span>
          </div>
        </div>
      </div>
      
      <div class="doctor-profile-details" style="margin-top: 2rem;">
        <h4>${window.t('detail.about')}</h4>
        <p style="color: var(--text-secondary); line-height: 1.7;">${escapeHtml(doctor.bio || window.t('doctor.no_bio'))}</p>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; margin: 1.5rem 0;">
          <div style="padding: 1rem; background: var(--bg-secondary); border-radius: var(--radius-lg);">
            <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">${window.t('detail.experience')}</span>
            <p style="font-weight: 600; margin-top: 0.25rem;">${doctor.years_experience || 5}+ ${window.t('doctor.experience')}</p>
          </div>
          <div style="padding: 1rem; background: var(--bg-secondary); border-radius: var(--radius-lg);">
            <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">${window.t('detail.wait')}</span>
            <p style="font-weight: 600; margin-top: 0.25rem;">${doctor.estimated_wait_time || 15} ${window.t('doctor.wait')}</p>
          </div>
          <div style="padding: 1rem; background: var(--bg-secondary); border-radius: var(--radius-lg);">
            <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">${window.t('detail.phone')}</span>
            <p style="font-weight: 600; margin-top: 0.25rem;">${escapeHtml(doctor.phone || 'N/A')}</p>
          </div>
        </div>
        
        <h4 style="margin-top: 1.5rem;">${window.t('detail.availability')}</h4>
        <div class="availability-calendar" style="margin-top: 1rem;">
          ${Object.entries(availability.availability || {}).map(([day, slots]) => `
            <div class="availability-day ${slots.length === 0 ? 'unavailable' : ''}">
              <div class="availability-day-name">${window.t('day.' + day.toLowerCase())}</div>
              <div class="availability-day-hours">
                ${slots.length > 0
        ? slots.map(s => `${s.start} - ${s.end}`).join('<br>')
        : window.t('detail.unavailable')}
              </div>
            </div>
          `).join('')}
        </div>
        
        <h4 style="margin-top: 1.5rem;">${window.t('detail.reviews')}</h4>
        <div class="reviews-list" style="margin-top: 1rem;">
          ${reviews.length > 0
        ? reviews.map(review => `
                <div style="padding: 1rem; background: var(--bg-secondary); border-radius: var(--radius-lg); margin-bottom: 1rem;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                    <span style="font-weight: 600;">${escapeHtml(review.patient_name)}</span>
                    <span style="font-size: 0.875rem; color: var(--text-muted);">${new Date(review.date).toLocaleDateString()}</span>
                  </div>
                  <div class="stars" style="margin-bottom: 0.5rem;">${renderStars(review.rating)}</div>
                  <p style="color: var(--text-secondary);">${escapeHtml(review.comment || 'No comment')}</p>
                </div>
              `).join('')
        : `<p style="color: var(--text-muted);">${window.t('detail.reviews.empty')}</p>`
      }
        </div>
      </div>
      
      <div style="margin-top: 2rem; display: flex; gap: 1rem;">
        <button class="btn btn-primary btn-block" onclick="closeModal('doctor-modal'); openBookingModal(${doctor.id})">
          ${window.t('doctor.book')}
        </button>
      </div>
    `;

    openModal('doctor-modal');
  } catch (error) {
    console.error('Failed to load doctor details:', error);
    showToast('Failed to load doctor details', 'error');
  }
}

// ============================================================================
// FAVORITES
// ============================================================================

/**
 * Load user's favorite doctors
 */
async function loadFavorites() {
  if (!AppState.currentPatientEmail) return;

  try {
    const favorites = await fetchAPI(`favorites?email=${encodeURIComponent(AppState.currentPatientEmail)}`);
    AppState.favorites = new Set(favorites.map(f => f.id));

    // Update UI for favorite buttons
    updateFavoriteButtons();
  } catch (error) {
    console.error('Failed to load favorites:', error);
  }
}

/**
 * Toggle favorite status for a doctor
 * @param {number} doctorId - Doctor ID
 */
async function toggleFavorite(doctorId) {
  if (!AppState.currentPatientEmail) {
    showToast('Please sign in to manage favorites', 'info');
    scrollToSection('appointments');
    return;
  }

  try {
    const result = await fetchAPI('favorites', {
      method: 'POST',
      body: JSON.stringify({
        email: AppState.currentPatientEmail,
        doctor_id: doctorId
      })
    });

    if (result.favorited) {
      AppState.favorites.add(doctorId);
      showToast('Added to favorites', 'success');
    } else {
      AppState.favorites.delete(doctorId);
      showToast('Removed from favorites', 'info');
    }

    updateFavoriteButtons();
  } catch (error) {
    console.error('Failed to toggle favorite:', error);
  }
}

/**
 * Update favorite button UI states
 */
function updateFavoriteButtons() {
  document.querySelectorAll('.favorite-btn').forEach(btn => {
    const card = btn.closest('.doctor-card');
    if (card) {
      const doctorId = parseInt(card.dataset.doctorId);
      const isFavorite = AppState.favorites.has(doctorId);

      btn.classList.toggle('active', isFavorite);
      btn.setAttribute('aria-label', isFavorite ? 'Remove from favorites' : 'Add to favorites');
      btn.querySelector('svg').setAttribute('fill', isFavorite ? 'currentColor' : 'none');
    }
  });
}

// ============================================================================
// APPOINTMENTS
// ============================================================================

/**
 * Load patient appointments
 */
async function loadPatientAppointments() {
  const emailInput = document.getElementById('patient-email');
  const email = emailInput?.value?.trim();

  if (!email) {
    showToast('Please enter your email address', 'error');
    emailInput?.focus();
    return;
  }

  AppState.currentPatientEmail = email;
  localStorage.setItem('patientEmail', email);

  try {
    const appointments = await fetchAPI(`appointments?email=${encodeURIComponent(email)}`);

    // Show appointments container
    const loginSection = document.getElementById('patient-login');
    const appointmentsContainer = document.getElementById('appointments-container');

    if (loginSection) loginSection.classList.add('hidden');
    if (appointmentsContainer) appointmentsContainer.classList.remove('hidden');

    // Update patient name
    if (appointments.length > 0) {
      const firstAppointment = appointments[0];
      document.getElementById('patient-name').textContent = firstAppointment.patient_name || 'Patient';
    }

    renderAppointments(appointments);
    loadFavorites(); // Load favorites after successful login
    checkUpcomingAppointments();
  } catch (error) {
    console.error('Failed to load appointments:', error);
  }
}

/**
 * Render appointments list
 * @param {Array} appointments - Array of appointment objects
 */
function renderAppointments(appointments) {
  const list = document.getElementById('appointments-list');
  if (!list) return;

  if (appointments.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        <h3>${window.t('appointments.empty.title')}</h3>
        <p>${window.t('appointments.empty.desc')}</p>
      </div>
    `;
    return;
  }

  list.innerHTML = appointments.map(apt => {
    const date = new Date(apt.date);
    const isUpcoming = apt.is_upcoming;
    const typeClass = apt.appointment_type || 'in-person';

    return `
      <div class="appointment-card ${isUpcoming ? 'upcoming' : ''}">
        <div class="appointment-date">
          <div class="day">${date.getDate()}</div>
          <div class="month">${date.toLocaleString('default', { month: 'short' })}</div>
          <div class="time">${date.toLocaleTimeString('default', { hour: 'numeric', minute: '2-digit' })}</div>
        </div>
        
        <div class="appointment-details">
          <h4>${escapeHtml(apt.doctor_name)}</h4>
          <p class="specialty">${escapeHtml(apt.specialty)}</p>
          ${apt.reason ? `<p class="reason">${escapeHtml(apt.reason)}</p>` : ''}
          <div class="badge-group" style="display: flex; gap: var(--space-2); align-items: center; margin-top: var(--space-3);">
            <span class="appointment-type-badge ${typeClass}">
              ${window.t('modal.type.' + typeClass.replace('-', ''))}
            </span>
            <span class="status-badge status-${apt.status}">${window.t('appointments.status.' + apt.status)}</span>
            ${apt.reschedule_count > 0 ? `<span style="font-size: 0.75rem; color: var(--text-muted);">Rescheduled ${apt.reschedule_count}x</span>` : ''}
          </div>
        </div>
        
        <div class="appointment-actions">
          ${apt.can_reschedule ? `
            <button class="btn btn-secondary" onclick="openRescheduleModal(${apt.id})">
              ${window.t('appointments.action.reschedule')}
            </button>
          ` : ''}
          ${apt.can_cancel ? `
            <button class="btn btn-outline" onclick="cancelAppointment(${apt.id})">
              ${window.t('appointments.action.cancel')}
            </button>
          ` : ''}
          ${apt.can_review ? `
            <button class="btn btn-primary" onclick="openReviewModal(${apt.id}, ${apt.doctor_id})">
              ${window.t('appointments.action.review')}
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Cancel an appointment
 * @param {number} appointmentId - Appointment ID
 */
async function cancelAppointment(appointmentId) {
  if (!confirm(window.t('modal.cancel.confirm', 'Are you sure you want to cancel this appointment?'))) {
    return;
  }

  try {
    await fetchAPI(`appointments/${appointmentId}/cancel`, { method: 'POST' });
    showToast(window.t('toast.cancel.success', 'Appointment cancelled successfully'), 'success');
    loadPatientAppointments();
  } catch (error) {
    console.error('Failed to cancel appointment:', error);
  }
}

/**
 * Log out the current patient
 */
function logoutPatient() {
  AppState.currentPatientEmail = null;
  localStorage.removeItem('patientEmail');
  AppState.favorites.clear();

  const loginSection = document.getElementById('patient-login');
  const appointmentsContainer = document.getElementById('appointments-container');

  if (loginSection) loginSection.classList.remove('hidden');
  if (appointmentsContainer) appointmentsContainer.classList.add('hidden');

  const emailInput = document.getElementById('patient-email');
  if (emailInput) emailInput.value = '';

  showToast('Signed out successfully', 'info');
  updateFavoriteButtons();
}

/**
 * Check for upcoming appointments and show notification
 */
async function checkUpcomingAppointments() {
  if (!AppState.currentPatientEmail) return;

  try {
    const upcoming = await fetchAPI(`appointments/upcoming?email=${encodeURIComponent(AppState.currentPatientEmail)}`);

    if (upcoming.length > 0) {
      const apt = upcoming[0];
      const hours = apt.hours_until;

      showNotificationBanner(
        window.t('appointments.upcoming'),
        `${window.t('appointments.upcoming_desc_doctor', { doctor: apt.doctor_name })} ${hours < 1 ? Math.round(hours * 60) + ' ' + window.t('minutes', 'minutes') : Math.round(hours) + ' ' + window.t('hours', 'hours')}`
      );
    }
  } catch (error) {
    console.error('Failed to check upcoming appointments:', error);
  }
}

/**
 * Show notification banner
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 */
function showNotificationBanner(title, message) {
  // Remove existing banner
  const existing = document.querySelector('.notification-banner');
  if (existing) existing.remove();

  const banner = document.createElement('div');
  banner.className = 'notification-banner';
  banner.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
    <div class="notification-content">
      <h4>${escapeHtml(title)}</h4>
      <p>${escapeHtml(message)}</p>
    </div>
    <button class="notification-close" onclick="this.closest('.notification-banner').remove()">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    </button>
  `;

  document.body.appendChild(banner);

  // Auto remove after 10 seconds
  setTimeout(() => {
    banner.classList.add('hiding');
    setTimeout(() => banner.remove(), 300);
  }, 10000);
}

// ============================================================================
// BOOKING & RESCHEDULING
// ============================================================================

/**
 * Open booking modal for a doctor
 * @param {number} doctorId - Doctor ID
 */
async function openBookingModal(doctorId) {
  AppState.currentDoctorId = doctorId;
  AppState.selectedDate = null;
  AppState.selectedTime = null;

  try {
    const doctor = await fetchAPI(`doctors/${doctorId}`);

    // Update modal with doctor info
    document.getElementById('modal-doctor-name').textContent = doctor.full_name;
    document.getElementById('modal-doctor-specialty').textContent = doctor.specialty;
    document.getElementById('modal-doctor-avatar').textContent = getInitials(doctor.full_name);

    // Pre-fill email if available
    if (AppState.currentPatientEmail) {
      document.getElementById('patient-email-booking').value = AppState.currentPatientEmail;
    }

    // Initialize date picker
    initDatePicker();

    // Reset form
    document.getElementById('booking-form').reset();

    // Clear time slots
    const timeSelect = document.getElementById('appointment-time');
    if (timeSelect) {
      timeSelect.innerHTML = '<option value="">Select time</option>';
    }

    // Reset appointment type
    AppState.selectedAppointmentType = 'in-person';
    selectAppointmentType('in-person');

    openModal('booking-modal');
  } catch (error) {
    console.error('Failed to load doctor for booking:', error);
  }
}

/**
 * Open reschedule modal
 * @param {number} appointmentId - Appointment ID
 */
async function openRescheduleModal(appointmentId) {
  AppState.currentAppointmentId = appointmentId;
  AppState.selectedRescheduleDate = null;
  AppState.selectedRescheduleTime = null;
  AppState.rescheduleCalendarDate = new Date(); // Start with current month

  try {
    const appointment = await fetchAPI(`appointments/${appointmentId}`);
    AppState.currentDoctorId = appointment.doctor_id;

    // Clear time slots
    const timeSlotsGrid = document.getElementById('reschedule-time-slots');
    if (timeSlotsGrid) {
      timeSlotsGrid.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 1rem;">Select a date to view available times</p>';
    }

    // Render calendar
    renderRescheduleCalendar();

    openModal('reschedule-modal');
  } catch (error) {
    console.error('Failed to load appointment for rescheduling:', error);
  }
}

/**
 * Render the reschedule calendar grid
 */
function renderRescheduleCalendar() {
  const container = document.getElementById('reschedule-calendar-grid');
  const title = document.getElementById('reschedule-calendar-title');
  if (!container || !title) return;

  const date = AppState.rescheduleCalendarDate;
  const year = date.getFullYear();
  const month = date.getMonth();

  // Update title
  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  title.textContent = `${window.t('month.' + monthNames[month].toLowerCase())} ${year}`;

  // Calculate days
  const firstDay = new Date(year, month, 1).getDay(); // 0 is Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  let html = '';

  // Day headers
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  dayNames.forEach(day => {
    html += `<div class="calendar-day-header">${window.t('day.short.' + day.toLowerCase())}</div>`;
  });

  // Previous month padding
  for (let i = firstDay - 1; i >= 0; i--) {
    html += `<div class="calendar-day other-month">${prevMonthDays - i}</div>`;
  }

  // Current month days
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 1; i <= daysInMonth; i++) {
    const currentDayDate = new Date(year, month, i);
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    const isPast = currentDayDate < today;
    const isSelected = AppState.selectedRescheduleDate === dateStr;
    const isToday = currentDayDate.getTime() === today.getTime();

    html += `
      <div class="calendar-day ${isPast ? 'other-month' : ''} ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}" 
           onclick="${isPast ? '' : `selectRescheduleDate('${dateStr}')`}"
           style="${isPast ? 'cursor: not-allowed; opacity: 0.5;' : ''}">
        ${i}
      </div>
    `;
  }

  // Next month padding
  const totalCells = html.split('calendar-day').length - 1;
  const remaining = 42 - totalCells + 7; // +7 because of headers
  // Actually headers are not in totalCells if I counted correctly... wait.
  // Let's just calculate based on 42 cells total (6 weeks).
  const cellsSoFar = (firstDay + daysInMonth);
  const nextMonthPadding = 42 - cellsSoFar;

  for (let i = 1; i <= nextMonthPadding; i++) {
    html += `<div class="calendar-day other-month">${i}</div>`;
  }

  container.innerHTML = html;
}

/**
 * Change the month viewed in the reschedule calendar
 * @param {number} delta - Months to add or subtract
 */
function changeRescheduleMonth(delta) {
  const date = AppState.rescheduleCalendarDate;
  date.setMonth(date.getMonth() + delta);
  renderRescheduleCalendar();
}

/**
 * Select a date in the reschedule calendar
 * @param {string} dateStr - Date string (YYYY-MM-DD)
 */
async function selectRescheduleDate(dateStr) {
  AppState.selectedRescheduleDate = dateStr;
  AppState.selectedRescheduleTime = null;

  // Re-render calendar to show selection
  renderRescheduleCalendar();

  const timeSlotsGrid = document.getElementById('reschedule-time-slots');
  if (!timeSlotsGrid) return;

  timeSlotsGrid.innerHTML = '<div class="spinner-container"><div class="spinner"></div></div>';

  try {
    const slots = await fetchAPI(`available-slots?doctor_id=${AppState.currentDoctorId}&date=${dateStr}`);
    renderRescheduleTimeSlots(slots);
  } catch (error) {
    console.error('Failed to load slots:', error);
    timeSlotsGrid.innerHTML = '<p style="color: var(--error); text-align: center; padding: 1rem;">Failed to load time slots</p>';
  }
}

/**
 * Render time slots in the reschedule modal
 * @param {Array} slots - Array of slot objects
 */
function renderRescheduleTimeSlots(slots) {
  const container = document.getElementById('reschedule-time-slots');
  if (!container) return;

  if (slots.length === 0) {
    container.innerHTML = '<p>No available slots for this date</p>';
    return;
  }

  container.innerHTML = slots.map(slot => `
    <button type="button" class="time-slot ${AppState.selectedRescheduleTime === slot.datetime ? 'selected' : ''}" 
            onclick="selectRescheduleTime('${slot.datetime}')">
      ${slot.time}
    </button>
  `).join('');
}

/**
 * Select a time slot in the reschedule modal
 * @param {string} dateTime - ISO date time string
 */
function selectRescheduleTime(dateTime) {
  AppState.selectedRescheduleTime = dateTime;

  // Highlight selected slot
  document.querySelectorAll('#reschedule-time-slots .time-slot').forEach(btn => {
    btn.classList.remove('selected');
  });

  const selectedBtn = Array.from(document.querySelectorAll('#reschedule-time-slots .time-slot'))
    .find(btn => btn.getAttribute('onclick')?.includes(dateTime));

  if (selectedBtn) {
    selectedBtn.classList.add('selected');
  }
}

/**
 * Submit the reschedule request
 */
async function submitReschedule() {
  if (!AppState.selectedRescheduleDate || !AppState.selectedRescheduleTime) {
    showToast('Please select both date and time', 'error');
    return;
  }

  try {
    await fetchAPI(`appointments/${AppState.currentAppointmentId}/reschedule`, {
      method: 'POST',
      body: JSON.stringify({ newDateTime: AppState.selectedRescheduleTime })
    });

    closeModal('reschedule-modal');
    closeModal('reschedule-modal');
    showToast(window.t('toast.reschedule.success', 'Appointment rescheduled successfully!'), 'success');
    loadPatientAppointments();
    loadPatientAppointments();
  } catch (error) {
    console.error('Failed to reschedule appointment:', error);
  }
}



/**
 * Open review modal
 * @param {number} appointmentId - Appointment ID
 * @param {number} doctorId - Doctor ID
 */
function openReviewModal(appointmentId, doctorId) {
  AppState.currentReviewAppointmentId = appointmentId;
  AppState.currentDoctorId = doctorId;

  // Reset form
  document.getElementById('review-form').reset();
  document.getElementById('review-rating').value = '0';
  document.querySelectorAll('#star-rating .star').forEach(s => s.classList.remove('active'));
  document.getElementById('rating-text').textContent = 'Select a rating';

  openModal('review-modal');
}

/**
 * Handle booking form submission
 * @param {Event} e - Form submit event
 */
async function handleBookingSubmit(e) {
  e.preventDefault();

  // Get time from select element directly as fallback
  const timeSelect = document.getElementById('appointment-time');
  const selectedTime = AppState.selectedTime || (timeSelect ? timeSelect.value : null);

  const formData = {
    doctorId: AppState.currentDoctorId,
    firstName: document.getElementById('patient-firstname').value.trim(),
    lastName: document.getElementById('patient-lastname').value.trim(),
    email: document.getElementById('patient-email-booking').value.trim(),
    phone: document.getElementById('patient-phone').value.trim(),
    dateTime: selectedTime,
    reason: document.getElementById('appointment-reason').value.trim(),
    appointmentType: AppState.selectedAppointmentType
  };

  // Validation
  if (!formData.dateTime) {
    showToast('Please select a date and time slot', 'error');
    // Highlight the time select
    if (timeSelect) {
      timeSelect.classList.add('error');
      timeSelect.focus();
      setTimeout(() => timeSelect.classList.remove('error'), 3000);
    }
    return;
  }

  // Additional validation
  if (!formData.firstName || !formData.lastName) {
    showToast('Please enter your full name', 'error');
    return;
  }

  if (!formData.email) {
    showToast('Please enter your email address', 'error');
    return;
  }

  try {
    const result = await fetchAPI('appointments', {
      method: 'POST',
      body: JSON.stringify(formData)
    });

    closeModal('booking-modal');
    closeModal('booking-modal');
    showToast(window.t('toast.booking.success'), 'success');
    showConfetti();
    showConfetti();

    // Show email preview
    const date = new Date(formData.dateTime);
    showEmailPreview({
      doctor_name: result.doctor_name,
      patient_name: `${formData.firstName} ${formData.lastName}`,
      date: date.toLocaleDateString('default', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
      time: date.toLocaleTimeString('default', { hour: 'numeric', minute: '2-digit' }),
      appointment_type: formData.appointmentType
    });

    // Refresh appointments if logged in
    if (AppState.currentPatientEmail) {
      loadPatientAppointments();
    }
  } catch (error) {
    console.error('Failed to book appointment:', error);
  }
}

/**
 * Handle reschedule form submission
 * @param {Event} e - Form submit event
 */


/**
 * Handle review form submission
 * @param {Event} e - Form submit event
 */
async function handleReviewSubmit(e) {
  e.preventDefault();

  const rating = parseInt(document.getElementById('review-rating').value);
  const comment = document.getElementById('review-comment').value.trim();

  if (!rating || rating === 0) {
    showToast('Please select a rating', 'error');
    return;
  }

  try {
    // Get patient ID from current appointments
    const appointments = await fetchAPI(`appointments?email=${encodeURIComponent(AppState.currentPatientEmail)}`);
    const appointment = appointments.find(a => a.id === AppState.currentReviewAppointmentId);

    if (!appointment) {
      throw new Error('Appointment not found');
    }

    await fetchAPI('reviews', {
      method: 'POST',
      body: JSON.stringify({
        appointmentId: AppState.currentReviewAppointmentId,
        doctorId: AppState.currentDoctorId,
        patientId: appointment.patient_id,
        rating: rating,
        comment: comment
      })
    });

    closeModal('review-modal');
    closeModal('review-modal');
    showToast(window.t('toast.review.success', 'Review submitted successfully!'), 'success');
    loadPatientAppointments();
    loadPatientAppointments();

    // Refresh doctors to update ratings
    loadDoctors();
  } catch (error) {
    console.error('Failed to submit review:', error);
  }
}

// ============================================================================
// MODALS
// ============================================================================

/**
 * Open a modal by ID
 * @param {string} modalId - Modal element ID
 */
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';

  // Focus first input for accessibility
  setTimeout(() => {
    const firstInput = modal.querySelector('input, select, textarea');
    if (firstInput) firstInput.focus();
  }, 100);
}

/**
 * Close a modal by ID
 * @param {string} modalId - Modal element ID
 */
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;

  modal.classList.remove('active');
  document.body.style.overflow = '';
}

/**
 * Close modal on Escape key
 */
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal.active').forEach(modal => {
      modal.classList.remove('active');
    });
    document.body.style.overflow = '';
  }
});

// ============================================================================
// DATE PICKER & TIME SLOTS
// ============================================================================

/**
 * Initialize date picker
 */
function initDatePicker() {
  const dateInput = document.getElementById('appointment-date');
  const timeSelect = document.getElementById('appointment-time');

  if (!dateInput || !timeSelect) return;

  // Set minimum date to today
  const today = new Date().toISOString().split('T')[0];
  dateInput.min = today;

  // Handle date change
  dateInput.addEventListener('change', (e) => {
    const date = e.target.value;
    AppState.selectedDate = date;

    if (date) {
      loadAvailableSlots(AppState.currentDoctorId, date, 'appointment-time');
    } else {
      timeSelect.innerHTML = '<option value="">Select time</option>';
    }
  });

  // Handle time change
  timeSelect.addEventListener('change', (e) => {
    AppState.selectedTime = e.target.value;
  });

  // Initialize appointment type selector if exists
  initAppointmentTypeSelector();
}

/**
 * Load available time slots for a doctor on a specific date
 * @param {number} doctorId - Doctor ID
 * @param {string} date - Date string (YYYY-MM-DD)
 * @param {string} elementId - Select element ID to populate
 */
async function loadAvailableSlots(doctorId, date, elementId = 'appointment-time') {
  const select = document.getElementById(elementId);
  if (!select) return;

  select.innerHTML = '<option value="">Loading...</option>';
  select.disabled = true;

  try {
    const slots = await fetchAPI(`available-slots?doctor_id=${doctorId}&date=${date}`);

    select.innerHTML = '<option value="">Select time</option>';
    select.disabled = false;

    if (slots.length === 0) {
      select.innerHTML = '<option value="">No available slots</option>';
      return;
    }

    slots.forEach(slot => {
      const option = document.createElement('option');
      option.value = slot.datetime;
      option.textContent = slot.time;
      select.appendChild(option);
    });
  } catch (error) {
    console.error('Failed to load available slots:', error);
    select.innerHTML = '<option value="">Error loading slots</option>';
    select.disabled = false;
  }
}

/**
 * Initialize appointment type selector
 */
function initAppointmentTypeSelector() {
  // Check if selector exists in the modal
  let selector = document.querySelector('.appointment-type-selector');

  if (!selector) {
    // Create appointment type selector
    const bookingForm = document.getElementById('booking-form');
    if (bookingForm) {
      selector = document.createElement('div');
      selector.className = 'appointment-type-selector';
      selector.innerHTML = `
        <div class="appointment-type-option selected" data-type="in-person">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          <span>In-Person</span>
          <small>At clinic</small>
        </div>
        <div class="appointment-type-option" data-type="video">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M23 7l-7 5 7 5V7z"/>
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
          </svg>
          <span>Video</span>
          <small>Online call</small>
        </div>
        <div class="appointment-type-option" data-type="phone">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
          </svg>
          <span>Phone</span>
          <small>Voice call</small>
        </div>
      `;

      // Insert before the date row
      const dateRow = bookingForm.querySelector('.form-row');
      if (dateRow) {
        bookingForm.insertBefore(selector, dateRow);
      }

      // Add click handlers
      selector.querySelectorAll('.appointment-type-option').forEach(option => {
        option.addEventListener('click', () => {
          selector.querySelectorAll('.appointment-type-option').forEach(o => o.classList.remove('selected'));
          option.classList.add('selected');
          AppState.selectedAppointmentType = option.dataset.type;
        });
      });
    }
  }
}

/**
 * Select appointment type
 * @param {string} type - 'in-person', 'video', or 'phone'
 */
function selectAppointmentType(type) {
  AppState.selectedAppointmentType = type;

  // Update UI
  const options = document.querySelectorAll('.appointment-type-option');
  options.forEach(option => {
    // Some versions use data-type, some check text or other attributes
    const optionType = option.getAttribute('data-type');
    const isSelected = optionType === type;
    option.classList.toggle('selected', isSelected);
    option.setAttribute('aria-checked', isSelected);
  });
}

// ============================================================================
// STAR RATING
// ============================================================================

/**
 * Initialize star rating component
 */
function initStarRating() {
  const starRating = document.getElementById('star-rating');
  if (!starRating) return;

  const stars = starRating.querySelectorAll('.star');
  const ratingInput = document.getElementById('review-rating');
  const ratingText = document.getElementById('rating-text');

  const ratingLabels = {
    1: 'Poor',
    2: 'Fair',
    3: 'Good',
    4: 'Very Good',
    5: 'Excellent'
  };

  stars.forEach((star, index) => {
    // Hover effect
    star.addEventListener('mouseenter', () => {
      const rating = index + 1;
      updateStarDisplay(stars, rating);
      ratingText.textContent = ratingLabels[rating];
    });

    // Click to select
    star.addEventListener('click', () => {
      const rating = index + 1;
      ratingInput.value = rating;
      updateStarDisplay(stars, rating);
      ratingText.textContent = ratingLabels[rating];
    });
  });

  // Reset on mouse leave
  starRating.addEventListener('mouseleave', () => {
    const currentRating = parseInt(ratingInput.value) || 0;
    updateStarDisplay(stars, currentRating);
    ratingText.textContent = currentRating > 0 ? ratingLabels[currentRating] : 'Select a rating';
  });
}

/**
 * Update star display based on rating
 * @param {NodeList} stars - Star elements
 * @param {number} rating - Current rating
 */
function updateStarDisplay(stars, rating) {
  stars.forEach((star, index) => {
    if (index < rating) {
      star.classList.add('active');
      star.querySelector('svg').style.fill = '#fbbf24';
    } else {
      star.classList.remove('active');
      star.querySelector('svg').style.fill = '';
    }
  });
}

// ============================================================================
// EMAIL PREVIEW
// ============================================================================

/**
 * Show email preview modal
 * @param {Object} data - Email data
 */
function showEmailPreview(data) {
  const typeIcons = {
    'in-person': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 18px; height: 18px; display: inline-block; vertical-align: text-bottom;"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>',
    'video': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 18px; height: 18px; display: inline-block; vertical-align: text-bottom;"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>',
    'phone': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 18px; height: 18px; display: inline-block; vertical-align: text-bottom;"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>'
  };

  const typeLabels = {
    'in-person': 'In-Person Visit',
    'video': 'Video Consultation',
    'phone': 'Phone Consultation'
  };

  const modalId = 'email-preview-modal';

  // Remove existing modal
  document.getElementById(modalId)?.remove();

  const modal = document.createElement('div');
  modal.id = modalId;
  modal.className = 'modal active';
  modal.innerHTML = `
    <div class="modal-overlay" onclick="closeModal('${modalId}')"></div>
    <div class="modal-content" style="max-width: 600px;">
      <div class="modal-header">
        <h3>Booking Confirmation</h3>
        <button class="modal-close" onclick="closeModal('${modalId}')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      <div class="modal-body">
        <div class="email-preview">
          <div class="email-preview-header">
            <h4>MedSchedule</h4>
            <p>Appointment Confirmation</p>
          </div>
          <div style="background: var(--bg-secondary); padding: 1rem; border-radius: var(--radius-lg); margin-bottom: 1.5rem;">
            <p style="margin: 0; color: var(--text-secondary);">Hello ${escapeHtml(data.patient_name)},</p>
            <p style="margin: 0.5rem 0 0; color: var(--text-primary); font-weight: 500;">Your appointment has been confirmed!</p>
          </div>
          <div class="email-preview-body">
            <div class="email-preview-detail">
              <div class="email-preview-icon">DR</div>
              <div>
                <div class="email-preview-label">Your Healthcare Provider</div>
                <div class="email-preview-value">${escapeHtml(data.doctor_name)}</div>
              </div>
            </div>
            <div class="email-preview-detail">
              <div class="email-preview-icon">CAL</div>
              <div>
                <div class="email-preview-label">Date</div>
                <div class="email-preview-value">${data.date}</div>
              </div>
            </div>
            <div class="email-preview-detail">
              <div class="email-preview-icon">TIME</div>
              <div>
                <div class="email-preview-label">Time</div>
                <div class="email-preview-value">${data.time}</div>
              </div>
            </div>
            <div class="email-preview-detail">
              <div class="email-preview-icon">${data.appointment_type === 'video' ? 'VID' : data.appointment_type === 'phone' ? 'PH' : 'CLI'}</div>
              <div>
                <div class="email-preview-label">Consultation Type</div>
                <div class="email-preview-value">${typeLabels[data.appointment_type] || 'In-Person'}</div>
              </div>
            </div>
          </div>
        </div>
        <button class="btn btn-primary btn-block" onclick="closeModal('${modalId}')" style="margin-top: 1.5rem;">
          Got it, thanks!
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Auto close after 8 seconds
  setTimeout(() => {
    closeModal(modalId);
    setTimeout(() => modal.remove(), 300);
  }, 8000);
}

// ============================================================================
// CONFETTI EFFECT
// ============================================================================

/**
 * Show confetti animation using canvas
 */
function showConfetti() {
  const canvas = document.createElement('canvas');
  canvas.id = 'confetti-canvas';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const colors = ['#14b8a6', '#0d9488', '#fbbf24', '#f59e0b', '#60a5fa', '#a78bfa'];
  const particles = [];
  const particleCount = 100;

  // Create particles
  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: canvas.width / 2,
      y: canvas.height / 2,
      vx: (Math.random() - 0.5) * 15,
      vy: (Math.random() - 0.5) * 15 - 5,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 8 + 4,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 10,
      opacity: 1
    });
  }

  let animationId;
  let frameCount = 0;

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach((p, i) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.3; // Gravity
      p.rotation += p.rotationSpeed;
      p.opacity -= 0.008;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      ctx.restore();

      // Remove particles that are off screen or faded
      if (p.opacity <= 0 || p.y > canvas.height + 50) {
        particles.splice(i, 1);
      }
    });

    frameCount++;

    if (particles.length > 0 && frameCount < 200) {
      animationId = requestAnimationFrame(animate);
    } else {
      cancelAnimationFrame(animationId);
      canvas.remove();
    }
  }

  animate();

  // Handle resize
  window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }, { once: true });
}

// ============================================================================
// TOAST NOTIFICATIONS
// ============================================================================

/**
 * Show toast notification
 * @param {string} message - Message to display
 * @param {string} type - Type: 'success', 'error', or 'info'
 * @param {number} duration - Duration in milliseconds
 */
function showToast(message, type = 'info', duration = 4000) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const icons = {
    success: `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>`,
    error: `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>`,
    info: `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
             <circle cx="12" cy="12" r="10"/>
             <line x1="12" y1="16" x2="12" y2="12"/>
             <line x1="12" y1="8" x2="12.01" y2="8"/>
           </svg>`
  };

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    ${icons[type]}
    <span>${escapeHtml(message)}</span>
  `;

  container.appendChild(toast);

  // Remove after duration
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Get initials from a full name
 * @param {string} name - Full name
 * @returns {string} - Initials (up to 2 characters)
 */
function getInitials(name) {
  if (!name) return 'DR';
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} - Escaped text
 */
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Debounce function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} - Debounced function
 */
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

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize the application
 */
// ============================================================================
// HERO DOCTOR ROTATOR
// ============================================================================

const heroDoctors = [
  {
    initials: 'SC',
    name: 'Dr. Sarah Chen',
    specialty: 'Cardiologist',
    rating: '4.9',
    reviews: 128,
    slots: ['9:00 AM', '11:30 AM', '2:00 PM', '+5 more']
  },
  {
    initials: 'MR',
    name: 'Dr. Michael Rodriguez',
    specialty: 'Dermatologist',
    rating: '4.8',
    reviews: 96,
    slots: ['10:00 AM', '1:30 PM', '3:00 PM', '+3 more']
  },
  {
    initials: 'EJ',
    name: 'Dr. Emily Johnson',
    specialty: 'Pediatrician',
    rating: '5.0',
    reviews: 215,
    slots: ['8:30 AM', '12:00 PM', '4:00 PM', '+8 more']
  },
  {
    initials: 'DW',
    name: 'Dr. David Williams',
    specialty: 'Orthopedic Surgeon',
    rating: '4.7',
    reviews: 84,
    slots: ['9:30 AM', '2:30 PM', '+4 more']
  },
  {
    initials: 'AK',
    name: 'Dr. Amanda Kim',
    specialty: 'Neurologist',
    rating: '4.9',
    reviews: 156,
    slots: ['11:00 AM', '3:30 PM', '5:00 PM', '+6 more']
  }
];

let heroDoctorIndex = 0;
let heroDoctorInterval = null;

/**
 * Initialize the hero doctor rotator
 */
function initHeroDoctorRotator() {
  const preview = document.getElementById('hero-doctor-preview');
  if (!preview) return;

  // Start the rotation
  heroDoctorInterval = setInterval(rotateHeroDoctor, 20000);

  // Add hover pause functionality
  preview.addEventListener('mouseenter', () => {
    if (heroDoctorInterval) clearInterval(heroDoctorInterval);
  });

  preview.addEventListener('mouseleave', () => {
    heroDoctorInterval = setInterval(rotateHeroDoctor, 20000);
  });
}

/**
 * Rotate to the next doctor in the hero card
 */
function rotateHeroDoctor() {
  const avatar = document.getElementById('hero-doctor-avatar');
  const name = document.getElementById('hero-doctor-name');
  const specialty = document.getElementById('hero-doctor-specialty');
  const rating = document.getElementById('hero-doctor-rating');
  const slotsContainer = document.getElementById('hero-doctor-slots');

  if (!avatar || !name || !specialty || !rating || !slotsContainer) return;

  // Fade out
  const preview = document.getElementById('hero-doctor-preview');
  preview.style.opacity = '0.5';
  preview.style.transform = 'translateY(-5px)';
  preview.style.transition = 'opacity 0.3s ease, transform 0.3s ease';

  setTimeout(() => {
    // Move to next doctor
    heroDoctorIndex = (heroDoctorIndex + 1) % heroDoctors.length;
    const doctor = heroDoctors[heroDoctorIndex];

    // Update content
    avatar.textContent = doctor.initials;
    name.textContent = doctor.name;
    specialty.textContent = doctor.specialty;
    rating.textContent = `★ ${doctor.rating} (${doctor.reviews} reviews)`;

    // Update slots
    const slotsHtml = doctor.slots.map((slot, index) => {
      const className = index === doctor.slots.length - 1 ? 'slot-badge more' : 'slot-badge available';
      return `<span class="${className}">${slot}</span>`;
    }).join('');
    slotsContainer.innerHTML = slotsHtml;

    // Fade in
    preview.style.opacity = '1';
    preview.style.transform = 'translateY(0)';
  }, 300);
}

function init() {
  // Initialize theme
  initTheme();

  // Initialize navigation
  initNavigation();

  // Initialize hero doctor rotator
  initHeroDoctorRotator();

  // Initialize star rating
  initStarRating();

  // Load initial data
  loadSpecialties();
  loadDoctors();

  // Check if user is already logged in
  if (AppState.currentPatientEmail) {
    document.getElementById('patient-email').value = AppState.currentPatientEmail;
    loadPatientAppointments();
  }

  // Initialize search with debounce
  const searchInput = document.getElementById('doctor-search');
  if (searchInput) {
    searchInput.addEventListener('input', debounce((e) => {
      const specialtyId = document.getElementById('specialty-filter')?.value || '';
      filterDoctors(specialtyId, e.target.value);
    }, 300));
  }

  // Initialize booking form
  const bookingForm = document.getElementById('booking-form');
  if (bookingForm) {
    bookingForm.addEventListener('submit', handleBookingSubmit);
  }

  // Initialize review form
  const reviewForm = document.getElementById('review-form');
  if (reviewForm) {
    reviewForm.addEventListener('submit', handleReviewSubmit);
  }

  // Enter key on email input loads appointments
  const emailInput = document.getElementById('patient-email');
  if (emailInput) {
    emailInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        loadPatientAppointments();
      }
    });
  }

  console.log('MedSchedule initialized successfully');
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);

// ============================================================================
// EXPORTS FOR GLOBAL ACCESS
// ============================================================================

// Make functions available globally for onclick handlers
globalThis.toggleTheme = toggleTheme;
globalThis.scrollToSection = scrollToSection;
globalThis.openMobileMenu = openMobileMenu;
globalThis.closeMobileMenu = closeMobileMenu;
globalThis.loadSpecialties = loadSpecialties;
globalThis.loadDoctors = loadDoctors;
globalThis.filterDoctors = filterDoctors;
globalThis.loadDoctorDetail = loadDoctorDetail;
globalThis.loadFavorites = loadFavorites;
globalThis.toggleFavorite = toggleFavorite;
globalThis.loadPatientAppointments = loadPatientAppointments;
globalThis.cancelAppointment = cancelAppointment;
globalThis.logoutPatient = logoutPatient;
globalThis.openBookingModal = openBookingModal;
globalThis.openRescheduleModal = openRescheduleModal;
globalThis.openReviewModal = openReviewModal;
globalThis.handleBookingSubmit = handleBookingSubmit;
globalThis.selectAppointmentType = selectAppointmentType;
globalThis.submitReschedule = submitReschedule;
globalThis.changeRescheduleMonth = changeRescheduleMonth;
globalThis.selectRescheduleDate = selectRescheduleDate;
globalThis.selectRescheduleTime = selectRescheduleTime;
globalThis.renderRescheduleCalendar = renderRescheduleCalendar;
globalThis.handleReviewSubmit = handleReviewSubmit;
globalThis.openModal = openModal;
globalThis.closeModal = closeModal;
globalThis.initDatePicker = initDatePicker;
globalThis.loadAvailableSlots = loadAvailableSlots;
globalThis.initStarRating = initStarRating;
globalThis.showEmailPreview = showEmailPreview;
globalThis.showConfetti = showConfetti;
globalThis.showToast = showToast;
globalThis.getInitials = getInitials;
globalThis.escapeHtml = escapeHtml;
globalThis.debounce = debounce;
