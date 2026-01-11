// Configuration with clean URLs
const config = {
    contentPath: 'content',
    pageMap: {
        '': 'index',
        'index': 'index',
        'study': 'study',
        'showcase': 'showcase',
        'journal': 'journal',
        'about': 'about',
        'connect': 'connect'
    }
};

// Get current page from URL
function getCurrentPage() {
    const path = window.location.pathname.split('/').pop().replace('.html', '') || 'index';
    return config.pageMap[path] || 'index';
}

// Update navigation to use clean URLs
function navigateTo(page) {
    history.pushState({page}, '', '/' + (page === 'index' ? '' : page));
    loadPageContent(page);
}

// Modified loadPage function
async function loadPageContent(pageName) {
    try {
        document.getElementById('main-content').innerHTML = '<div class="loading">Loading...</div>';
        
        // Map clean URL names to actual files
        const fileName = pageName === 'index' ? 'index' : pageName;
        const response = await fetch(`${fileName}.html`);
        const html = await response.text();
        
        // Extract main content from the fetched HTML
        const temp = document.createElement('div');
        temp.innerHTML = html;
        const mainContent = temp.querySelector('.main-content');
        
        if (mainContent) {
            document.getElementById('main-content').innerHTML = mainContent.innerHTML;
        } else {
            document.getElementById('main-content').innerHTML = html;
        }
        
        // Update navigation highlighting
        updateActiveNav();
        
    } catch (error) {
        console.error('Error loading page:', error);
        document.getElementById('main-content').innerHTML = '<div class="error">Page not found</div>';
    }
}

function updateActiveNav() {
    // Remove active class from all links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Add active class to current page
    const currentPage = getCurrentPage();
    const activeLink = document.querySelector(`a[href="${currentPage === 'index' ? '/' : currentPage}.html"]`) || 
                      document.querySelector(`a[href="/${currentPage}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
}

// Handle back/forward buttons
window.addEventListener('popstate', function(event) {
    const page = getCurrentPage();
    loadPageContent(page);
});

// Initialize on load
document.addEventListener('DOMContentLoaded', function() {
    const page = getCurrentPage();
    loadPageContent(page);
    
    // Make navigation links use clean URLs
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const href = this.getAttribute('href').replace('.html', '');
            navigateTo(href);
        });
    });
});

// Main content loader
async function loadPage(pageName) {
    try {
        // Show loading state
        document.getElementById('main-content').innerHTML = '<div class="loading">Loading...</div>';
        
        // Determine which file to load
        let filePath;
        if (pageName === 'index' || pageName === 'about') {
            filePath = `${pageName}.md`;
        } else {
            // For study, journal, showcase - load from content folder
            const folderMap = {
                study: 'study-notes/calculus-notes.md',
                journal: 'journal/2026-01-11-journal.md',
                showcase: 'projects/contest-wins.md'
            };
            filePath = folderMap[pageName] || 'study-notes/calculus-notes.md';
        }

        // Try to fetch the markdown file
        let markdownContent;
        try {
            const response = await fetch(`${config.contentPath}/${filePath}`);
            if (!response.ok) throw new Error('File not found');
            markdownContent = await response.text();
        } catch (error) {
            // Fallback to default content if file doesn't exist
            markdownContent = config.fallbackContent[pageName] || '# Page Not Found';
        }

        // Convert markdown to HTML
        const htmlContent = marked.parse(markdownContent);

        // Insert content
        document.getElementById('main-content').innerHTML = `
            <article class="markdown-content">
                ${htmlContent}
            </article>
        `;

        // Highlight code blocks
        hljs.highlightAll();

        // Render math equations
        renderMathInElement(document.querySelector('.markdown-content'), {
            delimiters: [
                {left: "$$", right: "$$", display: true},
                {left: "$", right: "$", display: false},
                {left: "\\(", right: "\\)", display: false},
                {left: "\\[", right: "\\]", display: true}
            ]
        });

    } catch (error) {
        console.error('Error loading page:', error);
        document.getElementById('main-content').innerHTML = `
            <div class="error">
                <h2>Error Loading Content</h2>
                <p>Please check if the markdown files exist in the content folder.</p>
            </div>
        `;
    }
}

// Utility function to load specific content files
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

// Enhanced navigation for specific content
function loadStudyNote(noteName) {
    loadSpecificFile('study-notes', noteName);
}

function loadJournalEntry(date) {
    loadSpecificFile('journal', `${date}-journal.md`);
}

function loadProject(projectName) {
    loadSpecificFile('projects', projectName);
}

// Initialize math rendering for static pages
document.addEventListener('DOMContentLoaded', function() {
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