import React, { useState } from 'react';
import { useAuth } from '../AuthContext';

export default function UserSettings({ onClose }) {
    const { user, signOut, resetPassword, error, clearError } = useAuth();
    const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'security' | 'preferences'
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [passwordChanged, setPasswordChanged] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [loading, setLoading] = useState(false);

    // Notification preferences (stored in localStorage)
    const [notifications, setNotifications] = useState(() => {
        const saved = localStorage.getItem(`auction_intel_notifications_${user?.id}`);
        return saved ? JSON.parse(saved) : {
            auctionAlerts: true,
            priceDrops: true,
            watchlistUpdates: true,
            emailDigest: false
        };
    });

    const handleNotificationChange = (key) => {
        const updated = { ...notifications, [key]: !notifications[key] };
        setNotifications(updated);
        localStorage.setItem(`auction_intel_notifications_${user?.id}`, JSON.stringify(updated));
    };

    const handleChangePassword = async () => {
        setPasswordError('');

        if (newPassword.length < 6) {
            setPasswordError('Password must be at least 6 characters');
            return;
        }

        if (newPassword !== confirmPassword) {
            setPasswordError('Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            // In a real app, this would call an API
            // For now, we update localStorage directly
            const users = JSON.parse(localStorage.getItem('auction_intel_users') || '[]');
            const userIndex = users.findIndex(u => u.id === user.id);
            if (userIndex !== -1) {
                users[userIndex].password = newPassword;
                localStorage.setItem('auction_intel_users', JSON.stringify(users));
            }
            setPasswordChanged(true);
            setIsChangingPassword(false);
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            setPasswordError('Failed to update password');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (isoString) => {
        return new Date(isoString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className="bg-white rounded-3xl shadow-lg border border-slate-100 flex flex-col h-full">
            {/* Header */}
            <div className="p-6 md:p-8 border-b border-slate-100">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl md:text-4xl font-display font-black text-slate-900 tracking-tighter">Settings</h2>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Manage your account</p>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all">
                        ✕
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mt-6">
                    {[
                        { id: 'profile', label: 'Profile', icon: '👤' },
                        { id: 'security', label: 'Security', icon: '🔐' },
                        { id: 'preferences', label: 'Preferences', icon: '⚙️' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === tab.id
                                    ? 'bg-slate-900 text-white shadow-lg'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                        >
                            <span>{tab.icon}</span>
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-6 md:p-8">
                {/* Profile Tab */}
                {activeTab === 'profile' && (
                    <div className="space-y-6">
                        {/* User avatar and info */}
                        <div className="flex items-center gap-6 p-6 bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl">
                            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-3xl font-bold text-white shadow-lg">
                                {user?.name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <div>
                                <h3 className="font-display font-black text-2xl text-slate-900">{user?.name}</h3>
                                <p className="text-slate-500">{user?.email}</p>
                                <p className="text-xs text-slate-400 mt-1">Member since {user?.createdAt ? formatDate(user.createdAt) : 'N/A'}</p>
                            </div>
                        </div>

                        {/* Account details */}
                        <div className="grid gap-4">
                            <div className="p-4 bg-white border border-slate-200 rounded-xl">
                                <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Full Name</div>
                                <div className="text-lg font-bold text-slate-900">{user?.name}</div>
                            </div>
                            <div className="p-4 bg-white border border-slate-200 rounded-xl">
                                <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Email Address</div>
                                <div className="text-lg font-bold text-slate-900">{user?.email}</div>
                            </div>
                            <div className="p-4 bg-white border border-slate-200 rounded-xl">
                                <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Account ID</div>
                                <div className="font-mono text-sm text-slate-600">{user?.id}</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Security Tab */}
                {activeTab === 'security' && (
                    <div className="space-y-6">
                        {/* Password section */}
                        <div className="p-6 bg-white border border-slate-200 rounded-2xl">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="font-display font-bold text-lg text-slate-900">Password</h3>
                                    <p className="text-sm text-slate-500">Change your account password</p>
                                </div>
                                {!isChangingPassword && (
                                    <button
                                        onClick={() => setIsChangingPassword(true)}
                                        className="px-4 py-2 bg-slate-100 text-slate-700 text-sm font-bold rounded-lg hover:bg-slate-200 transition-all"
                                    >
                                        Change
                                    </button>
                                )}
                            </div>

                            {passwordChanged && (
                                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl mb-4">
                                    <p className="text-sm text-emerald-700 font-medium">✓ Password updated successfully</p>
                                </div>
                            )}

                            {isChangingPassword && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                                        <input
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Enter new password"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Confirm Password</label>
                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Confirm new password"
                                        />
                                    </div>
                                    {passwordError && (
                                        <p className="text-sm text-red-500">{passwordError}</p>
                                    )}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleChangePassword}
                                            disabled={loading}
                                            className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all"
                                        >
                                            {loading ? 'Updating...' : 'Update Password'}
                                        </button>
                                        <button
                                            onClick={() => { setIsChangingPassword(false); setPasswordError(''); }}
                                            className="px-4 py-2 bg-slate-100 text-slate-600 text-sm font-bold rounded-lg hover:bg-slate-200 transition-all"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Session section */}
                        <div className="p-6 bg-white border border-slate-200 rounded-2xl">
                            <h3 className="font-display font-bold text-lg text-slate-900 mb-2">Session</h3>
                            <p className="text-sm text-slate-500 mb-4">Sign out of your account across all devices</p>
                            <button
                                onClick={signOut}
                                className="px-4 py-2 bg-red-50 text-red-600 text-sm font-bold rounded-lg border border-red-200 hover:bg-red-100 transition-all"
                            >
                                Sign Out
                            </button>
                        </div>
                    </div>
                )}

                {/* Preferences Tab */}
                {activeTab === 'preferences' && (
                    <div className="space-y-6">
                        <div className="p-6 bg-white border border-slate-200 rounded-2xl">
                            <h3 className="font-display font-bold text-lg text-slate-900 mb-4">Notification Preferences</h3>
                            <div className="space-y-3">
                                {[
                                    { key: 'auctionAlerts', label: 'Auction Alerts', desc: 'Get notified about upcoming auctions in your watchlist' },
                                    { key: 'priceDrops', label: 'Price Drops', desc: 'Alerts when property prices drop significantly' },
                                    { key: 'watchlistUpdates', label: 'Watchlist Updates', desc: 'Updates about properties in your watchlist' },
                                    { key: 'emailDigest', label: 'Weekly Email Digest', desc: 'Receive a weekly summary via email' }
                                ].map(pref => (
                                    <div key={pref.key} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                                        <div>
                                            <div className="font-medium text-slate-900">{pref.label}</div>
                                            <div className="text-xs text-slate-500">{pref.desc}</div>
                                        </div>
                                        <button
                                            onClick={() => handleNotificationChange(pref.key)}
                                            className={`w-12 h-7 rounded-full transition-all ${notifications[pref.key] ? 'bg-blue-600' : 'bg-slate-300'
                                                }`}
                                        >
                                            <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${notifications[pref.key] ? 'translate-x-6' : 'translate-x-1'
                                                }`} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
