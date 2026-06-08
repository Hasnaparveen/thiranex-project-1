document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initMobileNav();
  initActiveLinks();
  initAccessibilityHelpers();
  initProjectsFilter();
  initContactForm();
});

/**
 * Accessible Live Region Announcement Helper
 * Pushes messages to screen reader users dynamically.
 */
function announceToScreenReader(message) {
  const liveRegion = document.getElementById('sr-announcer');
  if (liveRegion) {
    liveRegion.textContent = '';
    // Small timeout to guarantee screen readers register the text change
    setTimeout(() => {
      liveRegion.textContent = message;
    }, 100);
  }
}

/**
 * Accessible Theme Management (Dark/Light mode)
 * Handles prefers-color-scheme, localStorage, and aria-pressed attributes.
 */
function initTheme() {
  const themeToggle = document.getElementById('theme-toggle');
  if (!themeToggle) return;

  const getPreferredTheme = () => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) return savedTheme;
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  };

  const setTheme = (theme) => {
    if (theme === 'light') {
      document.body.classList.add('light-theme');
      themeToggle.setAttribute('aria-pressed', 'true');
      themeToggle.setAttribute('aria-label', 'Switch to Dark Mode');
      themeToggle.querySelector('use').setAttribute('href', '#icon-moon');
    } else {
      document.body.classList.remove('light-theme');
      themeToggle.setAttribute('aria-pressed', 'false');
      themeToggle.setAttribute('aria-label', 'Switch to Light Mode');
      themeToggle.querySelector('use').setAttribute('href', '#icon-sun');
    }
    localStorage.setItem('theme', theme);
  };

  // Initialize
  const currentTheme = getPreferredTheme();
  setTheme(currentTheme);

  // Toggle Listener
  themeToggle.addEventListener('click', () => {
    const isLight = document.body.classList.contains('light-theme');
    const newTheme = isLight ? 'dark' : 'light';
    setTheme(newTheme);
    announceToScreenReader(`Theme switched to ${newTheme} mode.`);
  });
}

/**
 * Accessible Mobile Navigation Hamburger Menu
 * Manages states, handles ESC key closing, and traps keyboard focus inside when open.
 */
function initMobileNav() {
  const toggleBtn = document.getElementById('menu-toggle');
  const navLinks = document.getElementById('nav-links');
  if (!toggleBtn || !navLinks) return;

  let isMenuOpen = false;

  const toggleMenu = (open) => {
    isMenuOpen = open;
    toggleBtn.setAttribute('aria-expanded', isMenuOpen ? 'true' : 'false');
    
    if (isMenuOpen) {
      navLinks.classList.add('open');
      toggleBtn.querySelector('use').setAttribute('href', '#icon-close');
      document.body.style.overflow = 'hidden'; // Prevent scrolling background
      
      // Let screen reader know menu is open
      announceToScreenReader('Navigation menu opened');
      
      // Trap focus
      document.addEventListener('keydown', trapFocus);
      
      // Focus on the first link inside the menu
      const firstLink = navLinks.querySelector('a');
      if (firstLink) {
        setTimeout(() => firstLink.focus(), 100);
      }
    } else {
      navLinks.classList.remove('open');
      toggleBtn.querySelector('use').setAttribute('href', '#icon-menu');
      document.body.style.overflow = '';
      
      announceToScreenReader('Navigation menu closed');
      document.remove('keydown', trapFocus);
      
      // Return focus to menu button
      toggleBtn.focus();
    }
  };

  toggleBtn.addEventListener('click', () => {
    toggleMenu(!isMenuOpen);
  });

  // Close on ESC key press
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isMenuOpen) {
      toggleMenu(false);
    }
  });

  // Focus Trapping Logic inside mobile navigation
  function trapFocus(e) {
    if (e.key !== 'Tab') return;

    const focusableElements = [
      toggleBtn,
      ...navLinks.querySelectorAll('a'),
      document.getElementById('theme-toggle')
    ].filter(el => el && el.offsetParent !== null); // Only visible elements

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (e.shiftKey) { // Shift + Tab
      if (document.activeElement === firstElement) {
        lastElement.focus();
        e.preventDefault();
      }
    } else { // Tab
      if (document.activeElement === lastElement) {
        firstElement.focus();
        e.preventDefault();
      }
    }
  }
}

/**
 * Active Navigation Links
 * Sets active class based on the current URL pathway.
 */
function initActiveLinks() {
  const currentPath = window.location.pathname;
  const navLinks = document.querySelectorAll('.nav-links a');
  
  navLinks.forEach(link => {
    const linkPath = link.getAttribute('href');
    // Basic match: if path ends with matching filename
    if (currentPath.endsWith(linkPath) || (currentPath === '/' && linkPath === 'index.html')) {
      link.classList.add('active');
      link.setAttribute('aria-current', 'page');
    } else {
      link.classList.remove('active');
      link.removeAttribute('aria-current');
    }
  });
}

/**
 * Screen Reader & Accessibility Helper Listeners
 * Fixes for skip-link focus targets.
 */
function initAccessibilityHelpers() {
  const skipLink = document.querySelector('.skip-link');
  if (skipLink) {
    skipLink.addEventListener('click', (e) => {
      const target = document.querySelector(skipLink.getAttribute('href'));
      if (target) {
        target.setAttribute('tabindex', '-1');
        target.focus();
      }
    });
  }
}

/**
 * Projects Filtering
 * Handles showing/hiding projects dynamically and announcing results to screen readers.
 */
