import React from 'react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  // Simple markdown parser for basic formatting
  const parseMarkdown = (text: string): string => {
    let html = text;
    
    // Headers - with high contrast white text
    html = html.replace(/^### (.*$)/gim, '<h3 class="text-xl font-semibold mb-3 mt-6 text-white">$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold mb-4 mt-8 text-white">$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold mb-6 mt-8 text-white">$1</h1>');
    
    // Bold and italic - with high contrast
    html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong class="font-bold text-white"><em class="italic">$1</em></strong>');
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-white">$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em class="italic text-white/95">$1</em>');
    
    // Links - with high contrast and accessible colors
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-300 hover:text-blue-200 underline font-medium" target="_blank" rel="noopener noreferrer">$1</a>');
    
    // Code blocks - with high contrast background
    html = html.replace(/```([\s\S]*?)```/g, '<pre class="bg-gray-900/80 border border-gray-700 p-4 rounded-lg overflow-x-auto my-4"><code class="text-sm text-gray-100">$1</code></pre>');
    
    // Inline code - with high contrast
    html = html.replace(/`([^`]+)`/g, '<code class="bg-gray-800/80 border border-gray-700 px-2 py-1 rounded text-sm text-gray-100">$1</code>');
    
    // Lists - Remove manual bullet points, let CSS handle styling with high contrast
    html = html.replace(/^\* (.+)$/gm, '<li class="ml-4 mb-1 text-white/95">$1</li>');
    html = html.replace(/^- (.+)$/gm, '<li class="ml-4 mb-1 text-white/95">$1</li>');
    html = html.replace(/^\d+\. (.+)$/gm, '<li class="ml-4 mb-1 list-decimal text-white/95">$1</li>');
    
    // Wrap consecutive list items
    html = html.replace(/(<li[^>]*>.*<\/li>\s*)+/g, '<ul class="markdown-list space-y-1 my-4">$&</ul>');
    
    // Line breaks
    html = html.replace(/\n\n/g, '</p><p class="mb-4 text-white/90">');
    html = html.replace(/\n/g, '<br>');
    
    // Wrap in paragraphs if not already wrapped - with high contrast
    if (!html.includes('<p>') && !html.includes('<h1>') && !html.includes('<h2>') && !html.includes('<h3>')) {
      html = `<p class="mb-4 text-white/90">${html}</p>`;
    } else if (!html.startsWith('<')) {
      html = `<p class="mb-4 text-white/90">${html}`;
    }
    
    // Tables (basic support) - with high contrast
    const tableRegex = /\|(.+)\|\n\|[-\s|]+\|\n((?:\|.+\|\n?)*)/g;
    html = html.replace(tableRegex, (match, header, rows) => {
      const headerCells = header.split('|').map((cell: string) => cell.trim()).filter((cell: string) => cell);
      const rowsArray = rows.trim().split('\n').map((row: string) => 
        row.split('|').map((cell: string) => cell.trim()).filter((cell: string) => cell)
      );
      
      let table = '<table class="w-full border-collapse border border-gray-600 my-4">';
      table += '<thead><tr>';
      headerCells.forEach((cell: string) => {
        table += `<th class="border border-gray-600 px-4 py-2 bg-gray-800/80 font-semibold text-left text-white">${cell}</th>`;
      });
      table += '</tr></thead><tbody>';
      
      rowsArray.forEach((row: string[]) => {
        table += '<tr>';
        row.forEach((cell: string) => {
          table += `<td class="border border-gray-600 px-4 py-2 text-white/90">${cell}</td>`;
        });
        table += '</tr>';
      });
      
      table += '</tbody></table>';
      return table;
    });
    
    return html;
  };

  return (
    <div 
      className={`prose prose-lg max-w-none prose-invert ${className}`}
      dangerouslySetInnerHTML={{ __html: parseMarkdown(content) }}
    />
  );
}
