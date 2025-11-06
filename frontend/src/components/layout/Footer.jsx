import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin, Heart } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="relative bg-gradient-to-r from-indigo-800 to-purple-800 text-white overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-15">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.2)_1px,transparent_0)] bg-[length:20px_20px]"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Company Info */}
          <div className="space-y-6 group">
            <div className="flex items-center space-x-3">
              <img
                src="/artstoplogo.png"
                alt="ArtStop Logo"
                className="h-12 w-12 object-contain drop-shadow-lg"
              />
              <div className="text-3xl font-bold text-white drop-shadow-lg">
                Art<span className="text-white drop-shadow-lg">Stop</span>
              </div>
            </div>
            <p className="text-white leading-relaxed text-base group-hover:text-gray-200 transition-colors duration-300">
              Your premier destination for authentic Islamic art, home decor, and custom artistic creations.
            </p>
            <div className="flex space-x-4">
              <Facebook className="h-6 w-6 text-white hover:text-white hover:scale-110 cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-white/25" />
              <Instagram className="h-6 w-6 text-white hover:text-white hover:scale-110 cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-white/25" />
              <Twitter className="h-6 w-6 text-white hover:text-white hover:scale-110 cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-white/25" />
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white border-b border-white/30 pb-2">Quick Links</h3>
            <div className="space-y-3">
              {[
                { name: 'Home', path: '/' },
                { name: 'Categories', path: '/categories' },
                { name: 'Products', path: '/products' },
                { name: 'About Us', path: '/about' },
                { name: 'Contact', path: '/contact' }
              ].map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className="block text-white hover:text-white hover:translate-x-1 transition-all duration-300 text-base group"
                >
                  <span className="group-hover:before:content-['→'] group-hover:before:mr-2 group-hover:before:text-white">
                    {link.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white border-b border-white/30 pb-2">Categories</h3>
            <div className="space-y-3">
              {[
                { name: 'Islamic Art', path: '/categories/islamic-art' },
                { name: 'Home Decor', path: '/categories/home-decor' },
                { name: 'Gifts', path: '/categories/gifts' },
                { name: 'Cutouts & Signage', path: '/categories/cutouts-signage' },
                { name: 'Custom Orders', path: '/customize' }
              ].map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className="block text-white hover:text-white hover:translate-x-1 transition-all duration-300 text-base group"
                >
                  <span className="group-hover:before:content-['→'] group-hover:before:mr-2 group-hover:before:text-white">
                    {link.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white border-b border-white/30 pb-2">Contact Us</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-3 group hover:bg-white/10 p-2 rounded-lg transition-all duration-300">
                <Phone className="h-5 w-5 text-white group-hover:scale-110 transition-transform duration-300" />
                <span className="text-white group-hover:text-white transition-colors duration-300">+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center space-x-3 group hover:bg-white/10 p-2 rounded-lg transition-all duration-300">
                <Mail className="h-5 w-5 text-white group-hover:scale-110 transition-transform duration-300" />
                <span className="text-white group-hover:text-white transition-colors duration-300">info@artstop.com</span>
              </div>
              <div className="flex items-center space-x-3 group hover:bg-white/10 p-2 rounded-lg transition-all duration-300">
                <MapPin className="h-5 w-5 text-white group-hover:scale-110 transition-transform duration-300" />
                <span className="text-white group-hover:text-white transition-colors duration-300">123 Art Street, Creative City</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/20 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex flex-col items-center md:items-start space-y-2">
              <p className="text-white text-sm">
                © 2025 ArtStop. All rights reserved.
              </p>
              <p className="text-white/70 text-xs">
                Developed with ❤️ by{' '}
                <a
                  href="https://thajiratechworks.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-white/90 hover:text-white transition-colors duration-300 underline decoration-1 underline-offset-2"
                >
                  Thajira Techworks
                </a>
              </p>
            </div>
            <div className="flex space-x-6">
              <Link to="/privacy" className="text-white hover:text-white text-sm transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms" className="text-white hover:text-white text-sm transition-colors">
                Terms of Service
              </Link>
              <Link to="/returns" className="text-white hover:text-white text-sm transition-colors">
                Returns
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;