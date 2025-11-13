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
import { LocationPicker, LocationData } from "@/components/ui/location-picker";
import { useNotifications } from "@/components/notifications/notification-provider";
import { useUserProfile } from "@/hooks/use-user-profile";
import { authFetch } from "@/lib/auth-client";
import { showRoleUpdateSuccess } from "@/lib/role-validation-client";
import { SkillCard } from "@/components/ui/skill-card";
import { SkillSelector } from "@/components/ui/skill-selector";
import { Skill, SkillLevel, getSkillCategory } from "@/lib/skills";
import { useTranslation } from "@/contexts/TranslationProvider";
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
  CheckCircle,
  X,
  Clock3,
} from "lucide-react";

interface SettingsUser {
  id: string;
  name: string;
  email: string;
  role: "worker" | "recruiter" | "buyer" | ("worker" | "recruiter" | "buyer")[];
  avatar: string;
  location: string;
  joinDate?: string;
  bio?: string;
  verified?: boolean;
  rating?: number;
  completedJobs?: number;
  phone?: string;
  business?: {
    name?: string;
    industry?: string;
    type?: string;
    size?: string;
    description?: string;
    website?: string;
    logo?: string;
    address?: string;
    registration?: string;
    hours?: string;
    years?: number;
    services?: string[];
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
  verificationStatus?: "none" | "pending" | "verified" | "rejected";
  verificationRequestedAt?: string;
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
  const { translateNow, isTranslating } = useTranslation();
  const [userLocation, setUserLocation] = useState<LocationData>({
    address: user.location || "",
  });
  const [businessLocation, setBusinessLocation] = useState<LocationData>({
    address: profile?.business_address || "",
    coordinates: profile?.business_coordinates,
  });

  // Skills management state - support both old and new formats
  const [workerSkills, setWorkerSkills] = useState<Skill[]>([]);
  const [verificationStatus, setVerificationStatus] = useState<"none" | "pending" | "verified" | "rejected">(
    user.verificationStatus || (user.verified ? "verified" : "none")
  );
  const [verificationRequestedAt, setVerificationRequestedAt] = useState<string | undefined>(user.verificationRequestedAt);
  const [verificationMessage, setVerificationMessage] = useState("");
  const [isRequestingVerification, setIsRequestingVerification] = useState(false);

  useEffect(() => {
    let mounted = true;
    const loadVerificationStatus = async () => {
      try {
        const res = await authFetch("/api/users/verification");
        if (!res.ok) return;
        const json = await res.json().catch(() => ({}));
        if (!mounted) return;
        const data = json?.data || {};
        if (data.status) {
          setVerificationStatus(data.status);
        }
        if (data.requestedAt) {
          setVerificationRequestedAt(data.requestedAt);
        }
      } catch {
        // ignore
      }
    };
    loadVerificationStatus();
    return () => {
      mounted = false;
    };
  }, []);

  // Load skills from profile when available - normalize to new format
  useEffect(() => {
    if (profile?.skills) {
      // Normalize skills to new format
      const normalized: Skill[] = Array.isArray(profile.skills) && profile.skills.length > 0
        ? (typeof profile.skills[0] === 'string'
          ? (profile.skills as string[]).map((s) => ({
              name: s,
              level: 2 as SkillLevel,
              category: getSkillCategory(s) || "Farm Management"
            }))
          : (profile.skills as Skill[]))
        : [];
      setWorkerSkills(normalized);
    }
  }, [profile?.skills]);

  // Load user location coordinates
  useEffect(() => {
    if (user.location) {
      setUserLocation({
        address: user.location,
        coordinates: (user as any).location_coordinates,
      });
    }
  }, [user.location]);

  // Load business location coordinates
  useEffect(() => {
    if (profile?.business_address) {
      setBusinessLocation({
        address: profile.business_address,
        coordinates: profile.business_coordinates,
      });
    }
  }, [profile?.business_address, profile?.business_coordinates]);

  // Skill management functions
  const addSkill = (skill: Skill) => {
    if (skill && !workerSkills.some((s) => s.name.toLowerCase() === skill.name.toLowerCase())) {
      setWorkerSkills([...workerSkills, skill]);
    }
  };

  const removeSkill = (skillName: string) => {
    setWorkerSkills(workerSkills.filter((s) => s.name !== skillName));
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

  const handleVerificationRequest = async () => {
    if (verificationStatus === "pending") {
      notifications.showInfo("Request Pending", "Your verification request is already pending review.");
      return;
    }
    if (formData.verified) {
      notifications.showInfo("Already Verified", "Your account is already verified.");
      return;
    }

    try {
      setIsRequestingVerification(true);
      const res = await authFetch("/api/users/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: verificationMessage,
        }),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(result?.message || "Unable to submit verification request.");
      }
      const data = result?.data || {};
      setVerificationStatus((data.status as typeof verificationStatus) || "pending");
      if (data.requestedAt) {
        setVerificationRequestedAt(data.requestedAt);
      } else {
        setVerificationRequestedAt(new Date().toISOString());
      }
      setVerificationMessage("");
      notifications.showSuccess(
        "Verification Requested",
        "We received your verification request. Our team will review it soon."
      );
    } catch (e: any) {
      notifications.showError(
        "Request Failed",
        e?.message || "Unable to submit verification request."
      );
    } finally {
      setIsRequestingVerification(false);
    }
  };

