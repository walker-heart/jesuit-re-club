import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle } from 'lucide-react'
import { Link } from "wouter"

export function Membership() {
  const benefits = [
    "Access to exclusive events and guest speakers",
    "Networking opportunities with industry professionals",
    "Hands-on experience through real estate projects and case studies",
    "Leadership opportunities within the club",
    "Enhance your college applications and resume",
  ]

  return (
    <>
      

      <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-50">
        <div className="container px-4 md:px-6 flex justify-center">
          <div className="grid gap-10 w-full max-w-[800px]">
            <Card className="animate-fade-in card-hover">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-[#003c71]">Why Join?</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="grid gap-4 mt-4">
                  {benefits.map((benefit, index) => (
                    <li key={index} className="flex items-center space-x-2 animate-fade-in" style={{animationDelay: `${index * 100}ms`}}>
                      <CheckCircle className="h-5 w-5 text-[#b3a369]" />
                      <span className="text-gray-600">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="animate-fade-in card-hover">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-[#003c71]">How to Join</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-6">
                  Joining the Real Estate Club is easy! Simply fill out our online application form and attend our next meeting. Membership is open to all Jesuit Dallas students interested in learning about real estate.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button asChild className="bg-[#b3a369] text-[#003c71] hover:bg-[#b3a369]/90 button-hover">
                    <Link href="/membership/apply">Join Now</Link>
                  </Button>
                  <Button asChild className="bg-[#003c71] text-white hover:bg-[#003c71]/90 button-hover">
                    <a href="https://rangernet.jesuit.org" target="_blank" rel="noopener noreferrer">
                      Visit RangerNet
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </>
  );
}
