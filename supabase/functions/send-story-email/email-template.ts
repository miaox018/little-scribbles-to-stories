
interface EmailTemplateData {
  sender: string;
  storyTitle: string;
  storyViewUrl: string;
  sortedPages: any[];
  story: any;
}

export function generateEmailTemplate(data: EmailTemplateData): string {
  const { sender, storyTitle, storyViewUrl, sortedPages, story } = data;

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #8B5CF6; margin: 0;">✨ StoryMagic</h1>
        <p style="color: #666; margin: 5px 0;">Transform children's drawings into magical storybooks</p>
      </div>
      
      <div style="background: #f3e8ff; padding: 30px; border-radius: 12px; margin-bottom: 30px;">
        <h2 style="color: #333; margin-top: 0;">📚 You've received a magical story!</h2>
        <p style="color: #555; font-size: 16px; line-height: 1.6;">
          ${sender} has shared the story <strong>"${storyTitle}"</strong> with you through StoryMagic.
        </p>
        <p style="color: #555; font-size: 16px; line-height: 1.6;">
          This story contains ${sortedPages.length} magical pages created from children's drawings.
        </p>
        
        <!-- 简单的文本链接 -->
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #8B5CF6;">
          <h3 style="color: #8B5CF6; margin-top: 0; text-align: center;">📖 View Your Story</h3>
          <p style="text-align: center; margin: 10px 0; color: #666;">
            Copy and paste this link in your browser:
          </p>
          <p style="text-align: center; margin: 15px 0;">
            <span style="background: #f8f9fa; padding: 10px 15px; border-radius: 6px; font-family: monospace; font-size: 14px; word-break: break-all; display: inline-block; border: 1px solid #ddd;">${storyViewUrl}</span>
          </p>
          <p style="text-align: center; font-size: 12px; color: #888; margin-bottom: 0;">
            💡 Tip: Select the link above, copy (Ctrl+C), then paste in your browser address bar
          </p>
        </div>
      </div>
      
      <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #333; margin-top: 0;">📖 About this story:</h3>
        <ul style="color: #666; line-height: 1.6;">
          <li><strong>Title:</strong> ${storyTitle}</li>
          <li><strong>Pages:</strong> ${sortedPages.length}</li>
          <li><strong>Shared by:</strong> ${sender}</li>
          <li><strong>Art Style:</strong> ${story.art_style || 'Classic Watercolor'}</li>
          <li><strong>Works on:</strong> Any device - phone, tablet, or computer!</li>
        </ul>
      </div>

      <div style="text-align: center; padding: 20px; background: #8B5CF6; color: white; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin: 0 0 10px 0;">🎨 Create Your Own Magic</h3>
        <p style="margin: 0; font-size: 14px;">
          Visit StoryMagic to transform your children's drawings into magical storybooks!
        </p>
      </div>
      
      <div style="text-align: center; padding-top: 20px; border-top: 1px solid #eee; margin-top: 30px;">
        <p style="color: #999; font-size: 12px; margin: 0;">
          This email was sent from StoryMagic. If you didn't expect this email, you can safely ignore it.
        </p>
      </div>
    </div>
  `;
}

export function generateEmailSubject(sender: string, storyTitle: string): string {
  return `${sender} shared a magical story with you: "${storyTitle}"`;
}
