/// <reference path="../edge-runtime.d.ts" />

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface NutritionistRecord {
  id: string;
  full_name: string;
  email: string;
  specialty: string | null;
  phone: string | null;
  crn: string | null;
  avatar_url: string | null;
  created_at: string;
}

interface NutritionistRow {
  user_id: string;
  full_name: string | null;
  specialty: string | null;
  phone: string | null;
  crn: string | null;
  avatar_url: string | null;
  created_at: string;
}

interface RoleRow {
  user_id: string;
  role: string;
}

interface AuthUserRow {
  id: string;
  email: string | null;
}

interface NutritionistsQueryResult {
  data: NutritionistRow[] | null;
  error: Error | null;
}

interface RolesQueryResult {
  data: RoleRow[] | null;
  error: Error | null;
}

interface UsersQueryResult {
  data: { users: AuthUserRow[] } | null;
  error: Error | null;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: callingUser }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !callingUser) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: adminRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", callingUser.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!adminRole) {
      return new Response(JSON.stringify({ error: "Only admins can manage nutritionists" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === "GET") {
      const [
        { data: nutritionistsRows, error: nutritionistsError },
        { data: roles, error: rolesError },
        { data: usersData, error: usersError },
      ] = (await Promise.all([
        supabase
          .from("nutritionists")
          .select("user_id, full_name, specialty, phone, crn, avatar_url, created_at")
          .order("created_at", { ascending: false }),
        supabase
          .from("user_roles")
          .select("user_id, role")
          .eq("role", "nutritionist"),
        supabase.auth.admin.listUsers({ page: 1, perPage: 1000 }),
      ])) as [NutritionistsQueryResult, RolesQueryResult, UsersQueryResult];

      if (nutritionistsError || rolesError || usersError) {
        throw nutritionistsError || rolesError || usersError;
      }

      const nutritionistIds = new Set((roles ?? []).map((row: RoleRow) => row.user_id));
      const usersById = new Map<string, AuthUserRow>(
        (usersData?.users ?? []).map((user: AuthUserRow) => [user.id, user]),
      );

      const nutritionists: NutritionistRecord[] = (nutritionistsRows ?? [])
        .filter((nutritionist: NutritionistRow) => nutritionistIds.has(nutritionist.user_id))
        .map((nutritionist: NutritionistRow) => ({
          id: nutritionist.user_id,
          full_name: nutritionist.full_name || "Nutricionista",
          email: usersById.get(nutritionist.user_id)?.email || "",
          specialty: nutritionist.specialty || null,
          phone: nutritionist.phone || null,
          crn: nutritionist.crn || null,
          avatar_url: nutritionist.avatar_url || null,
          created_at: nutritionist.created_at,
        }));

      return new Response(JSON.stringify({ nutritionists }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === "POST") {
      const { full_name, email, specialty, phone, crn } = await req.json();

      if (!full_name || !email) {
        return new Response(JSON.stringify({ error: "full_name and email are required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email,
        password: "123456",
        email_confirm: true,
        user_metadata: {
          full_name,
          specialty: specialty || null,
          phone: phone || null,
          crn: crn || null,
          signup_role: "nutritionist",
        },
        app_metadata: {
          provider: "email",
        },
      });

      const createdUser = newUser?.user;

      if (createError || !createdUser) {
        return new Response(JSON.stringify({ error: createError?.message || "Unable to create user" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error: nutritionistError } = await supabase.from("nutritionists").insert({
        user_id: createdUser.id,
        full_name,
        specialty: specialty || null,
        phone: phone || null,
        crn: crn || null,
      });

      if (nutritionistError) {
        await supabase.auth.admin.deleteUser(createdUser.id);
        return new Response(JSON.stringify({ error: nutritionistError.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({
        success: true,
        password: "123456",
        nutritionist: {
          id: createdUser.id,
          full_name,
          email,
          specialty: specialty || null,
          phone: phone || null,
          crn: crn || null,
          avatar_url: null,
          created_at: new Date().toISOString(),
        },
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unexpected error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});