
export async function generateStoryPDF(story: any, storyPages: any[]): Promise<Uint8Array> {
  console.log('🎨 Starting PDF generation for story:', story.title);
  console.log('📄 Number of pages to include:', storyPages.length);

  // Sort pages by page number
  const sortedPages = storyPages.sort((a: any, b: any) => a.page_number - b.page_number);

  // Create HTML content for the PDF
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { 
          margin: 0; 
          padding: 20px; 
          font-family: 'Georgia', serif; 
          background: #fff;
          color: #333;
        }
        .story-container { 
          max-width: 800px; 
          margin: 0 auto; 
        }
        .story-header { 
          background: linear-gradient(135deg, #8B5CF6, #EC4899); 
          color: white; 
          padding: 40px; 
          text-align: center; 
          border-radius: 12px;
          margin-bottom: 30px;
        }
        .story-title { 
          font-size: 32px; 
          font-weight: bold; 
          margin: 0; 
          text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        .story-subtitle { 
          font-size: 16px; 
          margin-top: 10px; 
          opacity: 0.9; 
        }
        .page { 
          page-break-inside: avoid; 
          margin: 30px 0; 
          text-align: center; 
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
        }
        .page-number { 
          font-size: 20px; 
          font-weight: bold; 
          color: #8B5CF6; 
          margin-bottom: 15px; 
        }
        .page-image { 
          max-width: 100%; 
          max-height: 400px;
          height: auto; 
          border-radius: 8px; 
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          margin-bottom: 15px;
        }
        .page-placeholder {
          width: 100%;
          height: 200px;
          background: #e5e7eb;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #6b7280;
          font-size: 14px;
          margin-bottom: 15px;
        }
        .footer { 
          text-align: center; 
          padding: 20px; 
          color: #666; 
          border-top: 2px solid #8B5CF6; 
          margin-top: 40px; 
        }
        .footer-title {
          font-size: 18px;
          font-weight: bold;
          color: #8B5CF6;
          margin-bottom: 10px;
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
          <p style="font-size: 14px; margin-top: 15px;">
            ${sortedPages.length} magical pages • Created with love
          </p>
        </div>
        
        ${sortedPages.map(page => `
          <div class="page">
            <div class="page-number">Page ${page.page_number}</div>
            ${page.generated_image_url ? 
              `<img class="page-image" src="${page.generated_image_url}" alt="Page ${page.page_number}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
               <div class="page-placeholder" style="display: none;">
                 📷 Image not available for Page ${page.page_number}
               </div>` : 
              `<div class="page-placeholder">
                 📷 Image not available for Page ${page.page_number}
               </div>`
            }
          </div>
        `).join('')}
        
        <div class="footer">
          <div class="footer-title">StoryMagic</div>
          <p>Transform children's drawings into magical storybooks</p>
          <p style="font-size: 12px; margin-top: 10px; color: #999;">
            This story was shared with love. Create your own magical stories at StoryMagic!
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  console.log('📝 HTML content generated, creating PDF...');

  try {
    // Create a simple PDF structure
    // Note: This is a basic implementation. In production, you'd use a proper PDF library
    const pdfContent = await createBasicPDF(story.title, htmlContent, sortedPages.length);
    console.log('✅ PDF generated successfully, size:', pdfContent.length, 'bytes');
    return pdfContent;
  } catch (error) {
    console.error('❌ PDF generation failed:', error);
    throw new Error(`PDF generation failed: ${error.message}`);
  }
}

async function createBasicPDF(title: string, htmlContent: string, pageCount: number): Promise<Uint8Array> {
  // This creates a basic PDF structure
  // In a production environment, you would use libraries like Puppeteer or PDFKit
  const timestamp = new Date().toISOString();
  const contentLength = htmlContent.length;
  
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
/Length ${title.length + 200}
>>
stream
BT
/F1 24 Tf
100 700 Td
(${title}) Tj
0 -50 Td
/F1 16 Tf
(StoryMagic Story - ${pageCount} Pages) Tj
0 -30 Td
/F1 12 Tf
(Generated on: ${timestamp}) Tj
0 -30 Td
(This magical story was shared with you!) Tj
0 -30 Td
(Visit StoryMagic to create your own magical stories) Tj
0 -50 Td
(Story contains ${pageCount} beautifully transformed pages) Tj
0 -30 Td
(Each page was created from children's drawings) Tj
0 -30 Td
(using AI magic to bring them to life!) Tj
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