  // Language label map (typed)
  const LANG_LABELS = {
    auto: "Auto (device)",
    en: "English",
    es: "Spanish",
    fr: "French",
    pt: "Portuguese",
    zh: "Mandarin Chinese",
    ja: "Japanese",
    ko: "Korean",
    ru: "Russian",
    ar: "Arabic",
    hi: "Hindi",
    bn: "Bengali",
    id: "Indonesian",
    vi: "Vietnamese",
    tl: "Filipino",
    de: "German",
    it: "Italian",
    tr: "Turkish",
    sw: "Swahili",
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
    if (section === "profile") {
      try {
        const updateData: any = {
          full_name: formData.name, // Changed from 'name' to 'full_name' to match API schema
          bio: formData.bio,
          location: formData.location,
          phone: formData.phone || undefined, // Add phone number
        };

        // Include coordinates if available
        if (userLocation.coordinates) {
          updateData.location_coordinates = userLocation.coordinates;
        }

        const response = await authFetch(`/api/users/${user.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateData),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || "Failed to save profile");
        }

        // Update formData with the response from the server
        if (result.data?.user) {
          const updatedUser = result.data.user;
          setFormData((prev) => ({
            ...prev,
            name: updatedUser.full_name || prev.name,
            bio: updatedUser.bio ?? prev.bio,
            location: updatedUser.location || prev.location,
            phone: updatedUser.phone ?? prev.phone,
          }));
          // Update userLocation if coordinates were updated
          if (updatedUser.location_coordinates) {
            setUserLocation((prev) => ({
              ...prev,
              coordinates: updatedUser.location_coordinates,
            }));
          }
        }

        notifications.showSuccess(
          "Profile Saved",
          "Your profile information has been updated."
        );
      } catch (e: any) {
        notifications.showError(
          "Save Failed",
          e.message || "Unable to save profile"
        );
      }
      return;
    }

    if (section === "business") {
      try {
        const businessData: any = {
          company_name: formData.business?.name || "",
          industry: formData.business?.industry || "",
          business_type: formData.business?.type || "",
          company_size: formData.business?.size || "",
          business_description: formData.business?.description || "",
          business_address:
            formData.business?.address || businessLocation.address || "",
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
        };

        // Include business coordinates if available
        if (businessLocation.coordinates) {
          businessData.business_coordinates = businessLocation.coordinates;
        }

        await saveProfile(businessData);
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
    <Tabs defaultValue="profile" className="space-y-4 sm:space-y-6">
      <TabsList className="grid w-full grid-cols-3 grid-rows-2 gap-2 h-auto sm:grid-cols-6 sm:grid-rows-1">
        <TabsTrigger value="profile" className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm">
          <Bell className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
          <span>Profile</span>
        </TabsTrigger>
        <TabsTrigger value="notifications" className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm">
          <Shield className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
          <span>Notifications</span>
        </TabsTrigger>
        <TabsTrigger value="privacy" className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm">
          <CreditCard className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
          <span>Privacy</span>
        </TabsTrigger>
        <TabsTrigger value="business" className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm">
          <Briefcase className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
          <span>Business</span>
        </TabsTrigger>
        <TabsTrigger value="billing" className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm">
          <CreditCard className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
          <span>Billing</span>
        </TabsTrigger>
        <TabsTrigger value="account" className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm">
          <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
          <span>Account</span>
        </TabsTrigger>
      </TabsList>

      {/* Profile Settings */}
      <TabsContent value="profile" className="space-y-4 sm:space-y-6">
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="font-heading text-base sm:text-lg">
                  Basic Information
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Update your personal details and contact information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 p-4 sm:p-6">
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
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
                    <LocationPicker
                      value={userLocation}
                      onChange={(location) => {
                        setUserLocation(location);
                        setFormData({
                          ...formData,
                          location: location.address,
                        });
                      }}
                      label="Location"
                      placeholder="Enter your location or use current location"
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

                <Button onClick={() => handleSave("profile")} className="w-full sm:w-fit">
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
              </CardContent>
            </Card>

            {/* Role Selection */}
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="font-heading text-base sm:text-lg">Platform Roles</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Select all roles that apply to you - you can have multiple
                  roles at once
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 p-4 sm:p-6">
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
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
                  className="w-full sm:w-fit"
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
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="font-heading text-base sm:text-lg">My Skills</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Add your skills with proficiency levels to get better job matches. 
                    Jobs matching your skills will be prioritized based on your skill levels.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Selected Skills */}
                  {workerSkills.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-base font-semibold">
                          Your Skills ({workerSkills.length})
                        </Label>
                      </div>
                      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                        {workerSkills.map((skill, index) => (
                          <SkillCard
                            key={`${skill.name}-${index}`}
                            skill={skill}
                            onRemove={() => removeSkill(skill.name)}
                            showCategory={true}
                            showLevel={true}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {workerSkills.length > 0 && <Separator />}

                  {/* Add Skills Section */}
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Add Skills</Label>
                    <SkillSelector
                      selectedSkills={workerSkills}
                      onAddSkill={addSkill}
                      onRemoveSkill={removeSkill}
                      showCustomInput={true}
                    />
                  </div>

                  <Separator />

                  {/* Save Button */}
                  <Button
                    onClick={handleSaveSkills}
                    className="w-full md:w-fit"
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
          <div className="space-y-4 sm:space-y-6">
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="font-heading text-base sm:text-lg">Profile Picture</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Upload a professional photo</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 p-4 sm:p-6 pt-0">
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

            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="font-heading text-base sm:text-lg">Account Verification</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Verified profiles build more trust with employers and buyers.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 p-4 sm:p-6 pt-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {(() => {
                    switch (verificationStatus) {
                      case "verified":
                        return (
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Verified
                          </Badge>
                        )
                      case "pending":
                        return (
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1">
                            <Clock3 className="h-3 w-3" />
                            Pending Review
                          </Badge>
                        )
                      case "rejected":
                        return (
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Rejected
                          </Badge>
                        )
                      default:
                        return (
                          <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">
                            Not Verified
                          </Badge>
                        )
                    }
                  })()}
                  {verificationRequestedAt && verificationStatus === "pending" && (
                    <span className="text-xs text-muted-foreground">
                      Requested on {new Date(verificationRequestedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>

                {verificationStatus === "verified" ? (
                  <p className="text-sm text-muted-foreground">
                    Your account is verified. Thanks for building trust in the community!
                  </p>
                ) : verificationStatus === "pending" ? (
                  <p className="text-sm text-muted-foreground">
                    Your request is under review. We'll notify you once it's approved.
                  </p>
                ) : (
                  <>
                    {verificationStatus === "rejected" && (
                      <p className="text-sm text-red-600">
                        Your previous request was not approved. You can submit another request below.
                      </p>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="verification-message">Message to reviewers (optional)</Label>
                      <Textarea
                        id="verification-message"
                        placeholder="Share any supporting details for verification..."
                        value={verificationMessage}
                        onChange={(e) => setVerificationMessage(e.target.value)}
                        rows={3}
                      />
                    </div>
                    <Button
                      onClick={handleVerificationRequest}
                      disabled={isRequestingVerification}
                      className="w-full sm:w-fit"
                    >
                      {isRequestingVerification ? "Submitting..." : "Request Verification"}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </TabsContent>

      {/* Notification Settings */}
      <TabsContent value="notifications" className="space-y-4 sm:space-y-6">
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="font-heading text-base sm:text-lg">
              Notification Preferences
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Choose how you want to be notified about important updates
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6 pt-0">
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
              className="w-full sm:w-fit"
            >
              <Save className="mr-2 h-4 w-4" />
              Save Preferences
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Privacy Settings */}
      <TabsContent value="privacy" className="space-y-4 sm:space-y-6">
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="font-heading text-base sm:text-lg">Privacy Settings</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Control who can see your information and how it's used
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6 pt-0">
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

            <Button onClick={() => handleSave("privacy")} className="w-full sm:w-fit">
              <Save className="mr-2 h-4 w-4" />
              Save Privacy Settings
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Billing Settings */}
      <TabsContent value="billing" className="space-y-4 sm:space-y-6">
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="font-heading text-base sm:text-lg">
              Billing & Subscription
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Manage your payment methods and subscription
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6 pt-0">
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
      <TabsContent value="business" className="space-y-4 sm:space-y-6">
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="font-heading text-base sm:text-lg">Business Information</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Manage your business profile and company details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6 pt-0">
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
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
                  <SelectTrigger className="border-white dark:border-white">
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

            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
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
                  <SelectTrigger className="border-white dark:border-white">
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
              <LocationPicker
                value={businessLocation}
                onChange={(location) => {
                  setBusinessLocation(location);
                  setFormData({
                    ...formData,
                    business: {
                      ...formData.business,
                      address: location.address,
                    },
                  });
                }}
                label="Business Address"
                placeholder="Enter business address or use current location"
              />
            </div>

            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              <div>
                <Label htmlFor="business-registration">
                  Business Registration Number
                </Label>
                <Input
                  id="business-registration"
                  placeholder="Enter registration number (optional)"
                  value={
                    formData.business?.registration ||
                    profile?.business_registration ||
                    ""
                  }
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      business: {
                        ...formData.business,
                        registration: e.target.value,
                      },
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="business-hours">Business Hours</Label>
                <Input
                  id="business-hours"
                  placeholder="e.g., Mon-Fri 8AM-5PM"
                  value={
                    formData.business?.hours || profile?.business_hours || ""
                  }
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      business: { ...formData.business, hours: e.target.value },
                    })
                  }
                />
              </div>
            </div>

            <Button onClick={() => handleSave("business")} className="w-full sm:w-fit">
              <Save className="mr-2 h-4 w-4" />
              Save Business Information
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="font-heading text-base sm:text-lg">Business Logo</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Upload your company logo for professional branding
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
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
      <TabsContent value="account" className="space-y-4 sm:space-y-6">
        {/* Appearance/Dark Mode card */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="font-heading flex items-center gap-2 text-base sm:text-lg">
              <Moon className="h-4 w-4 sm:h-5 sm:w-5" />
              Appearance
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Customize how AgriReach looks on your device
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-4 sm:p-6 pt-0">
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
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="pt">Portuguese</option>
                  <option value="zh">Mandarin Chinese</option>
                  <option value="ja">Japanese</option>
                  <option value="ko">Korean</option>
                  <option value="ru">Russian</option>
                  <option value="ar">Arabic</option>
                  <option value="hi">Hindi</option>
                  <option value="bn">Bengali</option>
                  <option value="id">Indonesian</option>
                  <option value="vi">Vietnamese</option>
                  <option value="tl">Filipino</option>
                  <option value="de">German</option>
                  <option value="it">Italian</option>
                  <option value="tr">Turkish</option>
                  <option value="sw">Swahili</option>
                </select>
              </div>
              <p className="text-xs text-muted-foreground">
                Current: <strong>{currentLanguageLabel}</strong>
              </p>
              <div className="mt-2 flex items-center justify-between gap-3">
                <span className="text-sm">Manual translation</span>
                <Button
                  variant="default"
                  size="sm"
                  disabled={isTranslating}
                  onClick={async () => {
                    notifications.showInfo(
                      "Translating",
                      `Translating page to ${currentLanguageLabel}...`
                    );
                    try {
                      await translateNow();
                      notifications.showSuccess(
                        "Translation complete",
                        `Content translated to ${currentLanguageLabel}`
                      );
                    } catch (e: any) {
                      notifications.showError(
                        "Translation failed",
                        e?.message || "Unable to translate content"
                      );
                    }
                  }}
                >
                  {isTranslating ? "Translating..." : "Translate"}
                </Button>
              </div>
            </div>
            {/* end language selector */}

            {/* ...existing code (remaining CardContent) ... */}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="font-heading text-base sm:text-lg">Account Security</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Manage your account security and data preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6 pt-0">
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

            <Button onClick={() => handleSave("account")} className="w-full sm:w-fit">
              <Save className="mr-2 h-4 w-4" />
              Save Security Settings
            </Button>
          </CardContent>
        </Card>

        <Card className="border-destructive/50">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="font-heading text-destructive text-base sm:text-lg">
              Danger Zone
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Irreversible actions that affect your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-4 sm:p-6 pt-0">
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