function initProjectsFilter() {
  const filterContainer = document.querySelector('.filter-tabs');
  if (!filterContainer) return;

  const buttons = filterContainer.querySelectorAll('.filter-btn');
  const projects = document.querySelectorAll('.project-card');

  buttons.forEach(button => {
    button.addEventListener('click', () => {
      const filter = button.getAttribute('data-filter');

      // Update button states
      buttons.forEach(btn => {
        btn.classList.remove('active');
        btn.setAttribute('aria-pressed', 'false');
      });
      button.classList.add('active');
      button.setAttribute('aria-pressed', 'true');

      let visibleCount = 0;

      // Filter projects
      projects.forEach(project => {
        const category = project.getAttribute('data-category');
        if (filter === 'all' || category === filter) {
          project.style.display = 'flex';
          visibleCount++;
        } else {
          project.style.display = 'none';
        }
      });

      // Announce the filter results to screen readers
      const filterName = button.textContent.trim();
      announceToScreenReader(`Filtered projects to ${filterName}. Showing ${visibleCount} project${visibleCount === 1 ? '' : 's'}.`);
    });
  });
}

/**
 * Contact Form Validation & Accessibility Handler
 * Performs standard validations, updates aria-describedby with error details,
 * focuses the first invalid element on failure, and announces outcomes to screen readers.
 */
function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  const nameInput = document.getElementById('form-name');
  const emailInput = document.getElementById('form-email');
  const messageInput = document.getElementById('form-message');

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    let isFormValid = true;
    let firstInvalidElement = null;
    let errorList = [];

    // Clear previous errors
    [nameInput, emailInput, messageInput].forEach(input => {
      input.classList.remove('invalid');
      input.setAttribute('aria-invalid', 'false');
      const errorMsg = document.getElementById(`${input.id}-error`);
      if (errorMsg) errorMsg.style.display = 'none';
    });

    // Validate Name
    if (!nameInput.value.trim()) {
      isFormValid = false;
      nameInput.classList.add('invalid');
      nameInput.setAttribute('aria-invalid', 'true');
      const errorMsg = document.getElementById('form-name-error');
      if (errorMsg) errorMsg.style.display = 'flex';
      errorList.push('Name is required');
      if (!firstInvalidElement) firstInvalidElement = nameInput;
    }

    // Validate Email
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailInput.value.trim()) {
      isFormValid = false;
      emailInput.classList.add('invalid');
      emailInput.setAttribute('aria-invalid', 'true');
      const errorMsg = document.getElementById('form-email-error');
      if (errorMsg) {
        errorMsg.textContent = 'Email address is required.';
        errorMsg.style.display = 'flex';
      }
      errorList.push('Email is required');
      if (!firstInvalidElement) firstInvalidElement = emailInput;
    } else if (!emailPattern.test(emailInput.value.trim())) {
      isFormValid = false;
      emailInput.classList.add('invalid');
      emailInput.setAttribute('aria-invalid', 'true');
      const errorMsg = document.getElementById('form-email-error');
      if (errorMsg) {
        errorMsg.textContent = 'Please enter a valid email address (e.g. user@example.com).';
        errorMsg.style.display = 'flex';
      }
      errorList.push('Email is invalid');
      if (!firstInvalidElement) firstInvalidElement = emailInput;
    }

    // Validate Message
    if (!messageInput.value.trim()) {
      isFormValid = false;
      messageInput.classList.add('invalid');
      messageInput.setAttribute('aria-invalid', 'true');
      const errorMsg = document.getElementById('form-message-error');
      if (errorMsg) {
        errorMsg.style.display = 'flex';
      }
      errorList.push('Message is required');
      if (!firstInvalidElement) firstInvalidElement = messageInput;
    } else if (messageInput.value.trim().length < 10) {
      isFormValid = false;
      messageInput.classList.add('invalid');
      messageInput.setAttribute('aria-invalid', 'true');
      const errorMsg = document.getElementById('form-message-error');
      if (errorMsg) {
        errorMsg.textContent = 'Message must be at least 10 characters long.';
        errorMsg.style.display = 'flex';
      }
      errorList.push('Message is too short');
      if (!firstInvalidElement) firstInvalidElement = messageInput;
    }

    if (isFormValid) {
      // Simulate successful form submission
      announceToScreenReader('Success! Thank you, your message has been sent successfully. I will get back to you shortly.');
      
      // Show success alert visually
      const formCard = document.querySelector('.contact-form-box');
      if (formCard) {
        formCard.innerHTML = `
          <div role="alert" style="text-align: center; padding: 2rem 0;">
            <svg style="width: 4rem; height: 4rem; color: var(--accent); margin-bottom: 1.5rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true" width="64" height="64">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <h2 class="card-title" style="font-size: 1.5rem; margin-bottom: 0.5rem;">Message Sent!</h2>
            <p style="color: var(--text-muted); margin-bottom: 1.5rem;">Thank you for reaching out. I'll get back to you within 24 hours.</p>
            <button onclick="window.location.reload();" class="btn btn-primary">Send Another Message</button>
          </div>
        `;
      }
    } else {
      // Announce errors to screen reader
      const errorMsgCount = errorList.length;
      announceToScreenReader(`Form submission failed. Please correct the ${errorMsgCount} highlighted error${errorMsgCount === 1 ? '' : 's'} and submit again.`);
      
      // Focus first invalid element to assist keyboard/screen-reader users
      if (firstInvalidElement) {
        firstInvalidElement.focus();
      }
    }
  });
}