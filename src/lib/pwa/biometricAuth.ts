export interface BiometricCredential {
  id: string;
  publicKey: string;
  counter: number;
  created: Date;
}

export class BiometricAuthService {
  private isAvailable = false;
  private credential: BiometricCredential | null = null;

  constructor() {
    this.checkAvailability();
  }

  private async checkAvailability() {
    if (typeof window === 'undefined') {
      this.isAvailable = false;
      return;
    }

    this.isAvailable = !!(
      window.PublicKeyCredential &&
      navigator.credentials &&
      navigator.credentials.create
    );

    console.log('🔐 Biometric auth available:', this.isAvailable);
  }

  async register(userId: string, userName: string): Promise<boolean> {
    if (!this.isAvailable) {
      console.warn('Biometric authentication not available');
      return false;
    }

    try {
      const challenge = this.generateChallenge();

      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: challenge,
          rp: {
            name: 'LexHub',
            id: window.location.hostname
          },
          user: {
            id: this.stringToBuffer(userId),
            name: userName,
            displayName: userName
          },
          pubKeyCredParams: [
            { type: 'public-key', alg: -7 },
            { type: 'public-key', alg: -257 }
          ],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'required',
            requireResidentKey: false
          },
          timeout: 60000,
          attestation: 'none'
        }
      }) as any;

      if (!credential) {
        throw new Error('Failed to create credential');
      }

      this.credential = {
        id: credential.id,
        publicKey: this.bufferToBase64(credential.response.getPublicKey()),
        counter: credential.response.authenticatorData ?
          new DataView(credential.response.authenticatorData).getUint32(33, false) : 0,
        created: new Date()
      };

      await this.storeCredential(userId, this.credential);

      console.log('✅ Biometric registration successful');
      return true;
    } catch (error) {
      console.error('Biometric registration failed:', error);
      return false;
    }
  }

  async authenticate(userId: string): Promise<boolean> {
    if (!this.isAvailable) {
      console.warn('Biometric authentication not available');
      return false;
    }

    try {
      const storedCredential = await this.getStoredCredential(userId);
      if (!storedCredential) {
        console.warn('No stored credential found for user');
        return false;
      }

      const challenge = this.generateChallenge();

      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge: challenge,
          rpId: window.location.hostname,
          allowCredentials: [{
            type: 'public-key',
            id: this.stringToBuffer(storedCredential.id)
          }],
          userVerification: 'required',
          timeout: 60000
        }
      }) as any;

      if (!assertion) {
        throw new Error('Authentication failed');
      }

      console.log('✅ Biometric authentication successful');
      return true;
    } catch (error) {
      console.error('Biometric authentication failed:', error);
      return false;
    }
  }

  async isRegistered(userId: string): Promise<boolean> {
    const credential = await this.getStoredCredential(userId);
    return credential !== null;
  }

  async unregister(userId: string): Promise<void> {
    if (typeof window === 'undefined') return;

    localStorage.removeItem(`biometric_credential_${userId}`);
    this.credential = null;

    console.log('🗑️ Biometric credential removed');
  }

  isSupported(): boolean {
    return this.isAvailable;
  }

  async getSupportedAuthenticators(): Promise<string[]> {
    const authenticators: string[] = [];

    if (!this.isAvailable) return authenticators;

    try {
      const available = await (window.PublicKeyCredential as any).isUserVerifyingPlatformAuthenticatorAvailable();
      if (available) {
        authenticators.push('platform');
      }
    } catch (error) {
      console.error('Failed to check authenticator support:', error);
    }

    if (navigator.userAgent.includes('Android')) {
      authenticators.push('fingerprint');
    }

    if (navigator.userAgent.includes('iPhone') || navigator.userAgent.includes('iPad')) {
      authenticators.push('face-id', 'touch-id');
    }

    return authenticators;
  }

  private generateChallenge(): Uint8Array {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return array;
  }

  private stringToBuffer(str: string): Uint8Array {
    return new TextEncoder().encode(str);
  }

  private bufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private async storeCredential(userId: string, credential: BiometricCredential): Promise<void> {
    if (typeof window === 'undefined') return;

    const key = `biometric_credential_${userId}`;
    localStorage.setItem(key, JSON.stringify(credential));
  }

  private async getStoredCredential(userId: string): Promise<BiometricCredential | null> {
    if (typeof window === 'undefined') return null;

    const key = `biometric_credential_${userId}`;
    const stored = localStorage.getItem(key);

    if (!stored) return null;

    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }
}

export const biometricAuth = new BiometricAuthService();
