/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// --- Interfaces ---
interface Link {
  id: string;
  name: string;
  url: string;
}

// --- DOM Elements ---
const form = document.getElementById('add-link-form') as HTMLFormElement;
const linkNameInput = document.getElementById('link-name') as HTMLInputElement;
const linkUrlInput = document.getElementById('link-url') as HTMLInputElement;
const searchInput = document.getElementById('search-bar') as HTMLInputElement;
const linksContainer = document.getElementById('links-container') as HTMLElement;
const themeSwitcher = document.querySelector('.theme-switcher') as HTMLElement;

// --- State Management ---
let links: Link[] = [];
const CARD_COLORS = [
  '#ffadad', '#ffd6a5', '#fdffb6', '#caffbf', 
  '#9bf6ff', '#a0c4ff', '#bdb2ff', '#ffc6ff'
];

/**
 * Fetches links from localStorage.
 */
function loadLinksFromStorage(): void {
  const storedLinks = localStorage.getItem('savedLinks');
  if (storedLinks) {
    links = JSON.parse(storedLinks);
  }
}

/**
 * Saves links to localStorage.
 * @param {Link[]} linksToSave - The array of links to save.
 */
function saveLinksToStorage(linksToSave: Link[]): void {
  localStorage.setItem('savedLinks', JSON.stringify(linksToSave));
}

/**
 * Shuffles an array in place using the Fisher-Yates algorithm.
 * @param {any[]} array The array to shuffle.
 */
function shuffleArray(array: any[]): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]]; // Swap elements
  }
}

// --- Rendering ---

/**
 * Renders all saved links to the DOM, optionally filtering them.
 * @param {string} [searchTerm=''] - The term to filter links by name.
 */
function renderLinks(searchTerm: string = ''): void {
  linksContainer.innerHTML = '';

  const lowerCaseSearchTerm = searchTerm.trim().toLowerCase();
  const filteredLinks = lowerCaseSearchTerm
    ? links.filter(link => link.name.toLowerCase().includes(lowerCaseSearchTerm))
    : links;

  if (filteredLinks.length === 0) {
    if (links.length === 0) {
      linksContainer.innerHTML = '<p class="empty-message">Your shelf is empty. Add a link to get started!</p>';
    } else {
      linksContainer.innerHTML = `<p class="empty-message">No links found matching "${searchTerm}".</p>`;
    }
    return;
  }
  
  filteredLinks.forEach((link, index) => {
    const card = createLinkCard(link, index);
    linksContainer.appendChild(card);
  });
}

/**
 * Creates a DOM element for a single link.
 * @param {Link} link - The link object.
 * @param {number} index - The index of the link for color selection.
 * @returns {HTMLElement} The created link card element.
 */
function createLinkCard(link: Link, index: number): HTMLElement {
  const card = document.createElement('div');
  card.className = 'link-card';
  card.style.backgroundColor = CARD_COLORS[index % CARD_COLORS.length];
  card.dataset.id = link.id;

  const domain = new URL(link.url).hostname;
  const googleFaviconUrl = `https://www.google.com/s2/favicons?sz=64&domain_url=${domain}`;

  // A generic globe SVG icon used as a final fallback.
  const fallbackIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="rgba(0,0,0,0.5)"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>`;
  const fallbackIconDataUrl = `data:image/svg+xml;base64,${btoa(fallbackIconSvg)}`;

  const linkContent = document.createElement('a');
  linkContent.href = link.url;
  linkContent.target = '_blank';
  linkContent.rel = 'noopener noreferrer';
  linkContent.className = 'link-card-content';

  const favicon = document.createElement('img');
  favicon.className = 'favicon';
  favicon.alt = ""; // Decorative image
  favicon.src = googleFaviconUrl;
  
  // Implements a two-step fallback for the favicon.
  favicon.onerror = () => {
    // 1. Try DuckDuckGo's favicon service.
    if (!favicon.dataset.fallbackAttempted) {
      favicon.dataset.fallbackAttempted = 'true';
      favicon.src = `https://icons.duckduckgo.com/ip3/${domain}.ico`;
    } 
    // 2. If that fails, use the generic SVG icon.
    else {
      favicon.src = fallbackIconDataUrl;
      favicon.onerror = null; // Prevent infinite loops
    }
  };

  const linkName = document.createElement('span');
  linkName.className = 'link-name';
  linkName.textContent = link.name;

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'delete-btn';
  deleteBtn.setAttribute('aria-label', `Delete ${link.name}`);
  deleteBtn.innerHTML = '&times;';

  linkContent.appendChild(favicon);
  linkContent.appendChild(linkName);
  card.appendChild(linkContent);
  card.appendChild(deleteBtn);

  return card;
}


