"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/contexts/language-context";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ImageUpload } from "@/components/ui/image-upload";
import { useNotifications } from "@/components/notifications/notification-provider";
import { useUserProfile } from "@/hooks/use-user-profile";
import { authFetch } from "@/lib/auth-client";
import { showRoleUpdateSuccess } from "@/lib/role-validation-client";
import {
  Bell,
  Shield,
  CreditCard,
  Briefcase,
  Users,
  ShoppingCart,
  Camera,
  Save,
  Trash2,
  AlertTriangle,
  Moon,
  Plus,
  X,
} from "lucide-react";

interface SettingsUser {
  id: string;
  name: string;
  email: string;
  role: "worker" | "recruiter" | "buyer" | ("worker" | "recruiter" | "buyer")[];
  avatar: string;
  location: string;
  bio?: string;
  phone?: string;
  business?: {
    name?: string;
    industry?: string;
    type?: string;
    size?: string;
    description?: string;
    website?: string;
    logo?: string;
  };
  preferences: {
    notifications: {
      email: boolean;
      push: boolean;
      sms: boolean;
      jobAlerts: boolean;
      messageAlerts: boolean;
      marketingEmails: boolean;
    };
    privacy: {
      profileVisibility: "public" | "private" | "contacts";
      showLocation: boolean;
      showContactInfo: boolean;
      showRating: boolean;
    };
    account: {
      sessionTimeout: number;
      dataRetention: number;
    };
  };
}

interface SettingsContentProps {
  user: SettingsUser;
}

