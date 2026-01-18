/**
 * Utility to clean and beautify AI responses by removing markdown symbols
 * and formatting the content for professional display
 */

export const cleanMarkdown = (text: string): string => {
  if (!text) return '';
  
  let cleaned = text;
  
  // Remove markdown headers (# ## ### etc.)
  cleaned = cleaned.replace(/^#{1,6}\s+/gm, '');
  
  // Remove bold markers (**text** or __text__)
  cleaned = cleaned.replace(/\*\*(.+?)\*\*/g, '$1');
  cleaned = cleaned.replace(/__(.+?)__/g, '$1');
  
  // Remove italic markers (*text* or _text_)
  cleaned = cleaned.replace(/\*(.+?)\*/g, '$1');
  cleaned = cleaned.replace(/_(.+?)_/g, '$1');
  
  // Remove strikethrough (~~text~~)
  cleaned = cleaned.replace(/~~(.+?)~~/g, '$1');
  
  // Remove inline code markers (`code`)
  cleaned = cleaned.replace(/`(.+?)`/g, '$1');
  
  // Remove code block markers (```code```)
  cleaned = cleaned.replace(/```[\s\S]*?```/g, (match) => {
    // Extract just the code content without the markers
    return match.replace(/```\w*\n?/g, '').replace(/```/g, '');
  });
  
  // Remove list markers (- or * or + at start of line)
  cleaned = cleaned.replace(/^[\-\*\+]\s+/gm, '• ');
  
  // Remove numbered list markers (1. 2. etc.)
  cleaned = cleaned.replace(/^\d+\.\s+/gm, '');
  
  // Remove blockquote markers (>)
  cleaned = cleaned.replace(/^>\s+/gm, '');
  
  // Remove horizontal rules (---, ***, ___)
  cleaned = cleaned.replace(/^(\*{3,}|-{3,}|_{3,})$/gm, '');
  
  // Remove link markdown [text](url) - keep just the text
  cleaned = cleaned.replace(/\[(.+?)\]\(.+?\)/g, '$1');
  
  // Remove image markdown ![alt](url)
  cleaned = cleaned.replace(/!\[.*?\]\(.+?\)/g, '');
  
  // Clean up multiple consecutive newlines (more than 2)
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  
  // Trim leading and trailing whitespace
  cleaned = cleaned.trim();
  
  return cleaned;
};

/**
 * Parse and format text with proper line breaks and spacing
 */
export const formatText = (text: string): string => {
  const cleaned = cleanMarkdown(text);
  
  // Split into paragraphs
  const paragraphs = cleaned.split(/\n\n+/);
  
  // Join with proper spacing
  return paragraphs
    .map(p => p.trim())
    .filter(p => p.length > 0)
    .join('\n\n');
};

/**
 * Extract sections from formatted text based on common patterns
 */
export interface TextSection {
  title: string;
  content: string;
}

export const extractSections = (text: string): TextSection[] => {
  const cleaned = cleanMarkdown(text);
  const lines = cleaned.split('\n');
  const sections: TextSection[] = [];
  let currentSection: TextSection | null = null;
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Check if line looks like a title (all caps or title case, short length)
    if (trimmed.length > 0 && trimmed.length < 100 && 
        (trimmed === trimmed.toUpperCase() || /^[A-Z][a-z]+(\s+[A-Z][a-z]+)*:?$/.test(trimmed))) {
      // Save previous section if exists
      if (currentSection) {
        sections.push(currentSection);
      }
      // Start new section
      currentSection = {
        title: trimmed.replace(/:$/, ''),
        content: ''
      };
    } else if (currentSection && trimmed.length > 0) {
      // Add to current section content
      currentSection.content += (currentSection.content ? '\n' : '') + trimmed;
    } else if (!currentSection && trimmed.length > 0) {
      // No section yet, create a default one
      currentSection = {
        title: 'Content',
        content: trimmed
      };
    }
  }
  
  // Add last section
  if (currentSection) {
    sections.push(currentSection);
  }
  
  return sections;
};
