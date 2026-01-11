// Configuration
const config = {
    contentPath: 'content',
    fallbackContent: {
        index: '# Welcome to My Study Space\n\nThis is my digital laboratory for learning, thinking, and creating.\n\n## Current Focus\n\n- Mathematics\n- Physics\n- Computer Science\n- Competitive Programming',
        about: '# About Me\n\nStudent passionate about mathematics, physics, and programming.\n\n## Interests\n\n- Quantum Mechanics\n- Algorithms\n- Mathematical Modeling'
    }
};

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