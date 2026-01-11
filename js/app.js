// Configuration
const config = {
    contentPath: 'content',
    journalPath: 'journal'
};

// Page content mapping
const pageContent = {
    'index': null,
    'study': null,
    'showcase': null,
    'journal': null,
    'about': null,
    'connect': null
};

// Preload all page content
async function preloadPages() {
    const pages = ['index', 'study', 'showcase', 'journal', 'about', 'connect'];
    
    for (const page of pages) {
        try {
            const response = await fetch(`${page}.html`);
            const html = await response.text();
            pageContent[page] = html;
        } catch (error) {
            console.error(`Error preloading ${page}.html:`, error);
        }
    }
}

// Load specific page content
async function loadPageContent(pageName) {
    try {
        // Show loading state
        document.querySelector('.main-content').innerHTML = '<div class="loading">Loading...</div>';
        
        // Get cached content or fetch if not loaded
        let htmlContent = pageContent[pageName];
        if (!htmlContent) {
            const response = await fetch(`${pageName}.html`);
            htmlContent = await response.text();
            pageContent[pageName] = htmlContent;
        }
        
        // Extract main content from the HTML
        const temp = document.createElement('div');
        temp.innerHTML = htmlContent;
        const mainContent = temp.querySelector('.main-content');
        
        if (mainContent) {
            document.querySelector('.main-content').innerHTML = mainContent.innerHTML;
        } else {
            document.querySelector('.main-content').innerHTML = htmlContent;
        }
        
        // Update navigation highlighting
        updateActiveNav();
        
        // Initialize page-specific functionality
        if (pageName === 'journal') {
            loadJournalList();
        }
        
        // Render math and highlight code
        renderMathInElement(document.body, {
            delimiters: [
                {left: "$$", right: "$$", display: true},
                {left: "$", right: "$", display: false},
                {left: "\\(", right: "\\)", display: false},
                {left: "\\[", right: "\\]", display: true}
            ]
        });
        hljs.highlightAll();
        
    } catch (error) {
        console.error('Error loading page:', error);
        document.querySelector('.main-content').innerHTML = '<div class="error">Page not found</div>';
    }
}

// Get current page from URL
function getCurrentPage() {
    const path = window.location.pathname.split('/').pop().replace('.html', '') || 'index';
    const pageMap = {
        '': 'index',
        'index': 'index',
        'study': 'study',
        'showcase': 'showcase',
        'journal': 'journal',
        'about': 'about',
        'connect': 'connect'
    };
    return pageMap[path] || 'index';
}

// Navigate to page with clean URL
function navigateTo(page) {
    // Update URL without .html
    history.pushState({page}, '', '/' + (page === 'index' ? '' : page));
    loadPageContent(page);
}

