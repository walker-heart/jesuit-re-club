import { Button } from "@/components/ui/button";

export function About() {
  return (
    <>
      <section className="w-full py-8 md:py-8 lg:py-16">
        <div className="container px-4 md:px-6">
          <div className="grid gap-10 mx-auto max-w-[1000px]">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-[#003c71]">Our Story</h2>
              <p className="text-gray-600">
                The Real Estate Club at Jesuit Dallas was founded with the goal
                of introducing students to the exciting world of real estate.
                Our club provides a platform for students to explore various
                aspects of the real estate industry, from residential and
                commercial property management to investment strategies and
                market analysis.
              </p>
            </div>
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-[#003c71]">Our Mission</h2>
              <p className="text-gray-600">
                Through guest speaker events, workshops, and hands-on projects,
                we aim to equip our members with the knowledge and skills
                necessary to succeed in the real estate field. Our club also
                emphasizes the importance of ethical business practices and
                community involvement, aligning with Jesuit Dallas's mission of
                forming men for others.
              </p>
            </div>
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-[#003c71]">Our Goals</h2>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>
                  Educate students about various aspects of the real estate
                  industry
                </li>
                <li>
                  Provide networking opportunities with industry professionals
                </li>
                <li>
                  Develop practical skills through hands-on projects and case
                  studies
                </li>
                <li>
                  Foster a community of students passionate about real estate
                </li>
                <li>
                  Promote ethical business practices and community involvement
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
