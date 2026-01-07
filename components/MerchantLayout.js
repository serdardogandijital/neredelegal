import { useRouter } from 'next/router';
import Link from 'next/link';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { FEATURES } from '../lib/features';
import toast from 'react-hot-toast';

export default function MerchantLayout({ children, user }) {
  const router = useRouter();

  const handleLogout = async () => {
    await signOut(auth);
    toast.success('Çıkış yapıldı');
    router.push('/login');
  };

  const navigation = [
    { name: 'Dashboard', href: '/merchant', icon: '📊' },
    { name: 'Mekanlarım', href: '/merchant/venues', icon: '🏪' },
    ...(FEATURES.ENABLE_ONLINE_ORDERS
      ? [{ name: 'Siparişler', href: '/merchant/orders', icon: '🛒' }]
      : []),
    { name: 'Kampanyalar', href: '/merchant/campaigns', icon: '🎁' },
    { name: 'Check-ins', href: '/merchant/checkins', icon: '✅' },
    { name: 'QR Okut', href: '/merchant/scan-user', icon: '📱' },
    { name: 'İndirim Okut', href: '/merchant/scan-discount', icon: '🎫' },
    { name: 'Analitik', href: '/merchant/analytics', icon: '📈' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/merchant" className="flex items-center gap-2 hover:opacity-80 transition-opacity flex-shrink-0">
                <div className="h-9 w-9 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-base font-bold text-white">N</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent leading-tight">
                    nerede?
                  </span>
                  <span className="text-xs font-semibold text-gray-600 leading-tight">
                    İşletme
                  </span>
                </div>
              </Link>
            </div>
            
            <div className="absolute left-1/2 transform -translate-x-1/2 hidden lg:flex space-x-0.5">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`px-2 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                    router.pathname === item.href
                      ? 'bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="mr-1">{item.icon}</span>
                  {item.name}
                </Link>
              ))}
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="text-right hidden md:block">
                <p className="text-xs font-medium text-gray-900 truncate max-w-[120px]">{user?.name || 'İşletme'}</p>
                <p className="text-[10px] text-gray-500 truncate max-w-[120px]">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Çıkış
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <div className="lg:hidden bg-white border-b border-gray-200 overflow-x-auto scrollbar-hide">
        <div className="flex space-x-0.5 px-3 py-2">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap transition-colors ${
                router.pathname === item.href
                  ? 'bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="mr-0.5">{item.icon}</span>
              {item.name}
            </Link>
          ))}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-600">
              © 2024 nerede? İşletme Paneli. Tüm hakları saklıdır.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link href="/help" className="text-sm text-gray-600 hover:text-gray-900">Yardım</Link>
              <Link href="/support" className="text-sm text-gray-600 hover:text-gray-900">Destek</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
