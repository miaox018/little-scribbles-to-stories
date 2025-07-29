import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-white">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Privacy Policy
            </CardTitle>
            <p className="text-center text-muted-foreground">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">1. Information We Collect</h2>
              
              <h3 className="text-lg font-semibold mb-2">Account Information</h3>
              <p className="mb-4">
                When you create an account, we collect your email address and any profile information you provide. 
                For free trial users, account creation is optional.
              </p>

              <h3 className="text-lg font-semibold mb-2">Content You Upload</h3>
              <p className="mb-4">
                We process the images you upload to create illustrated stories. These images are stored securely 
                and are only accessible to you and our AI processing systems.
              </p>

              <h3 className="text-lg font-semibold mb-2">Usage Data</h3>
              <p className="mb-4">
                We collect information about how you use our service, including features accessed, 
                stories created, and technical performance data.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">2. How We Use Your Information</h2>
              <ul className="list-disc pl-6 mb-4">
                <li>To provide and improve our story generation service</li>
                <li>To communicate with you about your account and service updates</li>
                <li>To process payments and manage subscriptions</li>
                <li>To analyze usage patterns and improve our AI models</li>
                <li>To provide customer support</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">3. Data Storage and Retention</h2>
              
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                <h3 className="font-semibold text-yellow-800 mb-2">Trial Content</h3>
                <p className="text-yellow-700">
                  Free trial stories and uploaded images are automatically deleted after 7 days if not 
                  saved to your library through a paid plan.
                </p>
              </div>
              
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
                <h3 className="font-semibold text-blue-800 mb-2">Saved Content</h3>
                <p className="text-blue-700">
                  Stories saved to your library and associated images are retained for as long as your 
                  account remains active. We may archive inactive content with 30 days' notice.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">4. Data Sharing</h2>
              <p className="mb-4">
                We do not sell, trade, or share your personal information with third parties except:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>With service providers who help us operate our platform (e.g., cloud hosting, payment processing)</li>
                <li>When required by law or to protect our rights and safety</li>
                <li>In connection with a business transfer or acquisition</li>
                <li>With your explicit consent</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">5. AI and Machine Learning</h2>
              <p className="mb-4">
                We use AI technology to process your images and generate stories. We may use aggregated, 
                anonymized data to improve our AI models, but your specific content and personal information 
                are not shared with third parties for training purposes.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">6. Security</h2>
              <p className="mb-4">
                We implement appropriate technical and organizational measures to protect your data against 
                unauthorized access, alteration, disclosure, or destruction. However, no internet transmission 
                is completely secure.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">7. Your Rights</h2>
              <p className="mb-4">You have the right to:</p>
              <ul className="list-disc pl-6 mb-4">
                <li>Access and download your personal data</li>
                <li>Correct inaccurate personal information</li>
                <li>Delete your account and associated data</li>
                <li>Withdraw consent for data processing where applicable</li>
                <li>File a complaint with relevant data protection authorities</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">8. Children's Privacy</h2>
              <p className="mb-4">
                Our service is not intended for children under 13. We do not knowingly collect personal 
                information from children under 13. If we become aware of such collection, we will delete 
                the information promptly.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">9. Changes to This Policy</h2>
              <p className="mb-4">
                We may update this Privacy Policy periodically. We will notify you of significant changes 
                through our service or by email.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">10. Contact Us</h2>
              <p className="mb-4">
                If you have questions about this Privacy Policy or our data practices, please contact us 
                through our support channels.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}