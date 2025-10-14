// Table of Contents utilities

/**
 * Generate a URL-friendly ID from heading text
 * @param text - The heading text
 * @returns A URL-friendly ID
 */
export function getHeadingId(text: string): string {
  if (!text) return '';
  
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters except word chars, spaces, and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Extract headings from portable text content
 * @param content - The portable text content
 * @returns Array of heading objects with text and id
 */
export function extractHeadings(content: any[]): Array<{ text: string; id: string; level: number }> {
  const headings: Array<{ text: string; id: string; level: number }> = [];
  
  if (!Array.isArray(content)) return headings;
  
  function traverse(nodes: any[]) {
    for (const node of nodes) {
      if (node._type === 'block' && node.style && node.style.startsWith('h')) {
        const level = parseInt(node.style.substring(1));
        if (level >= 1 && level <= 6) {
          const text = extractTextFromBlock(node);
          if (text) {
            headings.push({
              text,
              id: getHeadingId(text),
              level
            });
          }
        }
      }
      
      if (node.children && Array.isArray(node.children)) {
        traverse(node.children);
      }
    }
  }
  
  traverse(content);
  return headings;
}

/**
 * Extract plain text from a block node
 * @param block - The block node
 * @returns Plain text content
 */
function extractTextFromBlock(block: any): string {
  if (!block.children || !Array.isArray(block.children)) return '';
  
  return block.children
    .map((child: any) => {
      if (child.text) return child.text;
      if (child.children && Array.isArray(child.children)) {
        return extractTextFromBlock(child);
      }
      return '';
    })
    .join('');
}

/**
 * Generate a table of contents from headings
 * @param headings - Array of heading objects
 * @returns HTML string for table of contents
 */
export function generateTableOfContents(headings: Array<{ text: string; id: string; level: number }>): string {
  if (headings.length === 0) return '';
  
  let html = '<div class="toc-container bg-gray-50 dark:bg-gray-800 rounded-lg p-6 mb-8">';
  html += '<h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4">📋 Table of Contents</h3>';
  html += '<ul class="space-y-2">';
  
  let currentLevel = 0;
  
  for (const heading of headings) {
    if (heading.level > currentLevel) {
      // Open new nested lists
      for (let i = currentLevel; i < heading.level - 1; i++) {
        html += '<ul class="ml-4 space-y-1">';
      }
    } else if (heading.level < currentLevel) {
      // Close nested lists
      for (let i = currentLevel; i > heading.level; i--) {
        html += '</ul>';
      }
    }
    
    html += `<li class="text-sm">
      <a href="#${heading.id}" class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline">
        ${heading.text}
      </a>
    </li>`;
    
    currentLevel = heading.level;
  }
  
  // Close any remaining nested lists
  for (let i = currentLevel; i > 0; i--) {
    html += '</ul>';
  }
  
  html += '</ul></div>';
  return html;
}
