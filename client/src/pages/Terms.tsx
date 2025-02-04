import { Card, CardContent } from "@/components/ui/card";

export function Terms() {
  return (
    <div className="min-h-screen bg-gray-100 py-24">
      <div className="container mx-auto px-4">
        <Card className="max-w-4xl mx-auto">
          <CardContent className="p-8">
            <h1 className="text-3xl font-bold text-[#003c71] mb-8">Terms of Service</h1>
            <div className="space-y-8">
              <section>
                <h2 className="text-xl font-semibold text-[#003c71] mb-4">Acceptance of Terms</h2>
                <p className="text-gray-600">
                  By accessing and using our services, you agree to be bound by these Terms of Service.
                </p>
              </section>
              <section>
                <h2 className="text-xl font-semibold text-[#003c71] mb-4">Modification of Terms</h2>
                <p className="text-gray-600">
                  We reserve the right to update or modify these terms at any time without prior notice.
                </p>
              </section>
              <section>
                <h2 className="text-xl font-semibold text-[#003c71] mb-4">User Responsibilities</h2>
                <p className="text-gray-600">
                  Users must use the services in a lawful and respectful manner.
                </p>
              </section>
              <section>
                <h2 className="text-xl font-semibold text-[#003c71] mb-4">Limitation of Liability</h2>
                <p className="text-gray-600">
                  Our services are provided "as is" without any warranties.
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