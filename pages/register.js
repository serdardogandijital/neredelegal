import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { auth, db } from '../lib/firebase';

const initialForm = {
  fullName: '',
  phone: '',
  inviteCode: '',
  email: '',
  password: ''
};

export default function Register() {
  const router = useRouter();
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.fullName.trim()) {
      toast.error('Lütfen ad soyad girin');
      return;
    }

    if (form.password.length < 6) {
      toast.error('Şifre en az 6 karakter olmalı');
      return;
    }

    setLoading(true);

    try {
      const credential = await createUserWithEmailAndPassword(auth, form.email, form.password);

      if (form.fullName) {
        await updateProfile(credential.user, { displayName: form.fullName });
      }

      await setDoc(doc(db, 'users', credential.user.uid), {
        fullName: form.fullName.trim(),
        phone: form.phone.trim() || null,
        inviteCode: form.inviteCode.trim() || null,
        email: form.email.toLowerCase(),
        role: 'user',
        signupSource: 'landing-register',
        createdAt: serverTimestamp()
      });

      toast.success('Hesabınız oluşturuldu! Şimdi giriş yapabilirsiniz.');
      setForm(initialForm);
      router.push('/login');
    } catch (error) {
      console.error('Register error:', error);
      const message =
        error.code === 'auth/email-already-in-use'
          ? 'Bu e-posta ile zaten bir hesap var'
          : error.message;
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-white flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <p className="text-sm text-blue-500 font-medium tracking-wide">Her şehirde, her fırsatta.</p>
          <h1 className="text-3xl font-extrabold text-gray-900 mt-2">Hesap Oluştur</h1>
          <div className="flex justify-center mt-4">
            <img
              src="/nerede-app-icon.png"
              alt="nerede? logo"
              className="h-14 w-14 rounded-2xl shadow-lg object-cover"
            />
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-blue-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">Ad Soyad</label>
              <input
                type="text"
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                placeholder="Adınız Soyadınız"
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-gray-50"
                required
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-gray-700">Telefon</label>
                <span className="text-xs text-gray-400">(Opsiyonel)</span>
              </div>
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="05XX XXX XX XX"
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-gray-50"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-gray-700">
                  Davet Kodu <span className="ml-1">🎁</span>
                </label>
                <span className="text-xs text-gray-400">(Opsiyonel)</span>
              </div>
              <input
                type="text"
                name="inviteCode"
                value={form.inviteCode}
                onChange={handleChange}
                placeholder="XXXXXX"
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-gray-50 uppercase tracking-wide"
                maxLength={10}
              />
              <p className="text-xs text-gray-400">Davet kodun varsa gir, 50 puan kazan!</p>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">E-posta</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="ornek@email.com"
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-gray-50"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">Şifre</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="En az 6 karakter"
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-gray-50"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Hesap oluşturuluyor...' : 'Hesap Oluştur'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Zaten hesabınız var mı?{' '}
            <Link href="/login" className="text-blue-600 font-semibold hover:underline">
              Giriş Yap
            </Link>
          </p>

          <p className="text-center text-xs text-gray-400 mt-4">
            Devam ederek{' '}
            <Link href="/kullanim-sartlari" className="underline">
              Kullanım Şartları
            </Link>{' '}
            ve{' '}
            <Link href="/gizlilik-politikasi" className="underline">
              Gizlilik Politikası
            </Link>
            'nı kabul etmiş olursunuz.
          </p>
        </div>
      </div>
    </div>
  );
}
