import { Button } from "../ui/button";
import Logo from "../Logo";
import Link from "next/link";

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu } from "lucide-react";

const NavItems = () => {
  return (
    <>
      <Link
        href="/#features"
        className="text-sm font-medium hover:underline underline-offset-4 block py-2"
      >
        Features
      </Link>
      <Link
        href="/#pricing"
        className="text-sm font-medium hover:underline underline-offset-4 block py-2"
      >
        Pricing
      </Link>
      <Link
        href="/#faqs"
        className="text-sm font-medium hover:underline underline-offset-4 block py-2"
      >
        FAQs
      </Link>
      <Link
        href="/login"
        className="text-sm font-medium hover:underline underline-offset-4 block py-2"
      >
        <Button variant="outline" className="w-full">
          LogIn
        </Button>
      </Link>
      <Link
        href="/signup"
        className="text-sm font-medium hover:underline underline-offset-4 block py-2"
      >
        <Button className="w-full">Sign UP</Button>
      </Link>
    </>
  );
};

export default function NavbarComponent() {
  return (
    <div className="w-full bg-background/60 backdrop-blur-md fixed top-0 px-8 py-2 z-50 shadow-xl overflow-hidden">
      <header className="container mx-auto flex items-center justify-between">
        <Logo />
        {/* Desktop Navigation */}
        <nav className="ml-auto hidden md:flex items-center justify-center gap-6">
          <NavItems />
        </nav>

        {/* Mobile Navigation */}
        <div className="ml-auto md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Menu className="h-6 w-6 text-gray-800" strokeWidth={2} />
            </SheetTrigger>
            <SheetContent className="p-6 bg-white shadow-lg rounded-lg">
              <SheetHeader>
                <SheetTitle className="font-bold text-lg">Navigation</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-4 mt-6">
                <NavItems />
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </header>
    </div>
  );
}
