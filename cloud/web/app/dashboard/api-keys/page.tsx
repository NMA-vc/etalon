import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ApiKeysClient } from "@/components/dashboard/api-keys-client";

export default async function ApiKeysPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { data: keys } = await supabase
        .from("api_keys")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

    return <ApiKeysClient initialKeys={keys ?? []} />;
}
