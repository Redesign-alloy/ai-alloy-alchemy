import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { User, Key, BarChart3, Loader2, Copy, Eye, EyeOff, Trash2 } from "lucide-react";
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
  const [projectCount, setProjectCount] = useState(0);
  const maxProjects = 50;

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchApiKeys();
      fetchProjectCount();
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
      if (data) {
        setProfile(data);
      }
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
        .order("created_at", { ascending: false });

      if (error) throw error;
      setApiKeys(data || []);
    } catch (error) {
      console.error("Error fetching API keys:", error);
    }
  };

  const fetchProjectCount = async () => {
    try {
      const { count, error } = await supabase
        .from("projects")
        .select("*", { count: "exact", head: true });

      if (error) throw error;
      setProjectCount(count || 0);
    } catch (error) {
      console.error("Error fetching project count:", error);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: profile.full_name,
          company: profile.company,
          role: profile.role,
        })
        .eq("user_id", user?.id);

      if (error) throw error;

      toast({
        title: "Profile Updated",
        description: "Your profile has been saved successfully.",
      });
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({
        title: "Error",
        description: "Failed to save profile.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateApiKey = async () => {
    if (!newKeyName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a name for your API key.",
        variant: "destructive",
      });
      return;
    }

    setGeneratingKey(true);
    try {
      // Generate a random API key
      const key = `aar_${crypto.randomUUID().replace(/-/g, "")}`;
      const keyPreview = `${key.slice(0, 8)}...${key.slice(-4)}`;

      const { error } = await supabase.from("api_keys").insert({
        user_id: user?.id,
        name: newKeyName,
        key_hash: key, // In production, this should be hashed
        key_preview: keyPreview,
      });

      if (error) throw error;

      // Show the full key once
      toast({
        title: "API Key Generated",
        description: `Your key: ${key}. Copy it now - you won't see it again!`,
      });

      setNewKeyName("");
      fetchApiKeys();
    } catch (error) {
      console.error("Error generating API key:", error);
      toast({
        title: "Error",
        description: "Failed to generate API key.",
        variant: "destructive",
      });
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

      toast({
        title: "Key Revoked",
        description: "The API key has been revoked.",
      });

      fetchApiKeys();
    } catch (error) {
      console.error("Error revoking key:", error);
      toast({
        title: "Error",
        description: "Failed to revoke API key.",
        variant: "destructive",
      });
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
          <p className="text-muted-foreground mt-1">
            Manage your profile, API keys, and usage
          </p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="bg-muted">
            <TabsTrigger value="profile" className="gap-2">
              <User className="w-4 h-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="api" className="gap-2">
              <Key className="w-4 h-4" />
              API Keys
            </TabsTrigger>
            <TabsTrigger value="usage" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Usage
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your personal and company details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={profile.full_name || ""}
                    onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    value={profile.company || ""}
                    onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                    placeholder="ACME Corp"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Input
                    id="role"
                    value={profile.role || ""}
                    onChange={(e) => setProfile({ ...profile, role: e.target.value })}
                    placeholder="Metallurgical Engineer"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" value={user?.email || ""} disabled className="bg-muted" />
                </div>
                <Button onClick={handleSaveProfile} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* API Keys Tab */}
          <TabsContent value="api">
            <Card>
              <CardHeader>
                <CardTitle>API Keys</CardTitle>
                <CardDescription>
                  Generate and manage API keys for external integrations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Generate New Key */}
                <div className="flex gap-4">
                  <Input
                    placeholder="Key name (e.g., Production)"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={handleGenerateApiKey} disabled={generatingKey}>
                    {generatingKey ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Generate Key"
                    )}
                  </Button>
                </div>

                {/* Existing Keys */}
                <div className="space-y-3">
                  {apiKeys.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">
                      No API keys generated yet.
                    </p>
                  ) : (
                    apiKeys.map((key) => (
                      <div
                        key={key.id}
                        className={`flex items-center justify-between p-4 rounded-lg border ${
                          key.revoked_at ? "bg-muted/50 opacity-60" : "bg-card"
                        }`}
                      >
                        <div>
                          <p className="font-medium">{key.name}</p>
                          <p className="text-sm text-muted-foreground font-mono">
                            {key.key_preview}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {key.revoked_at ? (
                            <span className="text-sm text-destructive">Revoked</span>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRevokeKey(key.id)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Usage Tab */}
          <TabsContent value="usage">
            <Card>
              <CardHeader>
                <CardTitle>Usage Tracker</CardTitle>
                <CardDescription>
                  Monitor your redesign quota and usage
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Redesigns Used</span>
                    <span className="text-sm text-muted-foreground">
                      {projectCount} / {maxProjects}
                    </span>
                  </div>
                  <Progress value={(projectCount / maxProjects) * 100} className="h-3" />
                  <p className="text-sm text-muted-foreground">
                    {maxProjects - projectCount} redesigns remaining this month
                  </p>
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Current Plan: Free</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Includes {maxProjects} redesigns per month with basic features.
                  </p>
                  <Button variant="outline" size="sm">
                    Upgrade Plan
                  </Button>
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
