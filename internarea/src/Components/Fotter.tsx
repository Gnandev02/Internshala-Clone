import { Facebook, Twitter, Instagram, Linkedin, Smartphone } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-12 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Footer Top - 5 Column Balanced Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
          <FooterSection 
            title="Internships by Place" 
            items={[
              { label: "Delhi / NCR", href: "/internship" },
              { label: "Bangalore", href: "/internship" },
              { label: "Mumbai", href: "/internship" },
              { label: "Hyderabad", href: "/internship" },
              { label: "Chennai", href: "/internship" },
              { label: "Kolkata", href: "/internship" },
            ]} 
          />

          <FooterSection 
            title="Internships by Stream" 
            items={[
              { label: "Computer Science", href: "/internship" },
              { label: "Electronics", href: "/internship" },
              { label: "Mechanical", href: "/internship" },
              { label: "Civil Engineering", href: "/internship" },
              { label: "Marketing", href: "/internship" },
              { label: "Finance", href: "/internship" },
            ]} 
          />

          <FooterSection 
            title="Jobs by Location" 
            items={[
              { label: "Work from Home", href: "/job" },
              { label: "Delhi / NCR", href: "/job" },
              { label: "Bangalore", href: "/job" },
              { label: "Mumbai", href: "/job" },
              { label: "Hyderabad", href: "/job" },
              { label: "Pune", href: "/job" },
            ]} 
          />

          <FooterSection 
            title="Jobs by Stream" 
            items={[
              { label: "Software Dev", href: "/job" },
              { label: "Web Development", href: "/job" },
              { label: "Data Science", href: "/job" },
              { label: "Graphic Design", href: "/job" },
              { label: "Digital Marketing", href: "/job" },
              { label: "Human Resources", href: "/job" },
            ]} 
          />

          <FooterSection 
            title="About Intern Area" 
            items={[
              { label: "About us", href: "#" },
              { label: "We're hiring", href: "#" },
              { label: "Hire talent", href: "#" },
              { label: "Public Space", href: "/public-space" },
              { label: "Terms & Conditions", href: "#" },
              { label: "Privacy Policy", href: "#" },
            ]} 
          />
        </div>

        <hr className="my-8 border-gray-800" />

        {/* Footer Bottom */}
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          
          {/* App Link Button */}
          <a 
            href="#" 
            className="flex items-center space-x-2 border border-gray-700 bg-gray-800 hover:bg-gray-700 text-gray-200 px-4 py-2 rounded-lg text-sm transition"
          >
            <Smartphone className="w-5 h-5 text-blue-400" />
            <span>Get Android App</span>
          </a>

          {/* Social Icons */}
          <div className="flex space-x-5 text-gray-400">
            <a href="#" className="hover:text-blue-500 transition">
              <Facebook className="w-5 h-5" />
            </a>
            <a href="#" className="hover:text-sky-400 transition">
              <Twitter className="w-5 h-5" />
            </a>
            <a href="#" className="hover:text-pink-500 transition">
              <Instagram className="w-5 h-5" />
            </a>
            <a href="#" className="hover:text-blue-400 transition">
              <Linkedin className="w-5 h-5" />
            </a>
          </div>

          {/* Copyright */}
          <p className="text-xs text-gray-400">
            © Copyright 2026 Intern Area. All Rights Reserved.
          </p>

        </div>

      </div>
    </footer>
  );
}

interface FooterItem {
  label: string;
  href: string;
}

function FooterSection({ title, items }: { title: string; items: FooterItem[] }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wider mb-4">
        {title}
      </h3>
      <ul className="space-y-2.5">
        {items.map((item, index) => (
          <li key={index}>
            <Link 
              href={item.href} 
              className="text-sm text-gray-400 hover:text-blue-400 hover:underline transition duration-150"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}