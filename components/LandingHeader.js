import Link from 'next/link';
import { useState } from 'react';

export default function LandingHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed w-full top-0 z-50 bg-white/95 backdrop-blur-sm shadow-sm">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
              <div className="h-10 w-10 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-xl font-bold text-white">N</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                nerede?
              </span>
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-gray-700 hover:text-indigo-600 font-medium transition-colors">
              Özellikler
            </a>
            <a href="#about" className="text-gray-700 hover:text-indigo-600 font-medium transition-colors">
              Hakkımızda
            </a>
            <a href="#contact" className="text-gray-700 hover:text-indigo-600 font-medium transition-colors">
              İletişim
            </a>
            <Link 
              href="/login" 
              className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all font-medium"
            >
              Giriş Yap
            </Link>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg className="h-6 w-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="flex flex-col space-y-3">
              <a href="#features" className="text-gray-700 hover:text-indigo-600 font-medium py-2">
                Özellikler
              </a>
              <a href="#about" className="text-gray-700 hover:text-indigo-600 font-medium py-2">
                Hakkımızda
              </a>
              <a href="#contact" className="text-gray-700 hover:text-indigo-600 font-medium py-2">
                İletişim
              </a>
              <Link 
                href="/login" 
                className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg text-center font-medium"
              >
                Giriş Yap
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
