
export async function generateStoryPDF(story: any, storyPages: any[]): Promise<Uint8Array> {
  // Simple HTML-based PDF generation using Puppeteer-like approach
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { 
          margin: 0; 
          padding: 40px; 
          font-family: 'Georgia', serif; 
          background: #f8f9fa;
        }
        .story-container { 
          max-width: 800px; 
          margin: 0 auto; 
          background: white; 
          border-radius: 12px; 
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }
        .story-header { 
          background: linear-gradient(135deg, #8B5CF6, #EC4899); 
          color: white; 
          padding: 40px; 
          text-align: center; 
        }
        .story-title { 
          font-size: 36px; 
          font-weight: bold; 
          margin: 0; 
          text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        .story-subtitle { 
          font-size: 18px; 
          margin-top: 10px; 
          opacity: 0.9; 
        }
        .page { 
          page-break-inside: avoid; 
          margin: 40px; 
          text-align: center; 
        }
        .page-number { 
          font-size: 24px; 
          font-weight: bold; 
          color: #8B5CF6; 
          margin-bottom: 20px; 
        }
        .page-image { 
          max-width: 100%; 
          height: auto; 
          border-radius: 8px; 
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          margin-bottom: 20px;
        }
        .footer { 
          text-align: center; 
          padding: 20px; 
          color: #666; 
          border-top: 1px solid #eee; 
          margin-top: 40px; 
        }
        @media print {
          .page { page-break-after: always; }
          .page:last-child { page-break-after: auto; }
        }
      </style>
    </head>
    <body>
      <div class="story-container">
        <div class="story-header">
          <h1 class="story-title">${story.title}</h1>
          <p class="story-subtitle">✨ A StoryMagic Creation</p>
        </div>
        
        ${storyPages.map(page => `
          <div class="page">
            <div class="page-number">Page ${page.page_number}</div>
            ${page.generated_image_url ? 
              `<img class="page-image" src="${page.generated_image_url}" alt="Page ${page.page_number}" />` : 
              `<div style="padding: 60px; background: #f5f5f5; border-radius: 8px; color: #666;">Image not available</div>`
            }
          </div>
        `).join('')}
        
        <div class="footer">
          <p>Created with StoryMagic - Transform children's drawings into magical storybooks</p>
          <p style="font-size: 12px; margin-top: 10px;">Visit us at your-domain.com to create your own magical stories!</p>
        </div>
      </div>
    </body>
    </html>
  `;

  // Convert HTML to PDF using a simple approach
  // Note: In a production environment, you'd use Puppeteer or a similar tool
  // For now, we'll use a text-based PDF generation
  const pdfContent = await generateSimplePDF(html, story.title);
  return pdfContent;
}

async function generateSimplePDF(html: string, title: string): Promise<Uint8Array> {
  // This is a simplified PDF generation
  // In production, you'd use libraries like Puppeteer, jsPDF, or PDFKit
  
  const pdfHeader = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 5 0 R
>>
>>
>>
endobj

4 0 obj
<<
/Length ${title.length + 100}
>>
stream
BT
/F1 24 Tf
100 700 Td
(${title}) Tj
0 -50 Td
/F1 12 Tf
(Generated Story PDF) Tj
0 -30 Td
(This story was shared with you via StoryMagic) Tj
0 -30 Td
(Visit the website to view the full interactive story) Tj
ET
endstream
endobj

5 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj

xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000079 00000 n 
0000000136 00000 n 
0000000271 00000 n 
0000000${400 + title.length} 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
${500 + title.length}
%%EOF`;

  return new TextEncoder().encode(pdfHeader);
}
