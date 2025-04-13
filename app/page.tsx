import Faqs from "@/components/landingPage/Faqs";
import Features from "@/components/landingPage/Features";
import Footer from "@/components/landingPage/Footer";
import HomeScreen from "@/components/landingPage/HomeScreen";
import NavbarComponent from "@/components/landingPage/Navbar";
import Testimonials from "@/components/landingPage/Testimonials";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (

    <main className="flex flex-col min-h-screen items-center justify-center">
      <NavbarComponent />
      <HomeScreen />
      <Features />
      <Testimonials />
      <Faqs />

      <section className="w-full mt-16 bg-muted py-16">
        <div className="container px-6 xs:px-8 sm:px-0 sm:mx-8 lg:mx-auto">
          <div className="flex flex-col items-center space-y-4 text-center">
            <h2 className="text-3xl font-bold leading-tight  sm:text-4xl xl:text-5xl">
              Ready to Transform your Car?
            </h2>
            <p className="text-lg font-medium text-gray-600 font-pj">
              Join thousands of users who care already creating amazing AI generated images.
            </p>

            <Link href="/login">
              <Button className="rounded-md text-base h-12">
                ✨ Start Visualizing with RCMS ✨
              </Button>
            </Link>
          </div>
        </div>
      </section>


      <Footer />
    </main>

  );
}
