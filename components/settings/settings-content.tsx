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
  Mail,
  Smartphone,
  MessageSquare,
  Megaphone,
  Building2,
  ImageIcon,
  MapPin,
  Star,
  Globe,
  RefreshCw,
  Lock,
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
    <Tabs defaultValue="profile" className="space-y-3 sm:space-y-4 md:space-y-6">
      <TabsList className="grid w-full grid-cols-3 grid-rows-2 gap-1.5 sm:gap-2 h-auto sm:grid-cols-6 sm:grid-rows-1">
        <TabsTrigger value="profile" className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 sm:py-2.5">
          <Bell className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
          <span>Profile</span>
        </TabsTrigger>
        <TabsTrigger value="notifications" className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 sm:py-2.5">
          <Shield className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
          <span>Notifications</span>
        </TabsTrigger>
        <TabsTrigger value="privacy" className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 sm:py-2.5">
          <CreditCard className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
          <span>Privacy</span>
        </TabsTrigger>
        <TabsTrigger value="business" className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 sm:py-2.5">
          <Briefcase className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
          <span>Business</span>
        </TabsTrigger>
        <TabsTrigger value="billing" className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 sm:py-2.5">
          <CreditCard className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
          <span>Billing</span>
        </TabsTrigger>
        <TabsTrigger value="account" className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 sm:py-2.5">
          <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
          <span>Account</span>
        </TabsTrigger>
      </TabsList>

      {/* Profile Settings */}
      <TabsContent value="profile" className="space-y-3 sm:space-y-4 md:space-y-6">
        <div className="grid gap-3 sm:gap-4 md:gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-3 sm:space-y-4 md:space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader className="p-3 sm:p-4 md:p-6">
                <CardTitle className="font-heading text-base sm:text-lg">
                  Basic Information
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Update your personal details and contact information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-4 md:p-6">
                <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
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
              <CardHeader className="p-3 sm:p-4 md:p-6">
                <CardTitle className="font-heading text-base sm:text-lg">Platform Roles</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Select all roles that apply to you - you can have multiple
                  roles at once
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-4 md:p-6">
                <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
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
                <CardHeader className="p-3 sm:p-4 md:p-6">
                  <CardTitle className="font-heading text-base sm:text-lg">My Skills</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Add your skills with proficiency levels to get better job matches. 
                    Jobs matching your skills will be prioritized based on your skill levels.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4 md:space-y-6">
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
          <div className="space-y-3 sm:space-y-4 md:space-y-6">
            <Card>
              <CardHeader className="p-3 sm:p-4 md:p-6">
                <CardTitle className="font-heading text-base sm:text-lg">Profile Picture</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Upload a professional photo</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-4 md:p-6 pt-0">
                <div className="flex flex-col items-center gap-3 sm:gap-4">
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
                      }
                    }}
                    onUploadError={(error) => {
                      notifications.showError("Upload Failed", error);
                    }}
                    className="w-full max-w-md"
                  />

                  {formData.avatar && formData.avatar !== user.avatar && (
                    <div className="flex flex-col gap-2 w-full max-w-md">
                      <Button
                        onClick={async () => {
                          try {
                            await authFetch(`/api/users/${user.id}`, {
                              method: "PUT",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ avatar_url: formData.avatar }),
                            });
                            notifications.showSuccess(
                              "Profile Picture Saved",
                              "Your profile picture has been saved successfully."
                            );
                            // Update user object to reflect saved state
                            window.location.reload();
                          } catch (error) {
                            notifications.showError("Save Failed", "Failed to save profile picture. Please try again.");
                          }
                        }}
                        className="w-full"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Save Profile Picture
                      </Button>
                      <p className="text-xs text-muted-foreground text-center">
                        Click save to update your profile picture
                      </p>
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground text-center">
                    Recommended: Square image, at least 400x400px. Max 5MB.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="p-3 sm:p-4 md:p-6">
                <CardTitle className="font-heading text-base sm:text-lg">Account Verification</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Verified profiles build more trust with employers and buyers.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-4 md:p-6 pt-0">
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
      <TabsContent value="notifications" className="space-y-3 sm:space-y-4 md:space-y-6">
        <Card className="border-2">
          <CardHeader className="p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="font-heading text-lg sm:text-xl text-foreground">
                  Notification Preferences
                </CardTitle>
                <CardDescription className="text-sm mt-1">
                  Choose how you want to be notified about important updates
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 p-4 sm:p-6 pt-0">
            {/* Communication Channels */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-border">
                <div className="p-1.5 rounded bg-muted/50">
                  <Smartphone className="h-4 w-4 text-primary" />
                </div>
                <h4 className="font-semibold text-base sm:text-lg text-foreground">Communication Channels</h4>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 rounded-lg border-2 border-border bg-card hover:bg-muted/30 dark:hover:bg-card/50 transition-colors">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="p-2 rounded-lg bg-blue-500/10 flex-shrink-0">
                      <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Label htmlFor="email-notifications" className="text-base font-medium text-foreground cursor-pointer">
                        Email Notifications
                      </Label>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        Receive notifications via email
                      </p>
                    </div>
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
                    className="flex-shrink-0"
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border-2 border-border bg-card hover:bg-muted/30 dark:hover:bg-card/50 transition-colors">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="p-2 rounded-lg bg-green-500/10 flex-shrink-0">
                      <Bell className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Label htmlFor="push-notifications" className="text-base font-medium text-foreground cursor-pointer">
                        Push Notifications
                      </Label>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        Receive browser push notifications
                      </p>
                    </div>
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
                    className="flex-shrink-0"
                  />
                </div>
              </div>
            </div>

            {/* Content Preferences */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-border">
                <div className="p-1.5 rounded bg-muted/50">
                  <MessageSquare className="h-4 w-4 text-primary" />
                </div>
                <h4 className="font-semibold text-base sm:text-lg text-foreground">Content Preferences</h4>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 rounded-lg border-2 border-border bg-card hover:bg-muted/30 dark:hover:bg-card/50 transition-colors">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="p-2 rounded-lg bg-yellow-500/10 flex-shrink-0">
                      <Briefcase className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Label htmlFor="job-alerts" className="text-base font-medium text-foreground cursor-pointer">Job Alerts</Label>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        New job opportunities matching your profile
                      </p>
                    </div>
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
                    className="flex-shrink-0"
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border-2 border-border bg-card hover:bg-muted/30 dark:hover:bg-card/50 transition-colors">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="p-2 rounded-lg bg-indigo-500/10 flex-shrink-0">
                      <MessageSquare className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Label htmlFor="message-alerts" className="text-base font-medium text-foreground cursor-pointer">Message Alerts</Label>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        New messages and communications
                      </p>
                    </div>
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
                    className="flex-shrink-0"
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border-2 border-border bg-card hover:bg-muted/30 dark:hover:bg-card/50 transition-colors">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="p-2 rounded-lg bg-pink-500/10 flex-shrink-0">
                      <Megaphone className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Label htmlFor="marketing-emails" className="text-base font-medium text-foreground cursor-pointer">Marketing Emails</Label>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        Product updates and promotional content
                      </p>
                    </div>
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
                    className="flex-shrink-0"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <Button
                onClick={() => handleSave("notification")}
                className="w-full sm:w-auto bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all"
              >
                <Save className="mr-2 h-4 w-4" />
                Save Preferences
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Privacy Settings */}
      <TabsContent value="privacy" className="space-y-3 sm:space-y-4 md:space-y-6">
        <Card className="border-2">
          <CardHeader className="p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="font-heading text-lg sm:text-xl text-foreground">Privacy Settings</CardTitle>
                <CardDescription className="text-sm mt-1">
                  Control who can see your information and how it's used
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 p-4 sm:p-6 pt-0">
            {/* Profile Visibility */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-border">
                <div className="p-1.5 rounded bg-muted/50">
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <h4 className="font-semibold text-base sm:text-lg text-foreground">Profile Visibility</h4>
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-visibility" className="text-sm font-medium">Who can view your profile?</Label>
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
                  <SelectTrigger className="bg-background border-border">
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
            </div>

            {/* Privacy Options */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-border">
                <div className="p-1.5 rounded bg-muted/50">
                  <Shield className="h-4 w-4 text-primary" />
                </div>
                <h4 className="font-semibold text-base sm:text-lg text-foreground">Privacy Options</h4>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 rounded-lg border-2 border-border bg-card hover:bg-muted/30 dark:hover:bg-card/50 transition-colors">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="p-2 rounded-lg bg-blue-500/10 flex-shrink-0">
                      <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Label htmlFor="show-location" className="text-base font-medium text-foreground cursor-pointer">
                        Show Location
                      </Label>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        Display your location on your profile
                      </p>
                    </div>
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
                    className="flex-shrink-0"
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border-2 border-border bg-card hover:bg-muted/30 dark:hover:bg-card/50 transition-colors">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="p-2 rounded-lg bg-green-500/10 flex-shrink-0">
                      <Mail className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Label htmlFor="show-contact" className="text-base font-medium text-foreground cursor-pointer">
                        Show Contact Information
                      </Label>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        Allow others to see your contact details
                      </p>
                    </div>
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
                    className="flex-shrink-0"
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border-2 border-border bg-card hover:bg-muted/30 dark:hover:bg-card/50 transition-colors">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="p-2 rounded-lg bg-yellow-500/10 flex-shrink-0">
                      <Star className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Label htmlFor="show-rating" className="text-base font-medium text-foreground cursor-pointer">Show Rating</Label>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        Display your rating and reviews publicly
                      </p>
                    </div>
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
                    className="flex-shrink-0"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <Button 
                onClick={() => handleSave("privacy")} 
                className="w-full sm:w-auto bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all"
              >
                <Save className="mr-2 h-4 w-4" />
                Save Privacy Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Billing Settings */}
      <TabsContent value="billing" className="space-y-3 sm:space-y-4 md:space-y-6">
        <Card className="border-2">
          <CardHeader className="p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <CreditCard className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="font-heading text-lg sm:text-xl text-foreground">
                  Billing & Subscription
                </CardTitle>
                <CardDescription className="text-sm mt-1">
                  Manage your payment methods and subscription
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 p-4 sm:p-6 pt-0">
            {/* Current Plan */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-border">
                <div className="p-1.5 rounded bg-muted/50">
                  <CheckCircle className="h-4 w-4 text-primary" />
                </div>
                <h4 className="font-semibold text-base sm:text-lg text-foreground">Current Plan</h4>
              </div>
              <div className="p-5 rounded-lg border-2 border-border bg-card">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h5 className="text-lg font-semibold text-foreground">Free Plan</h5>
                      <Badge variant="secondary" className="ml-2">Active</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      You're currently on the free plan with basic features. Upgrade to unlock premium features.
                    </p>
                  </div>
                </div>
                <Button className="w-full sm:w-auto bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all">
                  <Plus className="mr-2 h-4 w-4" />
                  Upgrade to Premium
                </Button>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-border">
                <div className="p-1.5 rounded bg-muted/50">
                  <CreditCard className="h-4 w-4 text-primary" />
                </div>
                <h4 className="font-semibold text-base sm:text-lg text-foreground">Payment Methods</h4>
              </div>
              <div className="p-5 rounded-lg border-2 border-border bg-card">
                <div className="text-center py-6">
                  <CreditCard className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground mb-4">
                    No payment methods added yet.
                  </p>
                  <Button 
                    variant="outline" 
                    className="border-2 hover:bg-muted/70 dark:hover:bg-muted/50 dark:border-border dark:text-foreground"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Payment Method
                  </Button>
                </div>
              </div>
            </div>

            {/* Billing History */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-border">
                <div className="p-1.5 rounded bg-muted/50">
                  <Clock3 className="h-4 w-4 text-primary" />
                </div>
                <h4 className="font-semibold text-base sm:text-lg text-foreground">Billing History</h4>
              </div>
              <div className="p-5 rounded-lg border-2 border-border bg-card">
                <div className="text-center py-6">
                  <Clock3 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    No billing history available.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Business Settings */}
      <TabsContent value="business" className="space-y-3 sm:space-y-4 md:space-y-6">
        <Card className="border-2">
          <CardHeader className="p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="font-heading text-lg sm:text-xl text-foreground">Business Information</CardTitle>
                <CardDescription className="text-sm mt-1">
                  Manage your business profile and company details
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5 p-4 sm:p-6 pt-0">
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="company-name" className="text-sm font-medium">Company Name</Label>
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
                  className="bg-background border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="industry" className="text-sm font-medium">Industry</Label>
                <Select
                  value={formData.business?.industry || profile?.industry || ""}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      business: { ...formData.business, industry: value },
                    })
                  }
                >
                  <SelectTrigger className="bg-background border-border">
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
              <div className="space-y-2">
                <Label htmlFor="business-type" className="text-sm font-medium">Business Type</Label>
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
                  <SelectTrigger className="bg-background border-border">
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
              <div className="space-y-2">
                <Label htmlFor="company-size" className="text-sm font-medium">Company Size</Label>
                <Select
                  value={formData.business?.size || profile?.company_size || ""}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      business: { ...formData.business, size: value },
                    })
                  }
                >
                  <SelectTrigger className="bg-background border-border">
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
              <div className="space-y-2">
                <Label htmlFor="years-in-business" className="text-sm font-medium">Years in Business</Label>
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
                  className="bg-background border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="services-offered" className="text-sm font-medium">Services Offered</Label>
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
                  className="bg-background border-border"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="business-description" className="text-sm font-medium">Business Description</Label>
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
                className="bg-background border-border resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website" className="text-sm font-medium">Website</Label>
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
                className="bg-background border-border"
              />
            </div>

            <div className="space-y-2">
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
              <div className="space-y-2">
                <Label htmlFor="business-registration" className="text-sm font-medium">
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
                  className="bg-background border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="business-hours" className="text-sm font-medium">Business Hours</Label>
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
                  className="bg-background border-border"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <Button 
                onClick={() => handleSave("business")} 
                className="w-full sm:w-auto bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all"
              >
                <Save className="mr-2 h-4 w-4" />
                Save Business Information
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader className="p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <ImageIcon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="font-heading text-lg sm:text-xl text-foreground">Business Logo</CardTitle>
                <CardDescription className="text-sm mt-1">
                  Upload your company logo for professional branding
                </CardDescription>
              </div>
            </div>
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
      <TabsContent value="account" className="space-y-3 sm:space-y-4 md:space-y-6">
        {/* Appearance/Dark Mode card */}
        <Card className="border-2">
          <CardHeader className="p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Moon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="font-heading text-lg sm:text-xl text-foreground">
                  Appearance
                </CardTitle>
                <CardDescription className="text-sm mt-1">
                  Customize how AgriReach looks on your device
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 p-4 sm:p-6 pt-0">
            {/* Dark Mode */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-border">
                <div className="p-1.5 rounded bg-muted/50">
                  <Moon className="h-4 w-4 text-primary" />
                </div>
                <h4 className="font-semibold text-base sm:text-lg text-foreground">Theme</h4>
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg border-2 border-border bg-card hover:bg-muted/30 dark:hover:bg-card/50 transition-colors">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="p-2 rounded-lg bg-purple-500/10 flex-shrink-0">
                    <Moon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Label htmlFor="dark-mode" className="text-base font-medium text-foreground cursor-pointer">
                      Dark Mode
                    </Label>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Switch to a darker color scheme
                    </p>
                  </div>
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
                  className="flex-shrink-0"
                />
              </div>
            </div>

            {/* Language selector */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-border">
                <div className="p-1.5 rounded bg-muted/50">
                  <Globe className="h-4 w-4 text-primary" />
                </div>
                <h4 className="font-semibold text-base sm:text-lg text-foreground">Language</h4>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="language-select" className="text-sm font-medium">Choose language</Label>
                  <select
                    id="language-select"
                    className="w-full rounded-md border-2 border-border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
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
                <div className="p-3 rounded-lg bg-muted/50 border border-border">
                  <p className="text-xs text-muted-foreground">
                    Current: <strong className="text-foreground">{currentLanguageLabel}</strong>
                  </p>
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg border-2 border-border bg-card">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="p-2 rounded-lg bg-blue-500/10 flex-shrink-0">
                      <RefreshCw className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Label className="text-base font-medium text-foreground">
                        Manual translation
                      </Label>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        Translate the current page manually
                      </p>
                    </div>
                  </div>
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
                    className="flex-shrink-0 bg-primary hover:bg-primary/90"
                  >
                    {isTranslating ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Translating...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Translate
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
            {/* end language selector */}
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader className="p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Lock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="font-heading text-lg sm:text-xl text-foreground">Account Security</CardTitle>
                <CardDescription className="text-sm mt-1">
                  Manage your account security and data preferences
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 p-4 sm:p-6 pt-0">
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-border">
                <div className="p-1.5 rounded bg-muted/50">
                  <Clock3 className="h-4 w-4 text-primary" />
                </div>
                <h4 className="font-semibold text-base sm:text-lg text-foreground">Session Settings</h4>
              </div>
              <div className="space-y-2">
                <Label htmlFor="session-timeout" className="text-sm font-medium">
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
                  <SelectTrigger className="bg-background border-border">
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
                <p className="text-xs text-muted-foreground mt-1">
                  Your session will automatically expire after the selected time of inactivity.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <Button 
                onClick={() => handleSave("account")} 
                className="w-full sm:w-auto bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all"
              >
                <Save className="mr-2 h-4 w-4" />
                Save Security Settings
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-destructive/50">
          <CardHeader className="p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-destructive/10">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <CardTitle className="font-heading text-lg sm:text-xl text-destructive">
                  Danger Zone
                </CardTitle>
                <CardDescription className="text-sm mt-1">
                  Irreversible actions that affect your account
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 p-4 sm:p-6 pt-0">
            <div className="flex items-center justify-between p-5 rounded-lg border-2 border-destructive/30 bg-destructive/5 hover:bg-destructive/10 transition-colors">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="p-2 rounded-lg bg-destructive/20 flex-shrink-0">
                  <Trash2 className="h-5 w-5 text-destructive" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-base text-foreground mb-1">Delete Account</h4>
                  <p className="text-sm text-muted-foreground">
                    Permanently delete your account and all associated data. This action cannot be undone.
                  </p>
                </div>
              </div>
              <Button 
                variant="destructive" 
                className="flex-shrink-0 shadow-md hover:shadow-lg transition-all"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
