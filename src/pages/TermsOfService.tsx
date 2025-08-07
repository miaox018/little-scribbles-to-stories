import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <Link to="/" className="flex items-center">
          <Sparkles className="h-8 w-8 text-purple-600 mr-2" />
          <h1 className="text-2xl font-bold text-gray-800">StoryMagic</h1>
        </Link>
        <Link to="/">
          <Button variant="outline" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
        </Link>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center text-gray-800">
              Terms & Conditions
            </CardTitle>
            <p className="text-center text-gray-600">
              Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </CardHeader>
          <CardContent className="prose prose-lg max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Overview</h2>
              <p className="mb-4">
                This website is operated by StoryMagic. Throughout the site, the terms "we", "us" and "our" refer to StoryMagic. StoryMagic offers this website, including all information, tools, and services available from this site to you, the user, conditioned upon your acceptance of all terms, conditions, policies, and notices stated here.
              </p>
              <p className="mb-4">
                By visiting our site and/or using our AI-powered tools or content services, you engage in our "Service" and agree to be bound by the following terms and conditions ("Terms of Service", "Terms"), including those additional terms and conditions and policies referenced herein or available by hyperlink. These Terms apply to all users of the site, including without limitation users who are browsers, account holders, parents, children (with parental consent), or content contributors.
              </p>
              <p className="mb-4">
                Please read these Terms carefully before accessing or using our website. If you do not agree to all the terms and conditions of this agreement, then you may not access the website or use the Service.
              </p>
              <p className="mb-4">
                Any new features or tools added to the current platform shall also be subject to these Terms. You can review the most current version of the Terms at any time on this page. We reserve the right to update or change these Terms by posting updates here. Your continued use of the website or services following such changes constitutes acceptance of those changes.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Section 1 - Service Eligibility and Usage</h2>
              <p className="mb-4">
                Our Services are intended to be used by individuals over the age of majority or by minors with the consent and supervision of a parent or legal guardian.
              </p>
              <p className="mb-4">
                By using the Service on behalf of a minor, you confirm that you are the parent or guardian and consent to the collection and use of any associated data and content, including drawings or creative prompts. We do not knowingly collect personal information directly from children under 13 without verifiable parental consent. For more information, see our Privacy Policy.
              </p>
              <p className="mb-4">
                You may not use our services for any unlawful or unauthorized purpose. You agree not to misuse or interfere with our technology or violate any laws, including intellectual property laws. Any violation of these Terms may result in the immediate suspension or termination of your access.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Section 2 - General Conditions</h2>
              <p className="mb-4">
                We reserve the right to refuse Service to anyone for any reason at any time.
              </p>
              <p className="mb-4">
                You understand that your content (excluding payment information) may be transferred unencrypted over various networks or adapted to meet technical requirements.
              </p>
              <p className="mb-4">
                You agree not to reproduce, copy, sell, or exploit any part of the Service without express written permission. Headings in this agreement are for reference only.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Section 3 - Service Information Accuracy</h2>
              <p className="mb-4">
                We are not responsible if any information on our site is inaccurate, incomplete, or outdated. Information is provided for general purposes only and should not be relied upon as the sole basis for decisions.
              </p>
              <p className="mb-4">
                We reserve the right to modify the site at any time, but are under no obligation to update information.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Section 4 - Modifications to the Service and Pricing</h2>
              <p className="mb-4">
                Prices or fees for our digital services (such as downloads, usage credits, or subscriptions) are subject to change without notice.
              </p>
              <p className="mb-4">
                We reserve the right to modify or discontinue the Service (or any part of it) at any time. We are not liable for any change, suspension, or discontinuation of the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Section 5 - Digital Products & Services</h2>
              <p className="mb-4">
                All services and outputs offered through StoryMagic are delivered digitally and are non-refundable once initiated. Due to the creative and generative nature of our AI-powered technology, outcomes may vary and may not always match user expectations. We make every effort to ensure a high-quality experience, but we do not guarantee specific results.
              </p>
              <p className="mb-4">
                By using our Service, you acknowledge that the outputs generated—including AI-enhanced images—may reflect interpretation, abstraction, or technical limitations inherent to the AI process.
              </p>
              <p className="mb-4">
                Outputs are generated automatically by third-party AI models (e.g., from OpenAI) without human review or moderation. StoryMagic does not control these models and disclaims all responsibility for their outputs, including any content that may be inaccurate, offensive, or inappropriate. You agree to use the Service at your own risk.
              </p>
              <p className="mb-4">
                In the rare event of a system error, crash, or bug that causes you to lose credits or access to your purchased content, we may, at our sole discretion, restore lost credits or provide access to replacement outputs. Refunds will not be issued except where required by law.
              </p>
              <p className="mb-4">
                We do not guarantee that any generated output will be suitable for commercial, educational, or specific functional use cases. You are solely responsible for determining the appropriateness and legality of any content you use or share.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Section 6 - Billing and Account Accuracy</h2>
              <p className="mb-4">
                We reserve the right to reject any payment or order. We may limit purchases or usage on a per-account or per-user basis.
              </p>
              <p className="mb-4">
                You agree to provide accurate and current account and billing information. Please update your account promptly to ensure successful service delivery.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Section 7 - Optional Tools</h2>
              <p className="mb-4">
                We may provide access to third-party tools, APIs, or integrations. These are offered "as-is" without warranties or liability. You assume all responsibility for the use of any such tools and agree to any terms set by the third-party providers.
              </p>
              <p className="mb-4">
                New features and services added in the future will also be subject to these Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Section 8 - Third-Party Links</h2>
              <p className="mb-4">
                Our Service may include links or integrations with third-party websites. We do not control or endorse these sites and are not responsible for their content or actions.
              </p>
              <p className="mb-4">
                Use third-party services at your own risk and review their policies before engaging.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Section 9 - User Submissions</h2>
              <p className="mb-4">
                By submitting content, suggestions, or creative input (such as prompts, designs, or feedback), you grant us the right to use, reproduce, modify, and publish such content without restriction or compensation.
              </p>
              <p className="mb-4">
                You must not submit content that violates any rights or laws. You are solely responsible for the content you submit.
              </p>
              <p className="mb-4">
                We reserve the right to remove any content we deem harmful, offensive, or in violation of these Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Section 10 - Personal Information</h2>
              <p className="mb-4">
                Your submission of personal data is governed by our <Link to="/privacy-policy" className="text-purple-600 hover:text-purple-800">Privacy Policy</Link>.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Section 11 - Prohibited Uses</h2>
              <p className="mb-2">You agree not to use the site or Service for unlawful purposes or to harm others. Prohibited activities include, but are not limited to:</p>
              <ul className="list-disc list-inside mb-4 space-y-1">
                <li>Uploading infringing or malicious content</li>
                <li>Attempting to disrupt or bypass security</li>
                <li>Submitting harmful or exploitative content involving minors</li>
                <li>Misrepresenting your identity</li>
              </ul>
              <p className="mb-4">
                We reserve the right to terminate your access if you violate these provisions.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Section 12 - Disclaimer of Warranties; Limitation of Liability</h2>
              <p className="mb-4">
                We do not guarantee uninterrupted, error-free service or perfect outputs. The Service is provided "as is" and "as available."
              </p>
              <p className="mb-4">
                To the fullest extent permitted by law, StoryMagic and its affiliates disclaim all warranties, express or implied, and shall not be liable for any damages arising from your use of the Service, including lost profits, data, or content.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Section 13 - Indemnification</h2>
              <p className="mb-4">
                You agree to indemnify and hold harmless StoryMagic and its affiliates from any claim arising from your breach of these Terms or your misuse of the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Section 14 - Intellectual Property</h2>
              <p className="mb-4">
                All content, code, technology, processes, and workflows available through the StoryMagic platform are the proprietary property of Four Bees L.L.C. and are protected under applicable intellectual property laws.
              </p>
              <p className="mb-4">
                Use of the platform does not grant you any rights to the underlying intellectual property, including trade secrets or proprietary algorithms. Unauthorized reproduction or derivative use of any protected aspect of the system may constitute infringement and will be pursued to the fullest extent of the law.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Section 15 - User Content & License to Use</h2>
              <p className="mb-4">
                By submitting any content to StoryMagic—including drawings, images, text prompts, names, or other materials—you retain ownership of your original submissions. You also retain ownership of the resulting AI-generated content to the extent permitted by law.
              </p>
              <p className="mb-4">
                However, you grant StoryMagic a non-exclusive, worldwide, royalty-free, perpetual, irrevocable license to use, reproduce, publish, adapt, display, distribute, and create derivative works of such content and outputs for purposes including, but not limited to:
              </p>
              <ul className="list-disc list-inside mb-4 space-y-1">
                <li>Product and feature demonstrations</li>
                <li>Marketing and promotional content (including on social media)</li>
                <li>Internal research and product development</li>
                <li>Public showcases, user success stories, or presentations</li>
              </ul>
              <p className="mb-4">
                You represent and warrant that you have all necessary rights to upload and grant us this license, and that your content does not infringe the intellectual property or privacy rights of any third party.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Section 16 - Refund Policy</h2>
              <p className="mb-4">
                Due to the nature of our digital, generative Service, all purchases—including credit packages and AI-generated assets—are final and non-refundable. By engaging with the Service, you agree that:
              </p>
              <ul className="list-disc list-inside mb-4 space-y-1">
                <li>AI-generated outputs may not match your expectations and are not grounds for refunds</li>
                <li>Your experience may vary depending on the quality of your prompt or input image</li>
                <li>You are purchasing access to a creative system, not a guaranteed result</li>
              </ul>
              <p className="mb-4">
                If technical issues such as service crashes or account-related bugs result in the loss of credits or access to outputs, StoryMagic may, at its sole discretion, restore credits or provide alternative access. Any such resolution will be limited to in-platform remedies and will not involve monetary refunds, unless required by law.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Section 17 - Governing Law</h2>
              <p className="mb-4">
                These Terms are governed by the laws of the United States and the State of New York, without regard to conflict of law principles.
              </p>
              <p className="mb-4">
                If you access the Service from outside the United States, you are solely responsible for compliance with your local laws and regulations.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Section 18 - Contact Information</h2>
              <p className="mb-2">Questions about the Terms of Service should be directed to:</p>
              <ul className="list-none mb-4 space-y-1">
                <li><strong>Legal Entity:</strong> Four Bees L.L.C.</li>
                <li><strong>Email:</strong> miaox018@gmail.com</li>
                <li><strong>Address:</strong> 116 Leroy St, Binghamton, NY 13905</li>
              </ul>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}