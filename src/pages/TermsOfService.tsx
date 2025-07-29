import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-white">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Terms of Service
            </CardTitle>
            <p className="text-center text-muted-foreground">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">1. Service Overview</h2>
              <p className="mb-4">
                Our service allows users to transform uploaded images into illustrated stories using AI technology. 
                We offer both free trial and paid tiers with different features and limitations.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">2. Trial & Storage Terms</h2>
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                <h3 className="font-semibold text-yellow-800 mb-2">Free Trial Users</h3>
                <p className="text-yellow-700">
                  As a free user, you may create one story of up to three (3) pages. This story will be saved in 
                  "in-progress" mode and accessible for up to seven (7) days from creation. If you do not upgrade 
                  to a paid plan and save the story to your library during that time, it will be automatically deleted.
                </p>
              </div>
              
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
                <h3 className="font-semibold text-blue-800 mb-2">Paid Users</h3>
                <p className="text-blue-700">
                  Once a story is saved to your personal library through a paid plan, it will remain accessible for 
                  the duration of your account. We reserve the right to archive or delete inactive saved content 
                  with at least 30 days' notice.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">3. User Responsibilities</h2>
              <ul className="list-disc pl-6 mb-4">
                <li>You are responsible for the content you upload and must have appropriate rights to use it</li>
                <li>You must not upload content that is illegal, harmful, or violates intellectual property rights</li>
                <li>You must not attempt to abuse or circumvent service limitations</li>
                <li>You are responsible for maintaining the security of your account credentials</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">4. Content Ownership</h2>
              <p className="mb-4">
                You retain ownership of the original images you upload. The generated story content is created 
                through our AI service and you receive rights to use the generated content in accordance with 
                these terms. We retain the right to use aggregated, anonymized data to improve our services.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">5. Service Availability</h2>
              <p className="mb-4">
                We strive to maintain high service availability but cannot guarantee uninterrupted access. 
                We reserve the right to modify, suspend, or discontinue the service with reasonable notice.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">6. Limitation of Liability</h2>
              <p className="mb-4">
                Our liability is limited to the maximum extent permitted by law. We are not responsible for 
                any indirect, incidental, or consequential damages arising from your use of the service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">7. Changes to Terms</h2>
              <p className="mb-4">
                We may update these terms from time to time. Continued use of the service after changes 
                constitutes acceptance of the new terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">8. Contact Information</h2>
              <p className="mb-4">
                If you have any questions about these Terms of Service, please contact us through our 
                support channels.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}