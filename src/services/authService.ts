
import { supabase } from "@/integrations/supabase/client";
import type { User as SupabaseUser, Session } from "@supabase/supabase-js";
import type { Profile, ProfileInsert } from "@/types";

export interface AuthUser {
  id: string;
  email: string;
  user_metadata?: Record<string, unknown>;
  created_at?: string;
}

export interface AuthError {
  message: string;
  code?: string;
}

// Dynamic URL Helper
const getURL = () => {
  let url = process?.env?.NEXT_PUBLIC_VERCEL_URL ?? 
           process?.env?.NEXT_PUBLIC_SITE_URL ?? 
           'http://localhost:3000'
  
  if (!url) {
    url = 'http://localhost:3000';
  }
  
  url = url.startsWith('http') ? url : `https://${url}`
  url = url.endsWith('/') ? url : `${url}/`
  
  return url
}

export const authService = {
  // Get current user
  async getCurrentUser(): Promise<AuthUser | null> {
    const { data: { user } } = await supabase.auth.getUser();
    return user ? {
      id: user.id,
      email: user.email || "",
      user_metadata: user.user_metadata,
      created_at: user.created_at
    } : null;
  },

  // Get current session
  async getCurrentSession(): Promise<Session | null> {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  },

  // Get profile from profiles table
  async getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error fetching profile:", error);
      return null;
    }
    return data as Profile;
  },

  // Create or update profile after auth
  async upsertProfile(userId: string, email: string, fullName?: string, metadata?: Record<string, unknown>): Promise<Profile | null> {
    const profileData: ProfileInsert = {
      id: userId,
      email: email,
      full_name: fullName || email.split('@')[0],
      username: email,
      role: "employee",
      status: "active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      avatar_url: null,
      company: null,
      phone: null
    };

    const { data, error } = await supabase
      .from("profiles")
      .upsert(profileData)
      .select()
      .single();

    if (error) {
      console.error("Error upserting profile:", error);
      return null;
    }
    return data as Profile;
  },

  // Sign up with email and password
  async signUp(
    email: string, 
    password: string, 
    fullName?: string
  ): Promise<{ user: AuthUser | null; profile: Profile | null; error: AuthError | null }> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${getURL()}auth/confirm-email`,
          data: {
            full_name: fullName || email.split('@')[0]
          }
        }
      });

      if (error) {
        console.error("Sign up error:", error);
        
        // Swedish error messages
        if (error.message.includes('captcha') || error.message.includes('verification')) {
          return { 
            user: null, 
            profile: null, 
            error: { 
              message: "CAPTCHA-verifiering misslyckades. Kontakta support (ops@lexflares.com) eller försök igen senare.",
              code: "captcha_failed"
            } 
          };
        }
        
        if (error.message.includes('already registered') || error.message.includes('already exists')) {
          return { 
            user: null, 
            profile: null, 
            error: { 
              message: "Den här e-postadressen är redan registrerad. Försök logga in istället.",
              code: "email_exists"
            } 
          };
        }
        
        return { user: null, profile: null, error: { message: error.message, code: error.status?.toString() } };
      }

      const authUser = data.user ? {
        id: data.user.id,
        email: data.user.email || "",
        user_metadata: data.user.user_metadata,
        created_at: data.user.created_at
      } : null;

      let profile: Profile | null = null;
      if (authUser) {
        profile = await this.upsertProfile(
          authUser.id, 
          authUser.email, 
          fullName,
          authUser.user_metadata
        );
      }

      return { user: authUser, profile, error: null };
    } catch (error: any) {
      console.error("Unexpected sign up error:", error);
      
      if (error?.message?.includes('captcha') || error?.message?.includes('verification')) {
        return { 
          user: null, 
          profile: null,
          error: { 
            message: "CAPTCHA-verifiering misslyckades. Kontakta support (ops@lexflares.com) eller försök igen senare.",
            code: "captcha_failed"
          } 
        };
      }
      
      return { 
        user: null, 
        profile: null,
        error: { message: "Ett oväntat fel uppstod vid registrering. Kontakta support om problemet kvarstår." } 
      };
    }
  },

  // Sign in with email and password
  async signIn(email: string, password: string): Promise<{ user: AuthUser | null; profile: Profile | null; error: AuthError | null }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error("Sign in error:", error);
        
        // Swedish error messages
        if (error.message.includes('Invalid login credentials')) {
          return { 
            user: null, 
            profile: null, 
            error: { 
              message: "Felaktigt användarnamn eller lösenord. Kontrollera dina uppgifter och försök igen.",
              code: "invalid_credentials"
            } 
          };
        }
        
        if (error.message.includes('Email not confirmed')) {
          return { 
            user: null, 
            profile: null, 
            error: { 
              message: "Bekräfta din e-post innan du loggar in. Kontrollera din inkorg och klicka på bekräftelselänken.",
              code: "email_not_confirmed"
            } 
          };
        }
        
        if (error.message.includes('captcha') || error.message.includes('verification')) {
          return { 
            user: null, 
            profile: null, 
            error: { 
              message: "CAPTCHA-verifiering misslyckades. Kontakta support (ops@lexflares.com) eller försök igen senare.",
              code: "captcha_failed"
            } 
          };
        }
        
        return { user: null, profile: null, error: { message: error.message, code: error.status?.toString() } };
      }

      const authUser = data.user ? {
        id: data.user.id,
        email: data.user.email || "",
        user_metadata: data.user.user_metadata,
        created_at: data.user.created_at
      } : null;

      let profile: Profile | null = null;
      if (authUser) {
        profile = await this.getProfile(authUser.id);
        
        if (!profile) {
          profile = await this.upsertProfile(
            authUser.id,
            authUser.email,
            authUser.user_metadata?.full_name as string | undefined
          );
        }
      }

      return { user: authUser, profile, error: null };
    } catch (error: any) {
      console.error("Unexpected sign in error:", error);
      
      if (error?.message?.includes('captcha') || error?.message?.includes('verification')) {
        return { 
          user: null,
          profile: null,
          error: { 
            message: "CAPTCHA-verifiering misslyckades. Kontakta support (ops@lexflares.com) eller försök igen senare.",
            code: "captcha_failed"
          } 
        };
      }
      
      return { 
        user: null,
        profile: null,
        error: { message: "Ett oväntat fel uppstod vid inloggning. Kontakta support om problemet kvarstår." } 
      };
    }
  },

  // Sign out
  async signOut(): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        return { error: { message: error.message } };
      }

      return { error: null };
    } catch (error) {
      return { 
        error: { message: "An unexpected error occurred during sign out" } 
      };
    }
  },

  // Reset password
  async resetPassword(email: string): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${getURL()}auth/reset-password`,
      });

      if (error) {
        return { error: { message: error.message } };
      }

      return { error: null };
    } catch (error) {
      return { 
        error: { message: "An unexpected error occurred during password reset" } 
      };
    }
  },

  // Update password
  async updatePassword(newPassword: string): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        return { error: { message: error.message } };
      }

      return { error: null };
    } catch (error) {
      return {
        error: { message: "An unexpected error occurred during password update" }
      };
    }
  },

  // Invite user via email (ADMIN ONLY)
  async inviteUserByEmail(
    email: string,
    fullName?: string,
    role: "admin" | "employee" = "employee"
  ): Promise<{ success: boolean; error: AuthError | null }> {
    try {
      // Use Supabase Admin API to invite user
      const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
        data: {
          full_name: fullName || email.split('@')[0],
          role: role
        },
        redirectTo: `${getURL()}auth/set-password`
      });

      if (error) {
        console.error("Invite user error:", error);
        return { 
          success: false, 
          error: { 
            message: error.message.includes('already registered') 
              ? "Användaren är redan registrerad"
              : "Kunde inte skicka inbjudan. Kontrollera e-postadressen.",
            code: error.status?.toString()
          } 
        };
      }

      return { success: true, error: null };
    } catch (error: any) {
      console.error("Unexpected invite error:", error);
      return { 
        success: false,
        error: { message: "Ett oväntat fel uppstod vid inbjudan" } 
      };
    }
  },

  // List all users (profiles) - ADMIN ONLY
  async getAllProfiles(): Promise<{ profiles: Profile[]; error: AuthError | null }> {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching profiles:", error);
        return { profiles: [], error: { message: error.message } };
      }

      return { profiles: data as Profile[], error: null };
    } catch (error) {
      return { 
        profiles: [],
        error: { message: "Failed to fetch user profiles" }
      };
    }
  },

  // Update profile role (ADMIN ONLY)
  async updateProfileRole(userId: string, role: "admin" | "employee"): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ role, updated_at: new Date().toISOString() })
        .eq("id", userId);

      if (error) {
        return { error: { message: error.message } };
      }

      return { error: null };
    } catch (error) {
      return { error: { message: "Failed to update user role" } };
    }
  },

  // Delete user (ADMIN ONLY)
  async deleteUser(userId: string): Promise<{ error: AuthError | null }> {
    try {
      // First delete profile (CASCADE will handle related records)
      const { error: profileError } = await supabase
        .from("profiles")
        .delete()
        .eq("id", userId);

      if (profileError) {
        console.error("Error deleting profile:", profileError);
        return { error: { message: profileError.message } };
      }

      // Note: Actual auth.users deletion requires service_role key
      // For now, we just mark the profile as deleted
      return { error: null };
    } catch (error) {
      return { error: { message: "Failed to delete user" } };
    }
  },

  // Confirm email (REQUIRED)
  async confirmEmail(token: string, type: 'signup' | 'recovery' | 'email_change' = 'signup'): Promise<{ user: AuthUser | null; error: AuthError | null }> {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: type
      });

      if (error) {
        return { user: null, error: { message: error.message, code: error.status?.toString() } };
      }

      const authUser = data.user ? {
        id: data.user.id,
        email: data.user.email || "",
        user_metadata: data.user.user_metadata,
        created_at: data.user.created_at
      } : null;

      return { user: authUser, error: null };
    } catch (error) {
      return { 
        user: null, 
        error: { message: "An unexpected error occurred during email confirmation" } 
      };
    }
  },

  // Listen to auth state changes
  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }
};
