// Function to apply the selected theme
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  updateThemeIcon(theme);
}

// Function to toggle between light and dark themes
function toggleTheme() {
  const currentTheme = localStorage.getItem('theme') || 'light';
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  applyTheme(newTheme);
}

// Function to update the theme icon
function updateThemeIcon(theme) {
  const themeIcon = document.getElementById('theme-icon');
  if (theme === 'dark') {
    themeIcon.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"></path>
      </svg>`;
  } else {
    themeIcon.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="5"></circle>
        <line x1="12" y1="1" x2="12" y2="3"></line>
        <line x1="12" y1="21" x2="12" y2="23"></line>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
        <line x1="1" y1="12" x2="3" y2="12"></line>
        <line x1="21" y1="12" x2="23" y2="12"></line>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
      </svg>`;
  }
}

// Apply the saved theme on page load
document.addEventListener('DOMContentLoaded', () => {
  const savedTheme = localStorage.getItem('theme') || 'light';
  applyTheme(savedTheme);

  // Add event listener to the theme toggle button
  const themeToggleButton = document.getElementById('theme-toggle-button');
  themeToggleButton.addEventListener('click', toggleTheme);
});
