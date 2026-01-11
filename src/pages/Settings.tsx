import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { User, Key, BarChart3, Loader2, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Profile {
  full_name: string | null;
  company: string | null;
  role: string | null;
}

interface ApiKey {
  id: string;
  name: string;
  key_preview: string;
  created_at: string;
  revoked_at: string | null;
}

const Settings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile>({ full_name: "", company: "", role: "" });
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [generatingKey, setGeneratingKey] = useState(false);
  
  // Usage state - count projects created by user
  const [usageCount, setUsageCount] = useState(0);
  const maxProjects = 50;

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchApiKeys();
      fetchUsageCount();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, company, role")
        .eq("user_id", user?.id)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      if (data) setProfile(data);
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchApiKeys = async () => {
    try {
      const { data, error } = await supabase
        .from("api_keys")
        .select("id, name, key_preview, created_at, revoked_at")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setApiKeys(data || []);
    } catch (error) {
      console.error("Error fetching API keys:", error);
    }
  };

  // Count projects created by user as usage metric
  const fetchUsageCount = async () => {
    try {
      const { count, error } = await supabase
        .from("projects")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user?.id);

      if (error) throw error;
      setUsageCount(count || 0);
    } catch (error) {
      console.error("Error fetching usage count:", error);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      // Check if profile exists first
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user?.id)
        .single();

      if (existingProfile) {
        // Update existing profile
        const { error } = await supabase
          .from("profiles")
          .update({
            full_name: profile.full_name,
            company: profile.company,
            role: profile.role,
          })
          .eq("user_id", user?.id);

        if (error) throw error;
      } else {
        // Insert new profile
        const { error } = await supabase
          .from("profiles")
          .insert({
            user_id: user?.id,
            full_name: profile.full_name,
            company: profile.company,
            role: profile.role,
          });

        if (error) throw error;
      }
      
      toast({ title: "Profile Updated", description: "Saved successfully." });
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({ title: "Error", description: "Failed to save.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateApiKey = async () => {
    if (!newKeyName.trim()) return;
    setGeneratingKey(true);
    try {
      const key = `aar_${crypto.randomUUID().replace(/-/g, "")}`;
      const keyPreview = `${key.slice(0, 8)}...${key.slice(-4)}`;
      const { error } = await supabase.from("api_keys").insert({
        user_id: user?.id,
        name: newKeyName,
        key_hash: key,
        key_preview: keyPreview,
      });
      if (error) throw error;
      toast({ title: "API Key Generated", description: `Key: ${key}` });
      setNewKeyName("");
      fetchApiKeys();
    } catch (error) {
      console.error("Error generating API key:", error);
    } finally {
      setGeneratingKey(false);
    }
  };

  const handleRevokeKey = async (keyId: string) => {
    try {
      const { error } = await supabase
        .from("api_keys")
        .update({ revoked_at: new Date().toISOString() })
        .eq("id", keyId);
      if (error) throw error;
      fetchApiKeys();
    } catch (error) {
      console.error("Error revoking key:", error);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage profile, API keys, and usage</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="bg-muted">
            <TabsTrigger value="profile" className="gap-2"><User className="w-4 h-4" />Profile</TabsTrigger>
            <TabsTrigger value="api" className="gap-2"><Key className="w-4 h-4" />API Keys</TabsTrigger>
            <TabsTrigger value="usage" className="gap-2"><BarChart3 className="w-4 h-4" />Usage</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your personal and company details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input id="fullName" value={profile.full_name || ""} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input id="company" value={profile.company || ""} onChange={(e) => setProfile({ ...profile, company: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Input id="role" value={profile.role || ""} onChange={(e) => setProfile({ ...profile, role: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" value={user?.email || ""} disabled className="bg-muted" />
                </div>
                <Button onClick={handleSaveProfile} disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Save Changes"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="api">
            <Card>
              <CardHeader>
                <CardTitle>API Keys</CardTitle>
                <CardDescription>Manage keys for external integrations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex gap-4">
                  <Input placeholder="Key name" value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)} />
                  <Button onClick={handleGenerateApiKey} disabled={generatingKey}>
                    {generatingKey ? <Loader2 className="w-4 h-4 animate-spin" /> : "Generate"}
                  </Button>
                </div>
                <div className="space-y-3">
                  {apiKeys.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Key className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No API keys yet. Generate one above.</p>
                    </div>
                  ) : (
                    apiKeys.map((key) => (
                      <div key={key.id} className={`flex items-center justify-between p-4 rounded-lg border ${key.revoked_at ? "bg-muted/50" : "bg-card"}`}>
                        <div>
                          <p className="font-medium">{key.name}</p>
                          <p className="text-sm font-mono">{key.key_preview}</p>
                        </div>
                        {!key.revoked_at && (
                          <Button variant="ghost" size="sm" onClick={() => handleRevokeKey(key.id)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="usage">
            <Card>
              <CardHeader>
                <CardTitle>Usage Tracker</CardTitle>
                <CardDescription>Monitor your redesign quota</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Redesigns Used</span>
                    <span className="text-sm text-muted-foreground">
                      {usageCount} / {maxProjects}
                    </span>
                  </div>
                  <Progress value={(usageCount / maxProjects) * 100} className="h-3" />
                  <p className="text-sm text-muted-foreground">
                    {Math.max(0, maxProjects - usageCount)} redesigns remaining this month
                  </p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Current Plan: Free</h4>
                  <p className="text-sm text-muted-foreground mb-4">Includes {maxProjects} redesigns per month.</p>
                  <Button variant="outline" size="sm">Upgrade Plan</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Settings;
