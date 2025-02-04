import { Card, CardContent } from "@/components/ui/card";

export function Privacy() {
  return (
    <div className="min-h-screen bg-gray-100 py-24">
      <div className="container mx-auto px-4">
        <Card className="max-w-4xl mx-auto">
          <CardContent className="p-8">
            <h1 className="text-3xl font-bold text-[#003c71] mb-8">Privacy Policy</h1>
            
            <div className="space-y-8">
              <section>
                <h2 className="text-xl font-semibold text-[#003c71] mb-4">Information We Collect</h2>
                <p className="text-gray-600 mb-4">
                  We collect information that you provide directly to us when you:
                </p>
                <ul className="list-disc pl-6 text-gray-600 space-y-2">
                  <li>Create an account</li>
                  <li>Register for events</li>
                  <li>Submit forms</li>
                  <li>Communicate with us</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-[#003c71] mb-4">How We Use Your Information</h2>
                <p className="text-gray-600 mb-4">
                  We use the information we collect to:
                </p>
                <ul className="list-disc pl-6 text-gray-600 space-y-2">
                  <li>Provide and maintain our services</li>
                  <li>Send you important information about events and updates</li>
                  <li>Improve our website and services</li>
                  <li>Respond to your requests and questions</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-[#003c71] mb-4">Information Security</h2>
                <p className="text-gray-600">
                  We implement appropriate security measures to protect your personal information. 
                  However, no method of transmission over the Internet is 100% secure. Therefore, 
                  while we strive to protect your information, we cannot guarantee its absolute security.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-[#003c71] mb-4">Contact Us</h2>
                <p className="text-gray-600">
                  If you have any questions about this Privacy Policy, please contact us at:
                </p>
                <p className="text-gray-600 mt-2">
                  Jesuit College Preparatory School of Dallas<br />
                  12345 Inwood Rd<br />
                  Dallas, TX 75244
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-[#003c71] mb-4">Changes to This Policy</h2>
                <p className="text-gray-600">
                  We may update this privacy policy from time to time. We will notify you of any changes 
                  by posting the new privacy policy on this page. You are advised to review this privacy 
                  policy periodically for any changes.
                </p>
              </section>

              <p className="text-sm text-gray-500 mt-8">
                Last updated: {new Date().toLocaleDateString()}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 