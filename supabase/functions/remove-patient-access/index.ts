import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
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

    // Check nutritionist role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", callingUser.id)
      .eq("role", "nutritionist")
      .single();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Only nutritionists can remove patient access" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { patient_id } = await req.json();

    if (!patient_id) {
      return new Response(JSON.stringify({ error: "patient_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify the patient belongs to this nutritionist
    const { data: patient, error: patientError } = await supabase
      .from("patients")
      .select("id, auth_user_id, nutritionist_id")
      .eq("id", patient_id)
      .single();

    if (patientError || !patient) {
      return new Response(JSON.stringify({ error: "Patient not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (patient.nutritionist_id !== callingUser.id) {
      return new Response(JSON.stringify({ error: "Not your patient" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!patient.auth_user_id) {
      return new Response(JSON.stringify({ error: "Patient has no auth account" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authUserId = patient.auth_user_id;

    // Remove role
    await supabase.from("user_roles").delete().eq("user_id", authUserId);

    // Unlink auth user from patient record
    await supabase.from("patients").update({ auth_user_id: null }).eq("id", patient_id);

    // Delete the auth user
    const { error: deleteError } = await supabase.auth.admin.deleteUser(authUserId);
    if (deleteError) {
      return new Response(JSON.stringify({ error: deleteError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
