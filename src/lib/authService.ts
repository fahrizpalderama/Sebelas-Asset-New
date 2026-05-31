import { createClient } from '@supabase/supabase-js';

let supabase: any = null;
let configPromise: Promise<any> | null = null;
let authListener: ((user: any | null) => void) | null = null;
let cachedUser: any | null = null;

export const loadAuthConfig = async () => {
  if (configPromise) return configPromise;
  
  configPromise = (async () => {
    try {
      const res = await fetch('/api/auth/config');
      if (res.ok) {
        const config = await res.json();
        if (config.supabaseUrl && config.supabaseAnonKey) {
          supabase = createClient(config.supabaseUrl, config.supabaseAnonKey);
          console.log("Supabase Client-side Auth initialized successfully!");
          return { configured: true, supabase };
        }
      }
    } catch (err) {
      console.error("Failed to load client auth config from backend:", err);
    }
    console.warn("Supabase Auth credentials not found on server. Using Local Browser Auth fallback mode.");
    return { configured: false, supabase: null };
  })();
  
  return configPromise;
};

export const authService = {
  // Check if Supabase Auth is active and configured
  isConfigured: () => !!supabase,

  // Initialize and register state listener
  init: async (onUserChanged: (user: any | null) => void) => {
    authListener = onUserChanged;
    const { configured } = await loadAuthConfig();
    
    if (configured && supabase) {
      // Listen to Supabase Auth changes
      supabase.auth.onAuthStateChange(async (event: string, session: any) => {
        console.log("Supabase Auth State Event:", event, session);
        if (session?.user) {
          // Fetch additional profile data from users table
          try {
            const uid = session.user.id;
            const res = await fetch(`/api/db/users/${uid}`);
            if (res.ok) {
              const userData = await res.json();
              if (userData && userData.email) {
                cachedUser = userData;
                onUserChanged(userData);
                return;
              }
            }
            
            // If profile does not exist yet (e.g. OAuth signup), create fallback
            const fallbackProfile = {
              uid: uid,
              id: uid,
              name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
              email: session.user.email || '',
              type: 'Store Manager' // Default role
            };
            
            // Try saving to DB
            try {
              await fetch('/api/db/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(fallbackProfile)
              });
            } catch (e) {}

            cachedUser = fallbackProfile;
            onUserChanged(fallbackProfile);
          } catch (err) {
            console.error("Failed to fetch user profile:", err);
            onUserChanged({
              uid: session.user.id,
              name: session.user.email?.split('@')[0] || 'User',
              email: session.user.email || '',
              type: 'Store Manager'
            });
          }
        } else {
          cachedUser = null;
          onUserChanged(null);
        }
      });
      
      // Get initial session
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const res = await fetch(`/api/db/users/${session.user.id}`);
          if (res.ok) {
            const userData = await res.json();
            if (userData && userData.email) {
              cachedUser = userData;
              onUserChanged(userData);
              return;
            }
          }
          
          const fallback = {
            uid: session.user.id,
            name: session.user.email?.split('@')[0] || 'User',
            email: session.user.email || '',
            type: 'Store Manager'
          };
          cachedUser = fallback;
          onUserChanged(fallback);
        } else {
          cachedUser = null;
          onUserChanged(null);
        }
      } catch (err) {
        console.error("Failed to establish initial Supabase session:", err);
        cachedUser = null;
        onUserChanged(null);
      }
    } else {
      // Offline / Local Storage Mode Initialization
      const localUserStr = localStorage.getItem('local_auth_session');
      if (localUserStr) {
        try {
          const user = JSON.parse(localUserStr);
          cachedUser = user;
          onUserChanged(user);
        } catch (e) {
          cachedUser = null;
          onUserChanged(null);
        }
      } else {
        cachedUser = null;
        onUserChanged(null);
      }
    }
  },

  // Log in
  signIn: async (email: string, password: string) => {
    const { configured } = await loadAuthConfig();
    
    if (configured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (error) throw error;
      
      // Fetch corresponding user profile directly to ensure we return complete data block
      try {
        const res = await fetch(`/api/db/users/${data.user?.id}`);
        if (res.ok) {
          const profile = await res.json();
          if (profile && profile.email) {
            return profile;
          }
        }
      } catch (e) {}

      return {
        uid: data.user?.id,
        name: data.user?.email?.split('@')[0] || 'User',
        email: data.user?.email || email,
        type: 'Store Manager'
      };
    } else {
      // Offline fallback: Query user profile in local list
      const res = await fetch(`/api/db/users`);
      if (res.ok) {
        const users = await res.json();
        const foundUser = users.find((u: any) => u.email?.toLowerCase() === email.toLowerCase());
        
        if (foundUser) {
          const sessionUser = {
            uid: foundUser.id || foundUser.uid || email,
            name: foundUser.name,
            email: foundUser.email,
            type: foundUser.type || 'Store Manager'
          };
          localStorage.setItem('local_auth_session', JSON.stringify(sessionUser));
          cachedUser = sessionUser;
          if (authListener) authListener(sessionUser);
          return sessionUser;
        }
      }
      throw new Error("Akun tidak ditemukan atau salah. Gunakan mode simulasi pendaftaran akun terlebih dahulu.");
    }
  },

  // Register
  signUp: async (email: string, password: string, name: string) => {
    const { configured } = await loadAuthConfig();
    
    const defaultUserData = {
      name,
      email,
      type: 'Store Manager' as const,
      createdAt: new Date().toISOString()
    };

    if (configured && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            type: 'Store Manager'
          }
        }
      });
      if (error) throw error;
      if (!data.user) throw new Error("Pendaftaran gagal.");

      // Create a profile record in users table
      const profile = {
        id: data.user.id,
        uid: data.user.id,
        ...defaultUserData
      };

      try {
        await fetch('/api/db/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(profile)
        });
      } catch (err) {
        console.error("Failed to insert profile record into users database table:", err);
      }

      return {
        uid: data.user.id,
        ...defaultUserData
      };
    } else {
      // Local fallback mode
      const localId = `local-${Math.random().toString(36).substring(2, 11)}`;
      const profile = {
        id: localId,
        uid: localId,
        ...defaultUserData
      };

      // Save user to users list database route
      const writeRes = await fetch('/api/db/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });
      
      const savedProfile = writeRes.ok ? await writeRes.json() : profile;
      
      const sessionUser = {
        uid: savedProfile.id || savedProfile.uid,
        name: savedProfile.name,
        email: savedProfile.email,
        type: savedProfile.type
      };
      
      localStorage.setItem('local_auth_session', JSON.stringify(sessionUser));
      cachedUser = sessionUser;
      if (authListener) authListener(sessionUser);
      return sessionUser;
    }
  },

  // Log out
  signOut: async () => {
    const { configured } = await loadAuthConfig();
    
    if (configured && supabase) {
      await supabase.auth.signOut();
    } else {
      localStorage.removeItem('local_auth_session');
      cachedUser = null;
      if (authListener) authListener(null);
    }
  },

  // Reset password
  resetPassword: async (email: string) => {
    const { configured } = await loadAuthConfig();
    if (configured && supabase) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin
      });
      if (error) throw error;
    } else {
      console.log(`Password reset email simulated in local mode to: ${email}`);
    }
  }
};
