import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Brain,
  Video,
  Box,
  Fingerprint,
  Shield,
  Zap,
  TrendingUp,
  Award,
  Phone,
  Camera,
  MapPin,
  Activity
} from 'lucide-react';
import { authService } from '@/services/authService';
import { predictiveMaintenance } from '@/lib/ai/predictiveMaintenance';
import { visionAnalysis } from '@/lib/ai/visionAnalysis';
import { voiceCommands } from '@/lib/ai/voiceCommands';
import { multiPartyCall } from '@/lib/webrtc/multiPartyCall';
import { bridgeVisualization3D } from '@/lib/visualization/bridgeModel3D';
import { biometricAuth } from '@/lib/pwa/biometricAuth';
import { smartCache } from '@/lib/pwa/smartCache';
import { hapticFeedback } from '@/lib/pwa/hapticFeedback';
import { geofencing } from '@/lib/safety/geofencing';
import { safetyChecklist } from '@/lib/safety/safetyChecklist';

export default function DashboardNextGen() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [cacheStats, setCacheStats] = useState<any>(null);
  const [activeFences, setActiveFences] = useState<number>(0);
  const [healthScore, setHealthScore] = useState(85);

  useEffect(() => {
    loadUser();
    loadPredictions();
    initializeFeatures();
  }, []);

  const loadUser = async () => {
    const currentUser = await authService.getCurrentUser();
    setUser(currentUser);
  };

  const loadPredictions = async () => {
    try {
      const allPredictions = await predictiveMaintenance.analyzeAllBridges();
      setPredictions(allPredictions.slice(0, 5));
    } catch (error) {
      console.error('Failed to load predictions:', error);
    }
  };

  const initializeFeatures = () => {
    setCacheStats(smartCache.getStats());

    if (user) {
      smartCache.preloadUserData(user.id);
      geofencing.initialize(user.id);
    }

    const fences = geofencing.getActiveFences();
    setActiveFences(fences.length);
  };

  const toggleVoiceCommands = () => {
    if (isVoiceActive) {
      voiceCommands.stopListening();
      setIsVoiceActive(false);
    } else {
      const success = voiceCommands.startListening();
      if (success) {
        voiceCommands.registerDefaultCommands(router);
        setIsVoiceActive(true);
        hapticFeedback.success();
      }
    }
  };

  const enableBiometricAuth = async () => {
    if (!user) return;

    const success = await biometricAuth.register(user.id, user.email);
    if (success) {
      hapticFeedback.success();
      alert('Biometrisk autentisering aktiverad!');
    } else {
      hapticFeedback.error();
      alert('Biometrisk autentisering stöds inte på denna enhet.');
    }
  };

  const startMultiPartyCall = async () => {
    if (!user) return;

    const sessionId = await multiPartyCall.createSession(user.id, user.email);
    hapticFeedback.notification();
    router.push(`/calls/${sessionId}`);
  };

  const analyzeImage = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';

    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        const result = await visionAnalysis.analyzeImage(file);
        hapticFeedback.success();
        alert(`Analys slutförd!\n\nDetekterade problem: ${result.detectedIssues.length}\nTillstånd: ${result.overallCondition}\nBrådska: ${result.urgency}`);
      } catch (error) {
        hapticFeedback.error();
        console.error('Image analysis failed:', error);
      }
    };

    input.click();
  };

  const view3DModel = () => {
    hapticFeedback.selection();
    router.push('/bridges/3d-viewer');
  };

  const features = [
    {
      title: 'AI Vision Analysis',
      icon: <Brain className="h-6 w-6" />,
      description: 'Analysera brofoton automatiskt med AI',
      action: analyzeImage,
      color: 'from-purple-500 to-pink-500',
      badge: 'AI'
    },
    {
      title: 'Multi-Party Video',
      icon: <Video className="h-6 w-6" />,
      description: 'Starta gruppsamtal med skärmdelning',
      action: startMultiPartyCall,
      color: 'from-blue-500 to-cyan-500',
      badge: 'WebRTC'
    },
    {
      title: '3D Bridge Models',
      icon: <Box className="h-6 w-6" />,
      description: 'Visa digitala tvillingar i 3D',
      action: view3DModel,
      color: 'from-green-500 to-emerald-500',
      badge: '3D'
    },
    {
      title: 'Biometric Auth',
      icon: <Fingerprint className="h-6 w-6" />,
      description: 'Aktivera fingeravtryck/Face ID',
      action: enableBiometricAuth,
      color: 'from-yellow-500 to-orange-500',
      badge: 'Security'
    },
    {
      title: 'Voice Commands',
      icon: <Phone className="h-6 w-6" />,
      description: isVoiceActive ? 'Röstkommandon aktiva' : 'Aktivera röstkommandon',
      action: toggleVoiceCommands,
      color: 'from-red-500 to-pink-500',
      badge: isVoiceActive ? 'ON' : 'OFF'
    },
    {
      title: 'Geofencing',
      icon: <MapPin className="h-6 w-6" />,
      description: `${activeFences} aktiva säkerhetszoner`,
      action: () => router.push('/safety/geofences'),
      color: 'from-indigo-500 to-purple-500',
      badge: 'Safety'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            LexHub Next-Gen
          </h1>
          <p className="text-gray-400">Revolutionär fälthantering med AI och realtidsteknik</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gray-800/50 border-gray-700 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-green-400" />
                System Health
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold">{healthScore}%</span>
                <Badge className="bg-green-500">Excellent</Badge>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Cache Hits</span>
                  <span className="text-green-400">{cacheStats?.utilizationPercent.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Active Fences</span>
                  <span className="text-blue-400">{activeFences}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Voice Commands</span>
                  <span className={isVoiceActive ? 'text-green-400' : 'text-gray-500'}>
                    {isVoiceActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-400" />
                Predictive Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {predictions.length > 0 ? (
                  predictions.slice(0, 3).map((pred, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <span className="truncate flex-1">{pred.bridgeName}</span>
                      <Badge
                        className={
                          pred.riskScore > 70 ? 'bg-red-500' :
                          pred.riskScore > 40 ? 'bg-yellow-500' : 'bg-green-500'
                        }
                      >
                        {pred.riskScore}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-400">Laddar prediktioner...</p>
                )}
              </div>
              <Button
                className="w-full mt-4 bg-blue-600 hover:bg-blue-700"
                onClick={() => router.push('/analytics/predictions')}
              >
                Se alla prediktioner
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-yellow-400" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                onClick={analyzeImage}
              >
                <Camera className="h-4 w-4 mr-2" />
                Analysera foto
              </Button>
              <Button
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                onClick={startMultiPartyCall}
              >
                <Video className="h-4 w-4 mr-2" />
                Starta videosamtal
              </Button>
              <Button
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                onClick={() => router.push('/safety/checklist')}
              >
                <Shield className="h-4 w-4 mr-2" />
                Säkerhetschecklista
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, idx) => (
            <Card
              key={idx}
              className="bg-gray-800/50 border-gray-700 backdrop-blur hover:bg-gray-800/70 transition-all cursor-pointer"
              onClick={() => {
                hapticFeedback.selection();
                feature.action();
              }}
            >
              <CardContent className="p-6">
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4`}>
                  {feature.icon}
                </div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">{feature.title}</h3>
                  <Badge variant="outline">{feature.badge}</Badge>
                </div>
                <p className="text-sm text-gray-400">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 p-6 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-lg border border-blue-500/30">
          <div className="flex items-center gap-3 mb-4">
            <Zap className="h-6 w-6 text-yellow-400" />
            <h2 className="text-xl font-bold">Next-Generation Features</h2>
          </div>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <li className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              AI-driven image analysis for bridge inspection
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              Predictive maintenance with ML algorithms
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              Multi-party video calls with screen sharing
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              AR annotations for remote guidance
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              3D bridge models with digital twins
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              Biometric authentication (Face ID/Touch ID)
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              Smart predictive caching
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              Haptic feedback for all interactions
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              Geofencing with safety alerts
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              Voice-activated commands (Swedish)
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
