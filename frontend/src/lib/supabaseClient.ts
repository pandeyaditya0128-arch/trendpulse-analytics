import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

const isMock = !supabaseUrl || supabaseUrl.includes("your-supabase-project") || !supabaseUrl.startsWith("http");

let supabaseClient: any;

if (isMock) {
  supabaseClient = {
    auth: {
      signUp: async ({ email, password, options }: any) => {
        const users = JSON.parse(localStorage.getItem("mock_users") || "[]");
        if (users.find((u: any) => u.email === email)) {
          return { data: { user: null }, error: { message: "User already exists" } };
        }
        const newUser = { 
          id: `mock-uuid-${Math.floor(Math.random() * 1000000)}`, 
          email, 
          user_metadata: options?.data || {} 
        };
        users.push({ ...newUser, password });
        localStorage.setItem("mock_users", JSON.stringify(users));
        
        const session = { access_token: `mock-jwt-token-${newUser.id}`, user: newUser };
        localStorage.setItem("mock_session", JSON.stringify(session));
        return { data: { user: newUser, session }, error: null };
      },
      signInWithPassword: async ({ email, password }: any) => {
        const users = JSON.parse(localStorage.getItem("mock_users") || "[]");
        const found = users.find((u: any) => u.email === email && u.password === password);
        if (!found) {
          return { data: { user: null, session: null }, error: { message: "Invalid email or password" } };
        }
        const session = { access_token: `mock-jwt-token-${found.id}`, user: found };
        localStorage.setItem("mock_session", JSON.stringify(session));
        return { data: { user: found, session }, error: null };
      },
      signOut: async () => {
        localStorage.removeItem("mock_session");
        return { error: null };
      },
      getSession: async () => {
        const session = JSON.parse(localStorage.getItem("mock_session") || "null");
        return { data: { session }, error: null };
      },
      onAuthStateChange: (callback: any) => {
        const session = JSON.parse(localStorage.getItem("mock_session") || "null");
        callback(session ? "SIGNED_IN" : "SIGNED_OUT", session);
        return { data: { subscription: { unsubscribe: () => {} } } };
      },
      resetPasswordForEmail: async (email: string) => {
        return { data: {}, error: null };
      }
    }
  };
} else {
  try {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  } catch (err) {
    console.error("Failed to initialize Supabase client, falling back to mock", err);
    supabaseClient = {
      auth: {
        signUp: async ({ email, password, options }: any) => {
          const users = JSON.parse(localStorage.getItem("mock_users") || "[]");
          if (users.find((u: any) => u.email === email)) {
            return { data: { user: null }, error: { message: "User already exists" } };
          }
          const newUser = { id: `mock-uuid-fallback`, email, user_metadata: options?.data || {} };
          users.push({ ...newUser, password });
          localStorage.setItem("mock_users", JSON.stringify(users));
          
          const session = { access_token: `mock-jwt-token-fallback`, user: newUser };
          localStorage.setItem("mock_session", JSON.stringify(session));
          return { data: { user: newUser, session }, error: null };
        },
        signInWithPassword: async ({ email, password }: any) => {
          const users = JSON.parse(localStorage.getItem("mock_users") || "[]");
          const found = users.find((u: any) => u.email === email && u.password === password);
          if (!found) {
            return { data: { user: null, session: null }, error: { message: "Invalid email or password" } };
          }
          const session = { access_token: `mock-jwt-token-fallback`, user: found };
          localStorage.setItem("mock_session", JSON.stringify(session));
          return { data: { user: found, session }, error: null };
        },
        signOut: async () => {
          localStorage.removeItem("mock_session");
          return { error: null };
        },
        getSession: async () => {
          const session = JSON.parse(localStorage.getItem("mock_session") || "null");
          return { data: { session }, error: null };
        },
        onAuthStateChange: (callback: any) => {
          const session = JSON.parse(localStorage.getItem("mock_session") || "null");
          callback(session ? "SIGNED_IN" : "SIGNED_OUT", session);
          return { data: { subscription: { unsubscribe: () => {} } } };
        },
        resetPasswordForEmail: async (email: string) => {
          return { data: {}, error: null };
        }
      }
    };
  }
}

export const supabase = supabaseClient;
export const isSupabaseMock = isMock;
