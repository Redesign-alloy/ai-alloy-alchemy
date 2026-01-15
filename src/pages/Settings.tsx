import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { User, BarChart3, Loader2, Lock, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSearchCount } from "@/hooks/useProjects";

interface Profile {
  full_name: string | null;
  company: string | null;
  role: string | null;
}

const Settings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { count: searchCount, isLoading: searchCountLoading } = useSearchCount();
  
  const [profile, setProfile] = useState<Profile>({ full_name: "", company: "", role: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  
  const maxSearches = 50;

  useEffect(() => {
    if (user) {
      fetchProfile();
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

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user?.id)
        .single();

      if (existingProfile) {
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

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({ title: "Error", description: "New passwords do not match.", variant: "destructive" });
      return;
    }
    
    if (newPassword.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters.", variant: "destructive" });
      return;
    }

    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;
      
      toast({ title: "Password Updated", description: "Your password has been changed successfully." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      console.error("Error changing password:", error);
      toast({ 
        title: "Error", 
        description: error.message || "Failed to change password.", 
        variant: "destructive" 
      });
    } finally {
      setChangingPassword(false);
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
          <p className="text-muted-foreground mt-1">Manage profile and usage</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="bg-muted">
            <TabsTrigger value="profile" className="gap-2"><User className="w-4 h-4" />Profile</TabsTrigger>
            <TabsTrigger value="usage" className="gap-2"><BarChart3 className="w-4 h-4" />Usage</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <div className="space-y-6">
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
                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Save Changes
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="w-5 h-5" />
                    Change Password
                  </CardTitle>
                  <CardDescription>Update your account password</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <div className="relative">
                      <Input 
                        id="currentPassword" 
                        type={showCurrentPassword ? "text" : "password"}
                        value={currentPassword} 
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      >
                        {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <div className="relative">
                      <Input 
                        id="newPassword" 
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword} 
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input 
                      id="confirmPassword" 
                      type="password"
                      value={confirmPassword} 
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                    />
                  </div>
                  <Button 
                    onClick={handleChangePassword} 
                    disabled={changingPassword || !newPassword || !confirmPassword}
                    variant="outline"
                  >
                    {changingPassword ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Change Password
                  </Button>
                </CardContent>
              </Card>
            </div>
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
                      {searchCountLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin inline" />
                      ) : (
                        `${searchCount} / ${maxSearches}`
                      )}
                    </span>
                  </div>
                  <Progress value={(searchCount / maxSearches) * 100} className="h-3" />
                  <p className="text-sm text-muted-foreground">
                    {Math.max(0, maxSearches - searchCount)} redesigns remaining this month
                  </p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Current Plan: Free</h4>
                  <p className="text-sm text-muted-foreground mb-4">Includes {maxSearches} redesigns per month.</p>
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
