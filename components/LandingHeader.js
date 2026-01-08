import Link from 'next/link';
import { useState } from 'react';

export default function LandingHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed w-full top-0 z-50 bg-blue-900/95 backdrop-blur-sm shadow-lg border-b border-blue-800">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-3 hover:opacity-90 transition-opacity">
              <img
                src="/nerede-app-icon.png"
                alt="nerede? logo"
                className="h-10 w-10 rounded-2xl shadow-lg object-cover"
              />
              <span className="text-xl font-bold text-white">
                nerede<span className="text-blue-200">?</span>
              </span>
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-blue-100 hover:text-yellow-400 font-medium transition-colors">
              Özellikler
            </a>
            <a href="#about" className="text-blue-100 hover:text-yellow-400 font-medium transition-colors">
              Hakkımızda
            </a>
            <a href="#contact" className="text-blue-100 hover:text-yellow-400 font-medium transition-colors">
              İletişim
            </a>
            <Link
              href="/isletmeler"
              className="text-blue-100 hover:text-yellow-400 font-medium transition-colors"
            >
              İşletmelere Özel
            </Link>
            <Link
              href="/register"
              className="px-5 py-2.5 bg-white text-blue-900 rounded-lg font-bold hover:bg-blue-50 shadow-lg shadow-blue-900/20 transition-all"
            >
              Kayıt Ol
            </Link>
            <Link
              href="/login"
              className="px-6 py-2.5 bg-yellow-400 text-blue-900 rounded-lg hover:bg-yellow-300 hover:shadow-lg transform hover:-translate-y-0.5 transition-all font-bold"
            >
              Giriş Yap
            </Link>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-blue-800 transition-colors"
          >
            <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-blue-800">
            <div className="flex flex-col space-y-3">
              <a href="#features" className="text-blue-100 hover:text-yellow-400 font-medium py-2">
                Özellikler
              </a>
              <a href="#about" className="text-blue-100 hover:text-yellow-400 font-medium py-2">
                Hakkımızda
              </a>
              <a href="#contact" className="text-blue-100 hover:text-yellow-400 font-medium py-2">
                İletişim
              </a>
              <Link
                href="/isletmeler"
                className="text-blue-100 hover:text-yellow-400 font-medium py-2"
              >
                İşletmelere Özel
              </Link>
              <Link
                href="/register"
                className="px-6 py-2.5 bg-white text-blue-900 rounded-lg text-center font-bold border border-blue-100"
              >
                Kayıt Ol
              </Link>
              <Link
                href="/login"
                className="px-6 py-2.5 bg-yellow-400 text-blue-900 rounded-lg text-center font-bold hover:bg-yellow-300"
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
