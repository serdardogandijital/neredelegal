import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { collection, getDocs, updateDoc, doc, query, orderBy, where, addDoc, serverTimestamp } from 'firebase/firestore';
import AdminLayout from '../../components/AdminLayout';
import { auth, db } from '../../lib/firebase';
import toast from 'react-hot-toast';

export default function SupportTicketsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        router.push('/login');
      } else {
        await loadTickets();
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  const loadTickets = async () => {
    try {
      const q = query(collection(db, 'supportTickets'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const ticketsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTickets(ticketsData);
    } catch (error) {
      console.error('Error loading tickets:', error);
      toast.error('Destek talepleri yüklenemedi');
    }
  };

  const loadTicketMessages = async (ticketId) => {
    try {
      const q = query(
        collection(db, 'supportTickets', ticketId, 'messages'),
        orderBy('createdAt', 'asc')
      );
      const snapshot = await getDocs(q);
      const messagesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(messagesData);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Mesajlar yüklenemedi');
    }
  };

  const handleViewTicket = async (ticket) => {
    setSelectedTicket(ticket);
    await loadTicketMessages(ticket.id);
    setShowDetailModal(true);
  };

  const handleUpdateStatus = async (ticketId, newStatus) => {
    try {
      await updateDoc(doc(db, 'supportTickets', ticketId), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });
      
      await loadTickets();
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket({ ...selectedTicket, status: newStatus });
      }
      
      toast.success('Durum güncellendi');
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Durum güncellenemedi');
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedTicket) return;

    try {
      setSending(true);
      
      const messageData = {
        ticketId: selectedTicket.id,
        userId: auth.currentUser.uid,
        userName: 'Destek Ekibi',
        userType: 'admin',
        message: newMessage.trim(),
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'supportTickets', selectedTicket.id, 'messages'), messageData);
      
      // Update ticket
      await updateDoc(doc(db, 'supportTickets', selectedTicket.id), {
        updatedAt: serverTimestamp(),
        unreadMessages: 0,
      });

      setNewMessage('');
      await loadTicketMessages(selectedTicket.id);
      toast.success('Mesaj gönderildi');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Mesaj gönderilemedi');
    } finally {
      setSending(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'open': return 'Açık';
      case 'in_progress': return 'İşleniyor';
      case 'resolved': return 'Çözüldü';
      case 'closed': return 'Kapatıldı';
      default: return status;
    }
  };

  const getCategoryText = (category) => {
    const categories = {
      technical: 'Teknik Sorun',
      account: 'Hesap Sorunu',
      payment: 'Ödeme Sorunu',
      checkin: 'Check-in Sorunu',
      campaign: 'Kampanya Sorunu',
      other: 'Diğer',
    };
    return categories[category] || category;
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = 
      ticket.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.ticketNumber?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || ticket.status === filterStatus;
    const matchesCategory = filterCategory === 'all' || ticket.category === filterCategory;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const stats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === 'open').length,
    inProgress: tickets.filter(t => t.status === 'in_progress').length,
    resolved: tickets.filter(t => t.status === 'resolved').length,
    closed: tickets.filter(t => t.status === 'closed').length,
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Destek Talepleri</h1>
            <p className="text-gray-600 mt-1">Kullanıcı destek taleplerini yönetin</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-600">Toplam</div>
            <div className="text-2xl font-bold text-gray-900 mt-2">{stats.total}</div>
          </div>
          <div className="bg-yellow-50 rounded-lg shadow p-6">
            <div className="text-sm font-medium text-yellow-600">Açık</div>
            <div className="text-2xl font-bold text-yellow-900 mt-2">{stats.open}</div>
          </div>
          <div className="bg-blue-50 rounded-lg shadow p-6">
            <div className="text-sm font-medium text-blue-600">İşleniyor</div>
            <div className="text-2xl font-bold text-blue-900 mt-2">{stats.inProgress}</div>
          </div>
          <div className="bg-green-50 rounded-lg shadow p-6">
            <div className="text-sm font-medium text-green-600">Çözüldü</div>
            <div className="text-2xl font-bold text-green-900 mt-2">{stats.resolved}</div>
          </div>
          <div className="bg-gray-50 rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-600">Kapatıldı</div>
            <div className="text-2xl font-bold text-gray-900 mt-2">{stats.closed}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Ara... (konu, kullanıcı, ticket no)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">Tüm Durumlar</option>
              <option value="open">Açık</option>
              <option value="in_progress">İşleniyor</option>
              <option value="resolved">Çözüldü</option>
              <option value="closed">Kapatıldı</option>
            </select>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">Tüm Kategoriler</option>
              <option value="technical">Teknik Sorun</option>
              <option value="account">Hesap Sorunu</option>
              <option value="payment">Ödeme Sorunu</option>
              <option value="checkin">Check-in Sorunu</option>
              <option value="campaign">Kampanya Sorunu</option>
              <option value="other">Diğer</option>
            </select>
          </div>
        </div>

        {/* Tickets List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ticket
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kullanıcı
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kategori
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Durum
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tarih
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTickets.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {ticket.ticketNumber}
                    </div>
                    <div className="text-sm text-gray-500 truncate max-w-xs">
                      {ticket.subject}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{ticket.userName}</div>
                    <div className="text-sm text-gray-500">{ticket.userEmail}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900">
                      {getCategoryText(ticket.category)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(ticket.status)}`}>
                      {getStatusText(ticket.status)}
                    </span>
                    {ticket.unreadMessages > 0 && (
                      <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full">
                        {ticket.unreadMessages} yeni
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {ticket.createdAt?.toDate?.().toLocaleDateString('tr-TR')}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleViewTicket(ticket)}
                      className="text-purple-600 hover:text-purple-900"
                    >
                      Görüntüle
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Detail Modal */}
        {showDetailModal && selectedTicket && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {selectedTicket.ticketNumber}
                    </h2>
                    <p className="text-gray-600 mt-1">{selectedTicket.subject}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(selectedTicket.status)}`}>
                        {getStatusText(selectedTicket.status)}
                      </span>
                      <span className="text-sm text-gray-500">
                        {getCategoryText(selectedTicket.category)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* User Info */}
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-gray-600">Kullanıcı:</span>
                      <p className="font-medium">{selectedTicket.userName}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">E-posta:</span>
                      <p className="font-medium">{selectedTicket.userEmail}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Telefon:</span>
                      <p className="font-medium">{selectedTicket.userPhone || '-'}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Oluşturulma:</span>
                      <p className="font-medium">
                        {selectedTicket.createdAt?.toDate?.().toLocaleString('tr-TR')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Status Actions */}
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => handleUpdateStatus(selectedTicket.id, 'in_progress')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    İşleme Al
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedTicket.id, 'resolved')}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Çözüldü
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedTicket.id, 'closed')}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                  >
                    Kapat
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {/* Initial Message */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {selectedTicket.userName?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{selectedTicket.userName}</span>
                        <span className="text-sm text-gray-500">
                          {selectedTicket.createdAt?.toDate?.().toLocaleString('tr-TR')}
                        </span>
                      </div>
                      <p className="mt-2 text-gray-700">{selectedTicket.message}</p>
                    </div>
                  </div>
                </div>

                {/* Conversation Messages */}
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`rounded-lg p-4 ${
                      message.userType === 'admin' ? 'bg-blue-50' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
                        message.userType === 'admin' ? 'bg-blue-600' : 'bg-purple-600'
                      }`}>
                        {message.userName?.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{message.userName}</span>
                          <span className="text-sm text-gray-500">
                            {message.createdAt?.toDate?.().toLocaleString('tr-TR')}
                          </span>
                        </div>
                        <p className="mt-2 text-gray-700">{message.message}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Reply Form */}
              {selectedTicket.status !== 'closed' && (
                <div className="p-6 border-t border-gray-200">
                  <div className="flex gap-4">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Yanıtınızı yazın..."
                      rows={3}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || sending}
                      className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed self-end"
                    >
                      {sending ? 'Gönderiliyor...' : 'Gönder'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

