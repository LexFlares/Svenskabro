import React, { useState } from 'react';
import { Users, Plus, Copy, Check, UserPlus, Settings, Crown, Shield } from 'lucide-react';

interface WorkGroup {
  id: string;
  name: string;
  description: string;
  inviteCode: string;
  memberCount: number;
  role: 'owner' | 'admin' | 'member';
  createdAt: Date;
}

export default function WorkGroups() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');

  // Mock data - replace with real data from Supabase
  const [workGroups, setWorkGroups] = useState<WorkGroup[]>([
    {
      id: '1',
      name: 'Stockholms Brogrupp',
      description: 'Ansvarig för broar i Stockholms län',
      inviteCode: 'STHLM2025',
      memberCount: 12,
      role: 'owner',
      createdAt: new Date('2025-01-15'),
    },
    {
      id: '2',
      name: 'Södra Regionen',
      description: 'Broinspektion och underhåll södra Sverige',
      inviteCode: 'SOUTH2025',
      memberCount: 8,
      role: 'admin',
      createdAt: new Date('2025-02-10'),
    },
    {
      id: '3',
      name: 'Akutgruppen',
      description: 'Snabb respons för brådskande broåtgärder',
      inviteCode: 'AKUT2025',
      memberCount: 5,
      role: 'member',
      createdAt: new Date('2025-03-01'),
    },
  ]);

  const copyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleCreateGroup = () => {
    if (!newGroupName.trim()) return;

    const newGroup: WorkGroup = {
      id: Date.now().toString(),
      name: newGroupName,
      description: newGroupDescription,
      inviteCode: generateInviteCode(),
      memberCount: 1,
      role: 'owner',
      createdAt: new Date(),
    };

    setWorkGroups([newGroup, ...workGroups]);
    setNewGroupName('');
    setNewGroupDescription('');
    setShowCreateModal(false);
  };

  const generateInviteCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'admin':
        return <Shield className="w-4 h-4 text-blue-500" />;
      default:
        return <Users className="w-4 h-4 text-gray-500" />;
    }
  };

  const getRoleBadge = (role: string) => {
    const styles = {
      owner: 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white',
      admin: 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white',
      member: 'bg-gray-200 text-gray-700',
    };
    return styles[role as keyof typeof styles] || styles.member;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 md:p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
              Arbetsgrupper
            </h1>
            <p className="text-gray-600">Hantera dina team och samarbeten</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200"
          >
            <Plus className="w-5 h-5" />
            Skapa grupp
          </button>
        </div>
      </div>

      {/* Work Groups Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {workGroups.map((group) => (
          <div
            key={group.id}
            className="group bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-gray-100"
          >
            {/* Group Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-800">{group.name}</h3>
                  <div className="flex items-center gap-1 mt-1">
                    {getRoleIcon(group.role)}
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getRoleBadge(group.role)}`}>
                      {group.role === 'owner' ? 'Ägare' : group.role === 'admin' ? 'Admin' : 'Medlem'}
                    </span>
                  </div>
                </div>
              </div>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Settings className="w-5 h-5 text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            {/* Description */}
            <p className="text-gray-600 text-sm mb-4 line-clamp-2">{group.description}</p>

            {/* Stats */}
            <div className="flex items-center gap-4 mb-4 text-sm">
              <div className="flex items-center gap-1 text-gray-600">
                <Users className="w-4 h-4" />
                <span>{group.memberCount} medlemmar</span>
              </div>
            </div>

            {/* Invite Code */}
            <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-3 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Inbjudningskod</p>
                  <p className="font-mono font-bold text-blue-600">{group.inviteCode}</p>
                </div>
                <button
                  onClick={() => copyInviteCode(group.inviteCode)}
                  className="p-2 hover:bg-white rounded-lg transition-all duration-200 hover:shadow-md"
                >
                  {copiedCode === group.inviteCode ? (
                    <Check className="w-5 h-5 text-green-500" />
                  ) : (
                    <Copy className="w-5 h-5 text-gray-400 hover:text-blue-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Action Button */}
            <button className="w-full mt-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all duration-200 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2">
              <UserPlus className="w-4 h-4" />
              Visa medlemmar
            </button>
          </div>
        ))}

        {/* Join Group Card */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-dashed border-green-300 flex flex-col items-center justify-center text-center hover:border-green-400 transition-all duration-200 cursor-pointer group">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <UserPlus className="w-8 h-8 text-white" />
          </div>
          <h3 className="font-bold text-lg text-gray-800 mb-2">Gå med i grupp</h3>
          <p className="text-gray-600 text-sm mb-4">Har du en inbjudningskod?</p>
          <button className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:shadow-lg transition-all duration-200">
            Ange kod
          </button>
        </div>
      </div>

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-200">
            <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Skapa ny arbetsgrupp
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gruppnamn *
                </label>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="T.ex. Stockholms Brogrupp"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Beskrivning
                </label>
                <textarea
                  value={newGroupDescription}
                  onChange={(e) => setNewGroupDescription(e.target.value)}
                  placeholder="Beskriv gruppens syfte och ansvar..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all"
              >
                Avbryt
              </button>
              <button
                onClick={handleCreateGroup}
                disabled={!newGroupName.trim()}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Skapa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

