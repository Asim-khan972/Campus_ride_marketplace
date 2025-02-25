import Link from "next/link";
import { Facebook, Twitter, Instagram, Youtube } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">About</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="#"
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  About us
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  How it works
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Press
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Careers
                </Link>
              </li>
            </ul>
          </div>

          {/* Community */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Community</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="#"
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Stories
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Travel blog
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Partners
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Ambassador program
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Support</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="#"
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Contact us
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Help center
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Safety
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Terms & conditions
                </Link>
              </li>
            </ul>
          </div>

          {/* Social Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Follow us</h3>
            <div className="flex space-x-4">
              <Link
                href="#"
                className="text-gray-600 hover:text-[#00AFF5] transition-colors"
              >
                <Facebook className="h-6 w-6" />
              </Link>
              <Link
                href="#"
                className="text-gray-600 hover:text-[#00AFF5] transition-colors"
              >
                <Twitter className="h-6 w-6" />
              </Link>
              <Link
                href="#"
                className="text-gray-600 hover:text-[#00AFF5] transition-colors"
              >
                <Instagram className="h-6 w-6" />
              </Link>
              <Link
                href="#"
                className="text-gray-600 hover:text-[#00AFF5] transition-colors"
              >
                <Youtube className="h-6 w-6" />
              </Link>
            </div>
            <div className="pt-4">
              <p className="text-sm text-gray-600">Download our mobile app</p>
              <div className="flex gap-2 mt-2">
                <Link href="#" className="block">
                  <img
                    src="/placeholder.svg?height=40&width=120"
                    alt="Download on the App Store"
                    className="h-10"
                  />
                </Link>
                <Link href="#" className="block">
                  <img
                    src="/placeholder.svg?height=40&width=120"
                    alt="Get it on Google Play"
                    className="h-10"
                  />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-8 pt-8 border-t">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-600">
              © {new Date().getFullYear()} BlaBlaCar. All rights reserved.
            </p>
            <div className="flex gap-4">
              <Link
                href="#"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                href="#"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Cookie Policy
              </Link>
              <Link
                href="#"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Sitemap
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