export function SettingsContent({ user }: SettingsContentProps) {
  const [formData, setFormData] = useState(user);
  const [selectedRoles, setSelectedRoles] = useState<
    ("worker" | "recruiter" | "buyer")[]
  >(Array.isArray(user.role) ? user.role : [user.role]);
  const [isSavingRoles, setIsSavingRoles] = useState(false);
  const notifications = useNotifications();
  const [darkMode, setDarkMode] = useState(false);
  const { profile, saveProfile } = useUserProfile();
  const { lang, setLang, resolvedLang, autoTranslate, setAutoTranslate } =
    useLanguage();

  // Skills management state
  const [workerSkills, setWorkerSkills] = useState<string[]>(
    profile?.skills || []
  );
  const [customSkillInput, setCustomSkillInput] = useState("");

  // Available skills list (same as in post-job-form)
  const availableSkills = [
    "Crop Harvesting",
    "Organic Farming",
    "Equipment Operation",
    "Soil Management",
    "Livestock Care",
    "Greenhouse Management",
    "Pest Control",
    "Irrigation Systems",
    "Team Leadership",
    "Quality Control",
    "Safety Protocols",
    "Mechanical Skills",
    "Plant Science",
    "Animal Husbandry",
    "Food Processing",
    "Packaging",
  ];

  // Load skills from profile when available
  useEffect(() => {
    if (profile?.skills) {
      setWorkerSkills(profile.skills);
    }
  }, [profile?.skills]);

  // Skill management functions
  const addSkill = (skill: string) => {
    if (skill && !workerSkills.includes(skill)) {
      setWorkerSkills([...workerSkills, skill]);
    }
  };

  const removeSkill = (skill: string) => {
    setWorkerSkills(workerSkills.filter((s) => s !== skill));
  };

  const addCustomSkill = () => {
    if (customSkillInput.trim()) {
      addSkill(customSkillInput.trim());
      setCustomSkillInput("");
    }
  };

  const handleSaveSkills = async () => {
    try {
      await saveProfile({ skills: workerSkills });
      notifications.showSuccess(
        "Skills Saved",
        "Your skills have been updated. Job matching will be improved!"
      );
    } catch (e: any) {
      notifications.showError(
        "Save Failed",
        e.message || "Unable to save skills"
      );
    }
  };

  // Language label map (typed)
  const LANG_LABELS = {
    auto: "Auto (device)",
    en: "English",
    zh: "Mandarin Chinese",
    hi: "Hindi",
    es: "Spanish",
    fr: "French",
  } as const;
  type LabelKey = keyof typeof LANG_LABELS;
  const currentLanguageLabel =
    lang === "auto" ? LANG_LABELS[resolvedLang] : LANG_LABELS[lang as LabelKey];

  // Initialize dark mode from both localStorage and document class
  useEffect(() => {
    // Check if dark mode is already applied via HTML class (set by keyboard shortcut or prior setting)
    const isDarkMode = document.documentElement.classList.contains("dark");

    // Get stored theme preference
    const savedTheme = localStorage.getItem("theme");

    // Set state based on current state or localStorage
    setDarkMode(isDarkMode || savedTheme === "dark");

    // Make sure the class and localStorage are in sync
    if (isDarkMode && savedTheme !== "dark") {
      localStorage.setItem("theme", "dark");
    } else if (!isDarkMode && savedTheme === "dark") {
      document.documentElement.classList.add("dark");
    }

    // Add listener for custom theme change events (from keyboard shortcuts)
    const handleThemeChange = () => {
      const newIsDarkMode = document.documentElement.classList.contains("dark");
      setDarkMode(newIsDarkMode);
    };

    document.addEventListener("themeChange", handleThemeChange);
    return () => {
      document.removeEventListener("themeChange", handleThemeChange);
    };
  }, []);

  const handleSave = async (section: string) => {
    if (section === "business") {
      try {
        await saveProfile({
          company_name: formData.business?.name || "",
          industry: formData.business?.industry || "",
          business_type: formData.business?.type || "",
          company_size: formData.business?.size || "",
          business_description: formData.business?.description || "",
          business_address: formData.business?.address || "",
          business_registration: formData.business?.registration || "",
          business_hours: formData.business?.hours || "",
          website: formData.business?.website || "",
          business_logo: formData.business?.logo || "",
          years_in_business:
            (formData as any)?.business?.years ??
            profile?.years_in_business ??
            undefined,
          services_offered:
            (formData as any)?.business?.services ??
            profile?.services_offered ??
            undefined,
        });
        notifications.showSuccess(
          "Business Saved",
          "Your business information has been updated."
        );
      } catch (e: any) {
        notifications.showError(
          "Save Failed",
          e.message || "Unable to save business info"
        );
      }
      return;
    }
    notifications.showSuccess(
      "Settings Saved",
      `Your ${section} settings have been updated successfully.`
    );
  };

  const toggleRole = (role: "worker" | "recruiter" | "buyer") => {
    setSelectedRoles((prev) => {
      if (prev.includes(role)) {
        // Don't allow removing the last role
        if (prev.length === 1) {
          notifications.showError(
            "Cannot Remove Role",
            "You must have at least one role selected."
          );
          return prev;
        }
        return prev.filter((r) => r !== role);
      } else {
        return [...prev, role];
      }
    });
  };

  const handleSaveRoles = async () => {
    if (selectedRoles.length === 0) {
      notifications.showError(
        "No Roles Selected",
        "Please select at least one role."
      );
      return;
    }

    setIsSavingRoles(true);
    try {
      const response = await authFetch(`/api/users/${user.id}/roles`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roles: selectedRoles }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update roles");
      }

      showRoleUpdateSuccess(selectedRoles);
      // Update local state
      setFormData({ ...formData, role: selectedRoles as any });

      // Show message about re-login requirement
      notifications.showInfo(
        "Re-login Required",
        "Your roles have been updated. Please log out and log back in to refresh your permissions."
      );

      // Refresh the page to update the UI with new roles
      setTimeout(() => window.location.reload(), 1500);
    } catch (error: any) {
      notifications.showError(
        "Failed to Update Roles",
        error.message || "An error occurred while updating your roles."
      );
    } finally {
      setIsSavingRoles(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "worker":
        return <Briefcase className="h-4 w-4" />;
      case "recruiter":
        return <Users className="h-4 w-4" />;
      case "buyer":
        return <ShoppingCart className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getRoleDescription = (role: string) => {
    switch (role) {
      case "worker":
        return "Find and apply for agricultural jobs, showcase your skills and experience";
      case "recruiter":
        return "Post job opportunities, manage applications, and hire qualified workers";
      case "buyer":
        return "Browse and purchase fresh products directly from local farmers and suppliers";
      default:
        return "Select your primary role on the platform";
    }
  };

  return (
    <Tabs defaultValue="profile" className="space-y-6">
      <TabsList className="grid w-full grid-cols-6">
        <TabsTrigger value="profile" className="flex items-center gap-2">
          <Bell className="h-4 w-4" />
          Profile
        </TabsTrigger>
        <TabsTrigger value="notifications" className="flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Notifications
        </TabsTrigger>
        <TabsTrigger value="privacy" className="flex items-center gap-2">
          <CreditCard className="h-4 w-4" />
          Privacy
        </TabsTrigger>
        <TabsTrigger value="business" className="flex items-center gap-2">
          <Briefcase className="h-4 w-4" />
          Business
        </TabsTrigger>
        <TabsTrigger value="billing" className="flex items-center gap-2">
          <CreditCard className="h-4 w-4" />
          Billing
        </TabsTrigger>
        <TabsTrigger value="account" className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          Account
        </TabsTrigger>
      </TabsList>

      {/* Profile Settings */}
      <TabsContent value="profile" className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="font-heading">
                  Basic Information
                </CardTitle>
                <CardDescription>
                  Update your personal details and contact information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) =>
                        setFormData({ ...formData, location: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    placeholder="Tell others about yourself, your experience, and what you're looking for..."
                    value={formData.bio || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, bio: e.target.value })
                    }
                    rows={4}
                  />
                </div>

                <Button onClick={() => handleSave("profile")} className="w-fit">
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
              </CardContent>
            </Card>

            {/* Role Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="font-heading">Platform Roles</CardTitle>
                <CardDescription>
                  Select all roles that apply to you - you can have multiple
                  roles at once
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  {(["worker", "recruiter", "buyer"] as const).map((role) => {
                    const isSelected = selectedRoles.includes(role);
                    return (
                      <div
                        key={role}
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          isSelected
                            ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                            : "border-border hover:border-primary/50"
                        }`}
                        onClick={() => toggleRole(role)}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          {getRoleIcon(role)}
                          <h4 className="font-medium capitalize">
                            {role === "worker"
                              ? "Member"
                              : role === "recruiter"
                              ? "Employer"
                              : role === "buyer"
                              ? "Trader"
                              : role}
                          </h4>
                          {isSelected && (
                            <Badge variant="secondary">Selected</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {getRoleDescription(role)}
                        </p>
                      </div>
                    );
                  })}
                </div>

                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <strong>Note:</strong> You can select multiple roles if you
                    use the platform for different purposes. For example, you
                    can be a worker looking for jobs while also being a buyer
                    purchasing products.
                  </p>
                </div>

                <Button
                  onClick={handleSaveRoles}
                  disabled={isSavingRoles || selectedRoles.length === 0}
                  className="w-fit"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {isSavingRoles ? "Saving..." : "Save Role Changes"}
                </Button>
              </CardContent>
            </Card>

            {/* Skills Management - Only for Workers */}
            {(() => {
              const isWorker = 
                selectedRoles.includes("worker") || 
                (Array.isArray(user.role) && user.role.includes("worker")) ||
                user.role === "worker";
              return isWorker;
            })() && (
              <Card>
                <CardHeader>
                  <CardTitle className="font-heading">My Skills</CardTitle>
                  <CardDescription>
                    Add your skills to get better job matches. Jobs matching your
                    skills will be prioritized.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Selected Skills */}
                  {workerSkills.length > 0 && (
                    <div className="space-y-2">
                      <Label>Your Skills ({workerSkills.length})</Label>
                      <div className="flex flex-wrap gap-2">
                        {workerSkills.map((skill) => (
                          <Badge
                            key={skill}
                            variant="secondary"
                            className="flex items-center gap-1 px-3 py-1"
                          >
                            {skill}
                            <button
                              type="button"
                              onClick={() => removeSkill(skill)}
                              className="ml-1 hover:text-destructive"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <Separator />

                  {/* Available Skills */}
                  <div className="space-y-2">
                    <Label>Add Skills</Label>
                    <div className="grid gap-2 md:grid-cols-3">
                      {availableSkills
                        .filter((skill) => !workerSkills.includes(skill))
                        .map((skill) => (
                          <div
                            key={skill}
                            className="flex items-center space-x-2 p-2 border rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
                            onClick={() => addSkill(skill)}
                          >
                            <Plus className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{skill}</span>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Custom Skill Input */}
                  <Separator />
                  <div className="space-y-2">
                    <Label>Add Custom Skill</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter a custom skill"
                        value={customSkillInput}
                        onChange={(e) => setCustomSkillInput(e.target.value)}
                        onKeyPress={(e) =>
                          e.key === "Enter" &&
                          (e.preventDefault(), addCustomSkill())
                        }
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={addCustomSkill}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <Button
                    onClick={handleSaveSkills}
                    className="w-fit"
                    disabled={workerSkills.length === 0}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Save Skills
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Profile Picture */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="font-heading">Profile Picture</CardTitle>
                <CardDescription>Upload a professional photo</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col items-center gap-4">
                  <Avatar className="h-32 w-32">
                    <AvatarImage
                      src={formData.avatar || "/placeholder.svg"}
                      alt={formData.name}
                    />
                    <AvatarFallback className="text-2xl">
                      {formData.name
                        ? formData.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                        : "U"}
                    </AvatarFallback>
                  </Avatar>

                  <ImageUpload
                    type="avatar"
                    maxFiles={1}
                    maxSizeMB={5}
                    acceptedTypes={[
                      "image/jpeg",
                      "image/jpg",
                      "image/png",
                      "image/webp",
                    ]}
                    onUploadComplete={(images) => {
                      if (images.length > 0) {
                        setFormData({ ...formData, avatar: images[0].url });
                        notifications.showSuccess(
                          "Profile Picture Updated",
                          "Your profile picture has been updated successfully."
                        );
                        // Persist avatar to user
                        authFetch(`/api/users/${user.id}`, {
                          method: "PUT",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ avatar_url: images[0].url }),
                        }).catch(() => {});
                      }
                    }}
                    onUploadError={(error) => {
                      notifications.showError("Upload Failed", error);
                    }}
                    className="w-full max-w-md"
                  />

                  <p className="text-xs text-muted-foreground text-center">
                    Recommended: Square image, at least 400x400px. Max 5MB.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </TabsContent>

      {/* Notification Settings */}
      <TabsContent value="notifications" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-heading">
              Notification Preferences
            </CardTitle>
            <CardDescription>
              Choose how you want to be notified about important updates
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h4 className="font-medium">Communication Channels</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="email-notifications">
                      Email Notifications
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications via email
                    </p>
                  </div>
                  <Switch
                    id="email-notifications"
                    checked={formData.preferences.notifications.email}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        preferences: {
                          ...formData.preferences,
                          notifications: {
                            ...formData.preferences.notifications,
                            email: checked,
                          },
                        },
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="push-notifications">
                      Push Notifications
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Receive browser push notifications
                    </p>
                  </div>
                  <Switch
                    id="push-notifications"
                    checked={formData.preferences.notifications.push}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        preferences: {
                          ...formData.preferences,
                          notifications: {
                            ...formData.preferences.notifications,
                            push: checked,
                          },
                        },
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="sms-notifications">SMS Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive text message alerts
                    </p>
                  </div>
                  <Switch
                    id="sms-notifications"
                    checked={formData.preferences.notifications.sms}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        preferences: {
                          ...formData.preferences,
                          notifications: {
                            ...formData.preferences.notifications,
                            sms: checked,
                          },
                        },
                      })
                    }
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Content Preferences</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="job-alerts">Job Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      New job opportunities matching your profile
                    </p>
                  </div>
                  <Switch
                    id="job-alerts"
                    checked={formData.preferences.notifications.jobAlerts}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        preferences: {
                          ...formData.preferences,
                          notifications: {
                            ...formData.preferences.notifications,
                            jobAlerts: checked,
                          },
                        },
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="message-alerts">Message Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      New messages and communications
                    </p>
                  </div>
                  <Switch
                    id="message-alerts"
                    checked={formData.preferences.notifications.messageAlerts}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        preferences: {
                          ...formData.preferences,
                          notifications: {
                            ...formData.preferences.notifications,
                            messageAlerts: checked,
                          },
                        },
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="marketing-emails">Marketing Emails</Label>
                    <p className="text-sm text-muted-foreground">
                      Product updates and promotional content
                    </p>
                  </div>
                  <Switch
                    id="marketing-emails"
                    checked={formData.preferences.notifications.marketingEmails}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        preferences: {
                          ...formData.preferences,
                          notifications: {
                            ...formData.preferences.notifications,
                            marketingEmails: checked,
                          },
                        },
                      })
                    }
                  />
                </div>
              </div>
            </div>

            <Button
              onClick={() => handleSave("notification")}
              className="w-fit"
            >
              <Save className="mr-2 h-4 w-4" />
              Save Preferences
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Privacy Settings */}
      <TabsContent value="privacy" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-heading">Privacy Settings</CardTitle>
            <CardDescription>
              Control who can see your information and how it's used
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="profile-visibility">Profile Visibility</Label>
                <Select
                  value={formData.preferences.privacy.profileVisibility}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      preferences: {
                        ...formData.preferences,
                        privacy: {
                          ...formData.preferences.privacy,
                          profileVisibility: value as
                            | "public"
                            | "private"
                            | "contacts",
                        },
                      },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">
                      Public - Anyone can view your profile
                    </SelectItem>
                    <SelectItem value="contacts">
                      Contacts Only - Only people you've worked with
                    </SelectItem>
                    <SelectItem value="private">
                      Private - Only you can view your profile
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="show-location">Show Location</Label>
                    <p className="text-sm text-muted-foreground">
                      Display your location on your profile
                    </p>
                  </div>
                  <Switch
                    id="show-location"
                    checked={formData.preferences.privacy.showLocation}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        preferences: {
                          ...formData.preferences,
                          privacy: {
                            ...formData.preferences.privacy,
                            showLocation: checked,
                          },
                        },
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="show-contact">
                      Show Contact Information
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Allow others to see your contact details
                    </p>
                  </div>
                  <Switch
                    id="show-contact"
                    checked={formData.preferences.privacy.showContactInfo}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        preferences: {
                          ...formData.preferences,
                          privacy: {
                            ...formData.preferences.privacy,
                            showContactInfo: checked,
                          },
                        },
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="show-rating">Show Rating</Label>
                    <p className="text-sm text-muted-foreground">
                      Display your rating and reviews publicly
                    </p>
                  </div>
                  <Switch
                    id="show-rating"
                    checked={formData.preferences.privacy.showRating}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        preferences: {
                          ...formData.preferences,
                          privacy: {
                            ...formData.preferences.privacy,
                            showRating: checked,
                          },
                        },
                      })
                    }
                  />
                </div>
              </div>
            </div>

            <Button onClick={() => handleSave("privacy")} className="w-fit">
              <Save className="mr-2 h-4 w-4" />
              Save Privacy Settings
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Billing Settings */}
      <TabsContent value="billing" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-heading">
              Billing & Subscription
            </CardTitle>
            <CardDescription>
              Manage your payment methods and subscription
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">Current Plan: Free</h4>
              <p className="text-sm text-muted-foreground mb-4">
                You're currently on the free plan with basic features. Upgrade
                to unlock premium features.
              </p>
              <Button>Upgrade to Premium</Button>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Payment Methods</h4>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">
                  No payment methods added yet.
                </p>
                <Button variant="outline" className="mt-2 bg-transparent">
                  Add Payment Method
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Billing History</h4>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">
                  No billing history available.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Business Settings */}
      <TabsContent value="business" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-heading">Business Information</CardTitle>
            <CardDescription>
              Manage your business profile and company details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="company-name">Company Name</Label>
                <Input
                  id="company-name"
                  placeholder="Enter your company name"
                  value={formData.business?.name || profile?.company_name || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      business: { ...formData.business, name: e.target.value },
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="industry">Industry</Label>
                <Select
                  value={formData.business?.industry || profile?.industry || ""}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      business: { ...formData.business, industry: value },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="crop-production">
                      Crop Production
                    </SelectItem>
                    <SelectItem value="livestock">Livestock</SelectItem>
                    <SelectItem value="organic-farming">
                      Organic Farming
                    </SelectItem>
                    <SelectItem value="equipment-rental">
                      Equipment Rental
                    </SelectItem>
                    <SelectItem value="food-processing">
                      Food Processing
                    </SelectItem>
                    <SelectItem value="distribution">Distribution</SelectItem>
                    <SelectItem value="consulting">
                      Agricultural Consulting
                    </SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="business-type">Business Type</Label>
                <Select
                  value={
                    formData.business?.type || profile?.business_type || ""
                  }
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      business: { ...formData.business, type: value },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select business type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="farm">Farm</SelectItem>
                    <SelectItem value="cooperative">Cooperative</SelectItem>
                    <SelectItem value="corporation">Corporation</SelectItem>
                    <SelectItem value="partnership">Partnership</SelectItem>
                    <SelectItem value="sole-proprietorship">
                      Sole Proprietorship
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="company-size">Company Size</Label>
                <Select
                  value={formData.business?.size || profile?.company_size || ""}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      business: { ...formData.business, size: value },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select company size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-10">1-10 employees</SelectItem>
                    <SelectItem value="11-50">11-50 employees</SelectItem>
                    <SelectItem value="51-200">51-200 employees</SelectItem>
                    <SelectItem value="201-500">201-500 employees</SelectItem>
                    <SelectItem value="500+">500+ employees</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="years-in-business">Years in Business</Label>
                <Input
                  id="years-in-business"
                  type="number"
                  min={0}
                  placeholder="e.g., 5"
                  value={
                    (formData as any)?.business?.years ??
                    profile?.years_in_business ??
                    ""
                  }
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      business: {
                        ...formData.business,
                        years:
                          e.target.value === ""
                            ? undefined
                            : Number(e.target.value),
                      },
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="services-offered">Services Offered</Label>
                <Input
                  id="services-offered"
                  placeholder="Comma-separated services"
                  value={
                    Array.isArray((formData as any)?.business?.services)
                      ? (formData as any).business.services.join(", ")
                      : profile?.services_offered?.join(", ") || ""
                  }
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      business: {
                        ...formData.business,
                        services: e.target.value
                          .split(",")
                          .map((s) => s.trim())
                          .filter((s) => s.length > 0),
                      },
                    })
                  }
                />
              </div>
            </div>

            <div>
              <Label htmlFor="business-description">Business Description</Label>
              <Textarea
                id="business-description"
                placeholder="Describe your business, services, and what makes you unique..."
                value={
                  formData.business?.description ||
                  profile?.business_description ||
                  ""
                }
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    business: {
                      ...formData.business,
                      description: e.target.value,
                    },
                  })
                }
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                placeholder="https://www.yourcompany.com"
                value={formData.business?.website || profile?.website || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    business: { ...formData.business, website: e.target.value },
                  })
                }
              />
            </div>

            <div>
              <Label htmlFor="business-address">Business Address</Label>
              <Textarea
                id="business-address"
                placeholder="Enter your complete business address"
                value={formData.business?.address || profile?.business_address || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    business: { ...formData.business, address: e.target.value },
                  })
                }
                rows={2}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="business-registration">Business Registration Number</Label>
                <Input
                  id="business-registration"
                  placeholder="Enter registration number (optional)"
                  value={formData.business?.registration || profile?.business_registration || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      business: { ...formData.business, registration: e.target.value },
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="business-hours">Business Hours</Label>
                <Input
                  id="business-hours"
                  placeholder="e.g., Mon-Fri 8AM-5PM"
                  value={formData.business?.hours || profile?.business_hours || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      business: { ...formData.business, hours: e.target.value },
                    })
                  }
                />
              </div>
            </div>

            <Button onClick={() => handleSave("business")} className="w-fit">
              <Save className="mr-2 h-4 w-4" />
              Save Business Information
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading">Business Logo</CardTitle>
            <CardDescription>
              Upload your company logo for professional branding
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ImageUpload
              type="business"
              maxFiles={1}
              maxSizeMB={5}
              acceptedTypes={[
                "image/jpeg",
                "image/jpg",
                "image/png",
                "image/webp",
              ]}
              onUploadComplete={(images) => {
                if (images.length > 0) {
                  setFormData({
                    ...formData,
                    business: { ...formData.business, logo: images[0].url },
                  });
                  notifications.showSuccess(
                    "Business Logo Updated",
                    "Your business logo has been updated successfully."
                  );
                  // Persist logo immediately
                  saveProfile({ business_logo: images[0].url }).catch(() => {});
                }
              }}
              onUploadError={(error) => {
                notifications.showError("Upload Failed", error);
              }}
              className="w-full max-w-md"
            />
          </CardContent>
        </Card>
      </TabsContent>

      {/* Account Settings */}
      <TabsContent value="account" className="space-y-6">
        {/* Appearance/Dark Mode card */}
        <Card>
          <CardHeader>
            <CardTitle className="font-heading flex items-center gap-2">
              <Moon className="h-5 w-5" />
              Appearance
            </CardTitle>
            <CardDescription>
              Customize how AgriReach looks on your device
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="dark-mode">Dark Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Switch to a darker color scheme
                </p>
              </div>
              <Switch
                id="dark-mode"
                checked={darkMode}
                onCheckedChange={(checked) => {
                  setDarkMode(checked);

                  // Apply the theme change directly
                  if (checked) {
                    document.documentElement.classList.add("dark");
                    localStorage.setItem("theme", "dark");
                  } else {
                    document.documentElement.classList.remove("dark");
                    localStorage.setItem("theme", "light");
                  }

                  // Dispatch the custom event for any other listeners
                  const themeChangeEvent = new CustomEvent("themeChange", {
                    detail: { theme: checked ? "dark" : "light" },
                    bubbles: true,
                  });
                  document.dispatchEvent(themeChangeEvent);

                  notifications.showSuccess(
                    "Appearance Updated",
                    `Dark mode ${checked ? "enabled" : "disabled"}`
                  );
                }}
              />
            </div>

            {/* Language selector */}
            <Separator className="my-3" />
            <div className="space-y-3">
              <h4 className="font-medium">Language</h4>
              <div className="space-y-2">
                <Label htmlFor="language-select">Choose language</Label>
                <select
                  id="language-select"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
                  value={lang}
                  onChange={(e) => setLang(e.target.value as any)}
                  aria-label="Language"
                >
                  <option value="auto">Auto (device)</option>
                  <option value="en">English</option>
                  <option value="zh">Mandarin Chinese</option>
                  <option value="hi">Hindi</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                </select>
              </div>
              <p className="text-xs text-muted-foreground">
                Current: <strong>{currentLanguageLabel}</strong>
              </p>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-sm">Translate content automatically</span>
                <Switch
                  checked={autoTranslate}
                  onCheckedChange={setAutoTranslate}
                  aria-label="Toggle auto translate"
                />
              </div>
            </div>
            {/* end language selector */}

            {/* ...existing code (remaining CardContent) ... */}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading">Account Security</CardTitle>
            <CardDescription>
              Manage your account security and data preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                {/* Two-Factor Authentication removed */}
              </div>

              <div className="space-y-2">
                <Label htmlFor="session-timeout">
                  Session Timeout (minutes)
                </Label>
                <Select
                  value={formData.preferences.account.sessionTimeout.toString()}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      preferences: {
                        ...formData.preferences,
                        account: {
                          ...formData.preferences.account,
                          sessionTimeout: Number.parseInt(value),
                        },
                      },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                    <SelectItem value="480">8 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button onClick={() => handleSave("account")} className="w-fit">
              <Save className="mr-2 h-4 w-4" />
              Save Security Settings
            </Button>
          </CardContent>
        </Card>

        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="font-heading text-destructive">
              Danger Zone
            </CardTitle>
            <CardDescription>
              Irreversible actions that affect your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg">
              <div>
                <h4 className="font-medium">Delete Account</h4>
                <p className="text-sm text-muted-foreground">
                  Permanently delete your account and all associated data
                </p>
              </div>
              <Button variant="destructive">Delete Account</Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
