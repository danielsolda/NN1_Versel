import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function generatePassword(length = 10): string {
  const chars = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let password = "";
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  for (const byte of array) {
    password += chars[byte % chars.length];
  }
  return password;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Verify the calling user is a nutritionist
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
      return new Response(JSON.stringify({ error: "Only nutritionists can create patient accounts" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { patient_id, email, name } = await req.json();

    if (!patient_id || !email) {
      return new Response(JSON.stringify({ error: "patient_id and email are required" }), {
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

    if (patient.auth_user_id) {
      return new Response(JSON.stringify({ error: "Patient already has a login account" }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const password = generatePassword(10);

    // Create auth user with auto-confirm
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: name, is_patient: true },
    });

    if (createError) {
      return new Response(JSON.stringify({ error: createError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Assign patient role
    await supabase.from("user_roles").insert({
      user_id: newUser.user.id,
      role: "patient",
    });

    // Link auth user to patient record
    await supabase
      .from("patients")
      .update({ auth_user_id: newUser.user.id })
      .eq("id", patient_id);

    return new Response(
      JSON.stringify({
        success: true,
        password,
        user_id: newUser.user.id,
        email,
      }),
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
