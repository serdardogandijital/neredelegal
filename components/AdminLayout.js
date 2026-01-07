import { useRouter } from 'next/router';
import Link from 'next/link';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import toast from 'react-hot-toast';

export default function AdminLayout({ children, user }) {
  const router = useRouter();

  const handleLogout = async () => {
    await signOut(auth);
    toast.success('Çıkış yapıldı');
    router.push('/login');
  };

  const navigationTop = [
    { name: 'Dashboard', href: '/admin', icon: '📊' },
    { name: 'Kullanıcılar', href: '/admin/users', icon: '👥' },
    { name: 'İşletmeler', href: '/admin/merchants', icon: '🏪' },
    { name: 'Mekanlar', href: '/admin/venues', icon: '📍' },
    { name: 'Kampanyalar', href: '/admin/campaigns', icon: '🎁' },
    { name: 'Rotalar', href: '/admin/routes', icon: '🗺️' },
  ];

  const navigationBottom = [
    { name: 'Rozetler', href: '/admin/badges', icon: '🏆' },
    { name: 'Biletler', href: '/admin/tickets', icon: '🎫' },
    { name: 'Ödemeler', href: '/admin/payments', icon: '💳' },
    { name: 'Oyunlar', href: '/admin/games', icon: '🎮' },
    { name: 'Topluluk', href: '/admin/community', icon: '🌍' },
    { name: 'İşlemler', href: '/admin/transactions', icon: '💰' },
    { name: 'Ayarlar', href: '/admin/settings', icon: '⚙️' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-md sticky top-0 z-50">
        <div className="mx-auto px-4">
          <div className="flex justify-between items-center py-2">
            <div className="flex items-center space-x-4 flex-shrink-0">
              <Link href="/admin" className="flex items-center hover:opacity-80 transition-opacity">
                <div className="h-10 w-10 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-lg font-bold text-white">N</span>
                </div>
                <span className="ml-3 text-base font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent whitespace-nowrap">
                  nerede? Admin
                </span>
              </Link>
            </div>
            
            <div className="flex-1 mx-4">
              <div className="flex flex-col gap-1">
                {/* Üst satır */}
                <div className="flex space-x-1 justify-center flex-wrap">
                  {navigationTop.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                        router.pathname === item.href
                          ? 'bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <span className="mr-1 text-sm">{item.icon}</span>
                      <span>{item.name}</span>
                    </Link>
                  ))}
                </div>
                {/* Alt satır */}
                <div className="flex space-x-1 justify-center flex-wrap">
                  {navigationBottom.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                        router.pathname === item.href
                          ? 'bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <span className="mr-1 text-sm">{item.icon}</span>
                      <span>{item.name}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 flex-shrink-0">
              <div className="text-right hidden xl:block">
                <p className="text-sm font-medium text-gray-900">{user?.name || 'Admin User'}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                Çıkış
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-600">
              © 2024 nerede? Admin Panel. Tüm hakları saklıdır.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link href="/help" className="text-sm text-gray-600 hover:text-gray-900">Yardım</Link>
              <a href="https://github.com/nerede-app/docs" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-600 hover:text-gray-900">Dokümantasyon</a>
              <Link href="/support" className="text-sm text-gray-600 hover:text-gray-900">Destek</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
