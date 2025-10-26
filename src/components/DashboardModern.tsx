import { useState } from 'react';
import { useRouter } from 'next/router';
import type { User } from '@/types';
import { 
  Building2, 
  Briefcase, 
  AlertTriangle, 
  Users, 
  FileText, 
  Bot,
  Shield,
  TrendingUp,
  Clock,
  CheckCircle2,
  ArrowRight,
  Activity
} from 'lucide-react';

interface DashboardModernProps {
  user: User;
  onLogout: () => void;
}

export function DashboardModern({ user, onLogout }: DashboardModernProps) {
  const router = useRouter();
  const [stats] = useState({
    totalBridges: 24517,
    activeJobs: 0,
    trafficEvents: 1116,
    teamMembers: 6
  });

  const quickActions = [
    {
      title: 'Broregister',
      description: 'Hantera och inspektera broar',
      icon: Building2,
      href: '/bridges',
      color: 'from-orange-500 to-orange-600',
      stats: `${stats.totalBridges.toLocaleString()} broar`
    },
    {
      title: 'Starta nytt jobb',
      description: 'Skapa ny arbetsorder',
      icon: Briefcase,
      href: '/new-job',
      color: 'from-blue-500 to-blue-600',
      stats: `${stats.activeJobs} aktiva`
    },
    {
      title: 'Trafikvarningar',
      description: 'Realtidsövervakning',
      icon: AlertTriangle,
      href: '/traffic-alerts',
      color: 'from-red-500 to-red-600',
      stats: `${stats.trafficEvents} händelser`
    },
    {
      title: 'Kontakter',
      description: 'Team och kommunikation',
      icon: Users,
      href: '/contacts',
      color: 'from-purple-500 to-purple-600',
      stats: `${stats.teamMembers} medlemmar`
    },
    {
      title: 'KMA Dokument',
      description: 'Kvalitetsdokumentation',
      icon: FileText,
      href: '/kma',
      color: 'from-green-500 to-green-600',
      stats: 'Dokumenthantering'
    },
    {
      title: 'AI-Assistent',
      description: 'Intelligent support',
      icon: Bot,
      href: '/ai-assistant',
      color: 'from-indigo-500 to-indigo-600',
      stats: 'Alltid tillgänglig'
    }
  ];

  const recentActivity = [
    { action: 'Bro 1-112-1 inspekterad', time: '2 timmar sedan', icon: CheckCircle2, color: 'text-green-500' },
    { action: 'Trafikvarning aktiverad', time: '4 timmar sedan', icon: AlertTriangle, color: 'text-orange-500' },
    { action: 'Nytt jobb skapat', time: '6 timmar sedan', icon: Briefcase, color: 'text-blue-500' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Building2 className="h-8 w-8 text-orange-500" />
                <div>
                  <h1 className="text-xl font-bold text-slate-900">SVENSKA <span className="text-orange-500">BRO</span></h1>
                  <p className="text-xs text-slate-500">Aktiebolag</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-slate-900">{user.full_name || user.email}</p>
                <p className="text-xs text-slate-500">{user.role || 'Anställd'}</p>
              </div>
              <button
                onClick={onLogout}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Logga ut
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">
            Välkommen tillbaka, {user.full_name?.split(' ')[0] || user.email?.split('@')[0] || 'Fredrik'}
          </h2>
          <p className="text-slate-600">
            Här är en översikt över dina system och aktuell status
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Building2 className="h-6 w-6 text-orange-600" />
              </div>
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-1">
              {stats.totalBridges.toLocaleString()}
            </h3>
            <p className="text-sm text-slate-600">Totala broar</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Briefcase className="h-6 w-6 text-blue-600" />
              </div>
              <Activity className="h-5 w-5 text-blue-500" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-1">{stats.activeJobs}</h3>
            <p className="text-sm text-slate-600">Aktiva jobb</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-red-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <Clock className="h-5 w-5 text-orange-500" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-1">
              {stats.trafficEvents.toLocaleString()}
            </h3>
            <p className="text-sm text-slate-600">Trafikhändelser</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-1">{stats.teamMembers}</h3>
            <p className="text-sm text-slate-600">Teammedlemmar</p>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-slate-900 mb-4">Snabbåtkomst</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.href}
                  onClick={() => router.push(action.href)}
                  className="group bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-lg transition-all duration-200 text-left"
                >
                  <div className={`inline-flex p-3 rounded-lg bg-gradient-to-br ${action.color} mb-4`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h4 className="text-lg font-semibold text-slate-900 mb-2 group-hover:text-orange-600 transition-colors">
                    {action.title}
                  </h4>
                  <p className="text-sm text-slate-600 mb-3">{action.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500">{action.stats}</span>
                    <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h3 className="text-xl font-bold text-slate-900 mb-4">Senaste aktivitet</h3>
          <div className="space-y-4">
            {recentActivity.map((activity, index) => {
              const Icon = activity.icon;
              return (
                <div key={index} className="flex items-center space-x-4 p-3 hover:bg-slate-50 rounded-lg transition-colors">
                  <div className={`${activity.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">{activity.action}</p>
                    <p className="text-xs text-slate-500">{activity.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Safety Notice */}
        <div className="mt-8 bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-6">
          <div className="flex items-start space-x-4">
            <div className="p-2 bg-orange-500 rounded-lg">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h4 className="text-lg font-semibold text-orange-900 mb-1">Säkerheten först</h4>
              <p className="text-sm text-orange-800">
                Var alltid medveten om din omgivning vid broinspektion. Använd alltid skyddsutrustning och följ säkerhetsrutiner.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

