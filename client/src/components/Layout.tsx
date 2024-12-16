import { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";

interface LayoutProps {
  children: ReactNode;
  title?: string;
}

export function Layout({ children, title }: LayoutProps) {
  // Update document title when title prop changes
  if (title) {
    document.title = `${title} | Real Estate Club`;
  }

  return (
    <div className="flex min-h-screen flex-col font-sans">
      <Header />
      <main className="flex-1">
        {title && (
          <div className="bg-[#003c71] text-white py-12 md:py-24 lg:py-32">
            <div className="container mx-auto px-4">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl animate-fade-in">
                {title}
              </h1>
            </div>
          </div>
        )}
        {children}
      </main>
      <Footer />
    </div>
  );
}
