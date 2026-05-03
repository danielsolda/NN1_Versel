declare module "https://deno.land/std@0.168.0/http/server.ts" {
  export function serve(
    handler: (req: Request) => Response | Promise<Response>,
  ): void;
}

declare module "https://esm.sh/@supabase/supabase-js@2" {
  export interface AuthUser {
    id: string;
    email: string | null;
  }

  export interface SupabaseClient {
    auth: {
      getUser(token: string): Promise<{ data: { user: AuthUser | null }; error: Error | null }>;
      admin: {
        listUsers(options?: { page?: number; perPage?: number }): Promise<{
          data: { users: AuthUser[] } | null;
          error: Error | null;
        }>;
        createUser(options: {
          email: string;
          password: string;
          email_confirm?: boolean;
          user_metadata?: Record<string, unknown>;
          app_metadata?: Record<string, unknown>;
        }): Promise<{ data: { user: AuthUser | null } | null; error: Error | null }>;
        deleteUser(id: string): Promise<{ data: unknown; error: Error | null }>;
      };
    };
    from(table: string): any;
  }

  export function createClient(url: string, key: string): SupabaseClient;
}

declare namespace Deno {
  namespace env {
    function get(key: string): string | undefined;
  }
}