// --- Event Handlers ---

/**
 * Handles the form submission to add a new link.
 * @param {Event} e - The submit event.
 */
function handleAddLink(e: Event): void {
  e.preventDefault();
  const name = linkNameInput.value.trim();
  let url = linkUrlInput.value.trim();

  if (!name || !url) {
    return;
  }

  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  }
  
  try {
    // Validate URL format
    new URL(url);
  } catch (_) {
    alert('Please enter a valid URL.');
    return;
  }

  const newLink: Link = {
    id: `link-${Date.now()}`,
    name,
    url,
  };

  links.unshift(newLink);
  saveLinksToStorage(links);
  renderLinks(searchInput.value);
  form.reset();
  linkNameInput.focus();
}

/**
 * Handles clicks within the links container, specifically for deleting links.
 * @param {Event} e - The click event.
 */
function handleDeleteLink(e: Event): void {
    const target = e.target as HTMLElement;
    if (target.classList.contains('delete-btn')) {
        const card = target.closest<HTMLElement>('.link-card');
        if (card && card.dataset.id) {
            const linkId = card.dataset.id;
            const linkName = card.querySelector('.link-name')?.textContent || 'this link';
            if (confirm(`Are you sure you want to delete "${linkName}"?`)) {
                links = links.filter(link => link.id !== linkId);
                saveLinksToStorage(links);
                renderLinks(searchInput.value);
            }
        }
    }
}

/**
 * Handles input in the search bar to filter links in real-time.
 */
function handleSearch(): void {
  renderLinks(searchInput.value);
}

// --- Theme Management ---

/**
 * Applies a color theme to the application.
 * @param {string} theme - The name of the theme to apply ('light', 'dark', 'sepia').
 */
function applyTheme(theme: string): void {
    document.body.classList.remove('theme-dark', 'theme-sepia');
    if (theme === 'dark') {
        document.body.classList.add('theme-dark');
    } else if (theme === 'sepia') {
        document.body.classList.add('theme-sepia');
    }
    localStorage.setItem('theme', theme);

    // Update active button state
    const buttons = themeSwitcher.querySelectorAll<HTMLButtonElement>('.theme-btn');
    buttons.forEach(btn => {
        const isActive = btn.dataset.theme === theme;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-checked', String(isActive));
    });
}

/**
 * Loads the saved theme from localStorage and applies it.
 */
function loadTheme(): void {
    const savedTheme = localStorage.getItem('theme') || 'light';
    applyTheme(savedTheme);
}

/**
 * Handles clicks on the theme switcher buttons.
 * @param {Event} e - The click event.
 */
function handleThemeChange(e: Event): void {
    const target = e.target as HTMLElement;
    const themeButton = target.closest<HTMLButtonElement>('.theme-btn');
    if (themeButton && themeButton.dataset.theme) {
        applyTheme(themeButton.dataset.theme);
    }
}


// --- Initialization ---

/**
 * Initializes the application.
 */
function init(): void {
  form.addEventListener('submit', handleAddLink);
  linksContainer.addEventListener('click', handleDeleteLink);
  searchInput.addEventListener('input', handleSearch);
  themeSwitcher.addEventListener('click', handleThemeChange);
  
  loadTheme();
  loadLinksFromStorage();
  shuffleArray(CARD_COLORS); // Shuffle the colors on load
  renderLinks();
}

// Start the application
init();