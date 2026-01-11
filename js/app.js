// Configuration
const config = {
    contentPath: 'content',
    journalPath: 'journal'
};

// Page content mapping
const pageContent = {
    'index': () => {
        window.location.href = 'index.html';
    },
    'study': () => {
        window.location.href = 'study.html';
    },
    'showcase': () => {
        window.location.href = 'showcase.html';
    },
    'journal': () => {
        window.location.href = 'journal.html';
    },
    'about': () => {
        window.location.href = 'about.html';
    },
    'connect': () => {
        window.location.href = 'connect.html';
    }
};

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
    
    // Update active navigation
    updateActiveNav();
    
    // Redirect to actual HTML file
    if (pageContent[page]) {
        pageContent[page]();
    }
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
    updateActiveNav();
});

// Initialize navigation on page load
document.addEventListener('DOMContentLoaded', function() {
    // Update navigation based on current URL
    updateActiveNav();
    
    // Make navigation links use clean URLs
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.getAttribute('data-page');
            navigateTo(page);
        });
    });
    
    // Initialize journal page if on journal page
    if (getCurrentPage() === 'journal') {
        loadJournalList();
    }
    
    // Render math in static content
    renderMathInElement(document.body, {
        delimiters: [
            {left: "$$", right: "$$", display: true},
            {left: "$", right: "$", display: false},
            {left: "\\(", right: "\\)", display: false},
            {left: "\\[", right: "\\]", display: true}
        ]
    });
    
    // Highlight code blocks
    hljs.highlightAll();
});

// JOURNAL-SPECIFIC FUNCTIONS (only on journal page)
async function loadJournalList() {
    try {
        const journalFiles = [
            '2026-01-11-journal.md',
            '2026-01-10-journal.md',
            '2026-01-09-journal.md',
            '2026-01-08-journal.md'
        ];
        
        let journalHTML = '';
        
        for (const file of journalFiles) {
            try {
                const response = await fetch(`${config.journalPath}/${file}`);
                const content = await response.text();
                
                // Extract frontmatter and content
                const { frontmatter, body } = parseFrontmatter(content);
                
                // Create date object for sorting
                const dateObj = new Date(frontmatter.date);
                const dateStr = dateObj.toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                });
                
                journalHTML += `
                    <div class="journal-entry" onclick="loadJournalEntry('${file}')">
                        <h3>${dateStr} — ${frontmatter.title}</h3>
                        <div class="entry-meta">
                            ${frontmatter.tags ? frontmatter.tags.map(tag => `<span>${tag}</span>`).join('') : ''}
                        </div>
                        <p>${extractFirstParagraph(body)}</p>
                        <a href="#" class="read-more" onclick="loadJournalEntry('${file}'); event.preventDefault();">Read full entry →</a>
                    </div>
                `;
            } catch (error) {
                console.error(`Error loading journal file ${file}:`, error);
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
        
        document.getElementById('journal-content').innerHTML = `
            <article class="markdown-content">
                <h1>${frontmatter.title}</h1>
                <p class="journal-date">${new Date(frontmatter.date).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                })}</p>
                <div class="journal-tags">
                    ${frontmatter.tags ? frontmatter.tags.map(tag => `<span class="tag">${tag}</span>`).join(' ') : ''}
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