// Update active navigation state
function updateActiveNav() {
    // Remove active class from all links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Add active class to current page
    const currentPage = getCurrentPage();
    const activeLink = document.querySelector(`[data-page="${currentPage}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
}

// Handle back/forward buttons
window.addEventListener('popstate', function(event) {
    const page = getCurrentPage();
    loadPageContent(page);
    updateActiveNav();
});

// Initialize navigation on page load
document.addEventListener('DOMContentLoaded', async function() {
    // Preload all pages
    await preloadPages();
    
    // Load current page
    const currentPage = getCurrentPage();
    loadPageContent(currentPage);
    updateActiveNav();
    
    // Make navigation links use client-side navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.getAttribute('data-page');
            navigateTo(page);
        });
    });
});

// AUTO-DETECT JOURNAL FILES FUNCTION
async function getAllJournalFiles() {
    try {
        // Fetch a directory listing (this requires server support)
        // Alternative: We'll try common patterns
        const possibleFiles = [];
        
        // Generate recent dates for the past 30 days
        for (let i = 0; i < 30; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD format
            possibleFiles.push(`${dateString}-journal.md`);
        }
        
        // Also add some common historical dates
        const historicalDates = [
            '2025-12-31-journal.md',
            '2025-12-30-journal.md',
            '2025-12-29-journal.md'
        ];
        
        const allPossibleFiles = [...possibleFiles, ...historicalDates];
        const validFiles = [];
        
        // Check which files actually exist
        for (const file of allPossibleFiles) {
            try {
                const response = await fetch(`${config.journalPath}/${file}`);
                if (response.ok) {
                    validFiles.push(file);
                }
            } catch (error) {
                // File doesn't exist, continue
            }
        }
        
        return validFiles.sort().reverse(); // Sort by date, newest first
        
    } catch (error) {
        console.error('Error detecting journal files:', error);
        
        // Fallback to manual list if auto-detection fails
        return [
            '2026-01-11-journal.md',
            '2026-01-10-journal.md',
            '2026-01-09-journal.md',
            '2026-01-08-journal.md'
        ];
    }
}

// Load journal list with auto-detection
async function loadJournalList() {
    try {
        const journalFiles = await getAllJournalFiles();
        
        if (journalFiles.length === 0) {
            document.getElementById('journal-list').innerHTML = `
                <div class="empty-state">
                    <p>No journal entries found. Create your first entry!</p>
                    <p>Format: YYYY-MM-DD-journal.md</p>
                </div>
            `;
            return;
        }
        
        let journalHTML = '';
        
        for (const file of journalFiles) {
            try {
                const response = await fetch(`${config.journalPath}/${file}`);
                const content = await response.text();
                
                // Extract frontmatter and content
                const { frontmatter, body } = parseFrontmatter(content);
                
                // Create date object for sorting
                let dateStr = 'Invalid Date';
                let title = 'Untitled Entry';
                
                if (frontmatter && frontmatter.date) {
                    try {
                        const dateObj = new Date(frontmatter.date);
                        dateStr = dateObj.toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                        });
                    } catch (e) {
                        dateStr = 'Invalid Date';
                    }
                }
                
                if (frontmatter && frontmatter.title) {
                    title = frontmatter.title;
                }
                
                journalHTML += `
                    <div class="journal-entry" onclick="loadJournalEntry('${file}')">
                        <h3>${dateStr} — ${title}</h3>
                        <div class="entry-meta">
                            ${frontmatter && frontmatter.tags ? frontmatter.tags.map(tag => `<span>${tag}</span>`).join('') : ''}
                        </div>
                        <p>${extractFirstParagraph(body)}</p>
                        <a href="#" class="read-more" onclick="loadJournalEntry('${file}'); event.preventDefault();">Read full entry →</a>
                    </div>
                `;
            } catch (error) {
                console.error(`Error loading journal file ${file}:`, error);
                journalHTML += `
                    <div class="journal-entry">
                        <h3>Error Loading Entry</h3>
                        <p>There was an error loading this journal entry.</p>
                    </div>
                `;
            }
        }
        
        document.getElementById('journal-list').innerHTML = journalHTML;
        
    } catch (error) {
        console.error('Error loading journal list:', error);
        document.getElementById('journal-list').innerHTML = '<div class="error">Error loading journal entries</div>';
    }
}

// Parse frontmatter from MD files
function parseFrontmatter(content) {
    const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
    const match = content.match(frontmatterRegex);
    
    if (match) {
        const frontmatter = match[1];
        const body = match[2];
        
        // Simple YAML parser for frontmatter
        const frontmatterObj = {};
        const lines = frontmatter.split('\n');
        
        for (const line of lines) {
            const colonIndex = line.indexOf(':');
            if (colonIndex > 0) {
                const key = line.substring(0, colonIndex).trim();
                let value = line.substring(colonIndex + 1).trim();
                
                // Handle array values
                if (value.startsWith('[') && value.endsWith(']')) {
                    value = value.substring(1, value.length - 1).split(',').map(v => v.trim().replace(/['"]/g, ''));
                } else {
                    value = value.replace(/['"]/g, '');
                }
                
                frontmatterObj[key] = value;
            }
        }
        
        return { frontmatter: frontmatterObj, body };
    }
    
    return { frontmatter: {}, body: content };
}

// Extract first paragraph for preview
function extractFirstParagraph(markdown) {
    const lines = markdown.split('\n');
    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('---')) {
            return trimmed.substring(0, 150) + (trimmed.length > 150 ? '...' : '');
        }
    }
    return 'No preview available';
}

// Load specific journal entry
async function loadJournalEntry(filename) {
    try {
        const response = await fetch(`${config.journalPath}/${filename}`);
        const content = await response.text();
        
        // Extract frontmatter and content
        const { frontmatter, body } = parseFrontmatter(content);
        
        // Convert markdown to HTML
        const htmlContent = marked.parse(body);
        
        // Update the page to show journal detail
        document.querySelector('.journal-feed').style.display = 'none';
        document.getElementById('journal-detail').style.display = 'block';
        
        let dateStr = 'Invalid Date';
        let title = 'Untitled Entry';
        
        if (frontmatter && frontmatter.date) {
            try {
                const dateObj = new Date(frontmatter.date);
                dateStr = dateObj.toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                });
            } catch (e) {
                dateStr = 'Invalid Date';
            }
        }
        
        if (frontmatter && frontmatter.title) {
            title = frontmatter.title;
        }
        
        document.getElementById('journal-content').innerHTML = `
            <article class="markdown-content">
                <h1>${title}</h1>
                <p class="journal-date">${dateStr}</p>
                <div class="journal-tags">
                    ${frontmatter && frontmatter.tags ? frontmatter.tags.map(tag => `<span class="tag">${tag}</span>`).join(' ') : ''}
                </div>
                ${htmlContent}
            </article>
        `;
        
        // Highlight code blocks
        hljs.highlightAll();
        
        // Render math equations
        renderMathInElement(document.getElementById('journal-content'), {
            delimiters: [
                {left: "$$", right: "$$", display: true},
                {left: "$", right: "$", display: false},
                {left: "\\(", right: "\\)", display: false},
                {left: "\\[", right: "\\]", display: true}
            ]
        });
        
        // Add back button functionality
        document.getElementById('back-to-list').onclick = function() {
            document.getElementById('journal-detail').style.display = 'none';
            document.querySelector('.journal-feed').style.display = 'block';
        };
        
    } catch (error) {
        console.error('Error loading journal entry:', error);
        document.getElementById('journal-content').innerHTML = '<div class="error">Error loading journal entry</div>';
    }
}

// Utility function for other pages
async function loadSpecificFile(folder, filename) {
    try {
        const response = await fetch(`${config.contentPath}/${folder}/${filename}`);
        const markdown = await response.text();
        const html = marked.parse(markdown);
        
        document.getElementById('main-content').innerHTML = `
            <article class="markdown-content">
                ${html}
            </article>
        `;
        
        hljs.highlightAll();
        renderMathInElement(document.querySelector('.markdown-content'));
    } catch (error) {
        console.error('Error loading file:', error);
    }
}