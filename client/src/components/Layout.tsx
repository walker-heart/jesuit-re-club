import { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { useScrollTop } from "@/hooks/useScrollTop";

interface LayoutProps {
  children: ReactNode;
  title?: string;
}

export function Layout({ children, title }: LayoutProps) {
  useScrollTop(); // This will handle scroll behavior on route changes

  // Update document title when title prop changes
  if (title) {
    document.title = `${title} | Real Estate Club`;
  }

  return (
    <div className="flex min-h-screen flex-col font-sans">
      <Header />
      <main className="flex-1">
        {title && (
          <div className="bg-[#003c71] text-white py-8 mt-16">
            <div className="container mx-auto px-4">
              <h1 className="text-3xl font-bold tracking-tighter animate-fade-in">
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
