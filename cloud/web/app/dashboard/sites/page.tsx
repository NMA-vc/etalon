import { createClient } from "@/lib/supabase/server";
import { SitesClient } from "@/components/dashboard/sites-client";

export default async function SitesPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { data: sites } = await supabase
        .from("sites")
        .select("*, scans(id, score, grade, status, total_findings, created_at)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .order("created_at", { referencedTable: "scans", ascending: false })
        .limit(1, { referencedTable: "scans" });

    return <SitesClient initialSites={sites ?? []} />;
}
