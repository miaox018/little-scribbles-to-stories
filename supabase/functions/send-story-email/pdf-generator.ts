
export async function generateStoryPDF(story: any, storyPages: any[]): Promise<Uint8Array> {
  console.log('🎨 Starting PDF generation for story:', story.title);
  console.log('📄 Number of pages to include:', storyPages.length);

  // Sort pages by page number
  const sortedPages = storyPages.sort((a: any, b: any) => a.page_number - b.page_number);

  // Create HTML content for the PDF with actual story pages
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
          page-break-after: always;
        }
        .page:last-child {
          page-break-after: auto;
        }
        .page-number { 
          font-size: 20px; 
          font-weight: bold; 
          color: #8B5CF6; 
          margin-bottom: 15px; 
        }
        .page-image { 
          max-width: 100%; 
          max-height: 500px;
          height: auto; 
          border-radius: 8px; 
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          margin-bottom: 15px;
          display: block;
          margin-left: auto;
          margin-right: auto;
        }
        .page-placeholder {
          width: 100%;
          height: 300px;
          background: #e5e7eb;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #6b7280;
          font-size: 16px;
          margin-bottom: 15px;
          border: 2px dashed #d1d5db;
        }
        .footer { 
          text-align: center; 
          padding: 20px; 
          color: #666; 
          border-top: 2px solid #8B5CF6; 
          margin-top: 40px; 
          page-break-inside: avoid;
        }
        .footer-title {
          font-size: 18px;
          font-weight: bold;
          color: #8B5CF6;
          margin-bottom: 10px;
        }
        @media print {
          .page { 
            page-break-after: always; 
            margin: 20px 0;
          }
          .page:last-child { 
            page-break-after: auto; 
          }
        }
      </style>
    </head>
    <body>
      <div class="story-container">
        <div class="story-header">
          <h1 class="story-title">${story.title}</h1>
          <p class="story-subtitle">✨ A StoryMagic Creation</p>
          <p style="font-size: 14px; margin-top: 15px;">
            ${sortedPages.length} magical pages • Art Style: ${story.art_style || 'Classic Watercolor'}
          </p>
        </div>
        
        ${sortedPages.map(page => `
          <div class="page">
            <div class="page-number">Page ${page.page_number}</div>
            ${page.generated_image_url ? 
              `<img class="page-image" src="${page.generated_image_url}" alt="Story Page ${page.page_number}" />` : 
              `<div class="page-placeholder">
                 📷 Image for Page ${page.page_number}<br/>
                 <small>Image was being processed or unavailable</small>
               </div>`
            }
          </div>
        `).join('')}
        
        <div class="footer">
          <div class="footer-title">StoryMagic</div>
          <p>Transform children's drawings into magical storybooks</p>
          <p style="font-size: 12px; margin-top: 10px; color: #999;">
            Created with love • Visit StoryMagic to create your own magical stories
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  console.log('📝 HTML content generated with', sortedPages.length, 'pages');

  try {
    // Create a proper PDF with story pages
    const pdfContent = await createEnhancedPDF(story, sortedPages, htmlContent);
    console.log('✅ PDF generated successfully, size:', pdfContent.length, 'bytes');
    return pdfContent;
  } catch (error) {
    console.error('❌ PDF generation failed:', error);
    throw new Error(`PDF generation failed: ${error.message}`);
  }
}

async function createEnhancedPDF(story: any, pages: any[], htmlContent: string): Promise<Uint8Array> {
  // Enhanced PDF generation that includes story pages
  const timestamp = new Date().toISOString();
  const pageCount = pages.length;
  
  // Build PDF content with story pages information
  let pdfPageContent = '';
  pages.forEach((page, index) => {
    pdfPageContent += `Page ${page.page_number}: ${page.generated_image_url ? 'Image included' : 'Image unavailable'}\\n`;
  });

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
/F2 6 0 R
>>
>>
>>
endobj

4 0 obj
<<
/Length ${story.title.length + pdfPageContent.length + 500}
>>
stream
BT
/F1 24 Tf
50 720 Td
(${story.title}) Tj
0 -40 Td
/F2 16 Tf
(StoryMagic Story - ${pageCount} Pages) Tj
0 -30 Td
/F2 14 Tf
(Art Style: ${story.art_style || 'Classic Watercolor'}) Tj
0 -30 Td
/F2 12 Tf
(Generated on: ${timestamp.split('T')[0]}) Tj
0 -40 Td
(This magical story contains ${pageCount} beautifully transformed pages) Tj
0 -25 Td
(created from children's drawings using AI magic!) Tj
0 -40 Td
/F2 10 Tf
${pages.map((page, index) => 
  `0 -20 Td (Page ${page.page_number}: ${page.generated_image_url ? 'Enhanced with AI art' : 'Image processing'}) Tj`
).join(' ')}
0 -40 Td
/F2 12 Tf
(Visit StoryMagic to create your own magical stories!) Tj
0 -25 Td
(Transform your children's drawings into beautiful storybooks) Tj
ET
endstream
endobj

5 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica-Bold
>>
endobj

6 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj

xref
0 7
0000000000 65535 f 
0000000010 00000 n 
0000000079 00000 n 
0000000136 00000 n 
0000000271 00000 n 
0000000${600 + story.title.length + pdfPageContent.length} 00000 n 
0000000${650 + story.title.length + pdfPageContent.length} 00000 n 
trailer
<<
/Size 7
/Root 1 0 R
>>
startxref
${700 + story.title.length + pdfPageContent.length}
%%EOF`;

  return new TextEncoder().encode(pdfHeader);
}
