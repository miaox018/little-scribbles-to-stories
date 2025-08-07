import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

export default function PrivacyPolicy() {
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
              Privacy Policy
            </CardTitle>
            <p className="text-center text-gray-600">
              Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </CardHeader>
          <CardContent className="prose prose-lg max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
              <p className="mb-4">
                This Privacy Policy describes how StoryMagic (a project of Four Bees L.L.C.) collects, uses, and protects the personal and creative information you provide when using our AI-powered tools, website, and digital services (together, the "Service"). Please read carefully. By accessing or using the Service, you agree to the terms below.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">2. Owner & Contact Information</h2>
              <ul className="list-none mb-4 space-y-2">
                <li><strong>Company:</strong> Four Bees L.L.C. dba StoryMagic</li>
                <li><strong>Email for Privacy Matters:</strong> miaox018@gmail.com</li>
                <li><strong>Address:</strong> 116 Leroy St, Binghamton, NY 13905</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">3. Information We Collect</h2>
              
              <h3 className="text-xl font-medium mb-3">a) User-Provided Information</h3>
              <ul className="list-disc list-inside mb-4 space-y-1">
                <li>Account info: name, email, password (if creating an account)</li>
                <li>Payment info: credit card or transaction data (processed by third-party payment processors)</li>
                <li>Uploaded content: images, drawings, prompts</li>
                <li>Communications: user support queries, surveys, feedback</li>
              </ul>

              <h3 className="text-xl font-medium mb-3">b) Automatically Collected Information</h3>
              <ul className="list-disc list-inside mb-4 space-y-1">
                <li>Device & usage data: IP address, browser type, device type, session length, errors</li>
                <li>Cookies & tracking tech: session/persistent cookies, web beacons for analytics and personalized experience</li>
              </ul>

              <h3 className="text-xl font-medium mb-3">c) Third-Party Sources</h3>
              <ul className="list-disc list-inside mb-4 space-y-1">
                <li>Analytics and infrastructure services (e.g., Google Analytics, hosting providers) that process aggregated, non-identifiable data</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">4. Use of Your Information</h2>
              <p className="mb-2">We use your data to:</p>
              <ul className="list-disc list-inside mb-4 space-y-1">
                <li>Provide, maintain, and improve the Service</li>
                <li>Process purchases, credits, and AI content generation</li>
                <li>Communicate updates, support responses, and account notices</li>
                <li>Troubleshoot and analyze service usage for future enhancements</li>
                <li>Personalize user experience and content suggestions</li>
                <li>Monitor for fraud, abuse, or violations of our Terms of Service</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">5. Sharing & Disclosure</h2>
              <p className="mb-2">We do not sell personal information. We may share your data with:</p>
              <ul className="list-disc list-inside mb-4 space-y-1">
                <li>Service providers: payment processors, hosting, analytics, email services</li>
                <li>Legal compliance: law enforcement or subpoena responses</li>
                <li>Security: to prevent fraud, abuse, or unlawful use</li>
                <li>Business transfers: in case of sale, merger, or asset transfer (with user notice)</li>
                <li>Aggregated data: anonymized usage trends shared for research or business improvements</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">6. Cookies & Tracking</h2>
              <p className="mb-4">
                We use cookies and similar tech for session management, feature enablement, analytics, and personalization. You can disable cookies in your browser, but some site features may not work properly.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">7. Third-Party Links & Integrations</h2>
              <p className="mb-4">
                Our Service may link to or integrate with third-party tools or services. We do not control their policies or practices. Please review their privacy documents before use.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">8. Children's Data Protection</h2>
              <p className="mb-4">
                Our Service is intended for users aged 13 and up, or minors under parental supervision. We do not knowingly collect personal data from children under 13 without parental consent. If we learn we have, we will delete it promptly.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">9. Data Security & Retention</h2>
              <p className="mb-4">
                We implement industry-standard security measures (e.g., encryption, firewalls) to protect your information. However, no system is fully secure. We retain personal data only as needed to operate our Service, comply with legal obligations, resolve disputes, and enforce agreements. Usage data may be retained longer in anonymized form for improvement purposes.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">10. Your Rights</h2>
              <p className="mb-2">Depending on where you live, you may have the right to:</p>
              <ul className="list-disc list-inside mb-4 space-y-1">
                <li>Access or correct your personal data</li>
                <li>Request deletion (except where we have a legal right to retain it)</li>
                <li>Opt-out of marketing emails</li>
                <li>Withdraw consent (subject to legal obligations)</li>
              </ul>
              <p className="mb-4">
                To exercise your rights, contact us at miaox018@gmail.com. We will verify your identity before processing requests and respond within one month.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">11. International Users & Cross-Border Transfers</h2>
              <p className="mb-4">
                By using our Service, you consent to the collection, storage, transfer, and processing of your data on servers located in the U.S. If you reside outside the U.S., be aware that your country's data protection laws may differ. You agree to this transfer.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">12. Legal Disclosures</h2>
              <p className="mb-4">
                We may disclose personal information to comply with laws, protect rights, safety, or property, and respond to legal requests.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">13. Policy Updates</h2>
              <p className="mb-4">
                We may update this policy occasionally. We will notify you via email or a prominent site banner if changes are material. You can view the "Last Updated" date above.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">14. Legal Notice</h2>
              <p className="mb-4">
                The technology and systems used to provide the StoryMagic service — including its AI-based media generation pipeline — are the proprietary property of Four Bees L.L.C.
              </p>
              <p className="mb-4">
                This Privacy Policy governs your use of the platform but does not grant any rights to the underlying technology or content.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">15. Contact Us</h2>
              <p className="mb-2">For questions, concerns, or requests regarding your privacy or data, please contact us at:</p>
              <ul className="list-none mb-4 space-y-1">
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