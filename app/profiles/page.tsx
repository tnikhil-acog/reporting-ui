"use client";

import { useEffect, useState, useRef } from "react";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import {
  Key,
  Plus,
  Trash2,
  Check,
  X,
  Loader2,
  Shield,
  Star,
} from "lucide-react";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

interface Profile {
  name: string;
  provider: string;
  model: string;
  apiKey: string;
}

interface ProfilesResponse {
  success: boolean;
  defaultProfile: string;
  profiles: Profile[];
  error?: string;
}

interface ProfileFormData {
  name: string;
  provider: string;
  model: string;
  apiKey: string;
}

const PROVIDERS = [
  { value: "gemini", label: "Google Gemini" },
  { value: "openai", label: "OpenAI" },
  { value: "deepseek", label: "DeepSeek" },
];

export default function ProfilesPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [defaultProfile, setDefaultProfile] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<ProfileFormData>({
    name: "",
    provider: "gemini",
    model: "",
    apiKey: "",
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const isMountedRef = useRef(false);

  useEffect(() => {
    if (isMountedRef.current) return;
    isMountedRef.current = true;
    fetchProfiles();

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/profiles");
      const data: ProfilesResponse = await response.json();

      if (response.ok) {
        setProfiles(data.profiles || []);
        setDefaultProfile(data.defaultProfile || "");
      } else {
        throw new Error(data.error || "Failed to fetch profiles");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error fetching profiles:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProfile = () => {
    setFormData({
      name: "",
      provider: "gemini",
      model: "",
      apiKey: "",
    });
    setShowForm(true);
    setError(null);
    setSuccess(null);
  };

  const handleDeleteProfile = async (profileName: string) => {
    if (
      !confirm(`Are you sure you want to delete the profile "${profileName}"?`)
    ) {
      return;
    }

    try {
      setError(null);
      setSuccess(null);

      const response = await fetch(
        `/api/profiles?name=${encodeURIComponent(profileName)}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (response.ok) {
        setSuccess(data.message || "Profile deleted successfully");
        await fetchProfiles();
      } else {
        throw new Error(data.error || "Failed to delete profile");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const handleSetDefault = async (profileName: string) => {
    try {
      setError(null);
      setSuccess(null);

      const response = await fetch("/api/profiles", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ defaultProfile: profileName }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(data.message || "Default profile updated");
        setDefaultProfile(profileName);
      } else {
        throw new Error(data.error || "Failed to set default profile");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    if (
      !formData.name ||
      !formData.provider ||
      !formData.model ||
      !formData.apiKey
    ) {
      setError("Please fill in all required fields");
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(data.message || "Profile created successfully");
        setShowForm(false);
        setFormData({ name: "", provider: "gemini", model: "", apiKey: "" });
        await fetchProfiles();
      } else {
        throw new Error(data.error || "Failed to save profile");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setFormData({ name: "", provider: "gemini", model: "", apiKey: "" });
    setError(null);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navigation />
        <main className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <p className="mt-4 text-muted-foreground">Loading profiles...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navigation />

      <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-8"
          >
            {/* Header */}
            <motion.div
              variants={item}
              className="flex items-center justify-between"
            >
              <div>
                <h1 className="text-4xl font-bold text-foreground">
                  LLM Profiles
                </h1>
                <p className="mt-2 text-muted-foreground">
                  Manage your LLM provider profiles and credentials
                </p>
              </div>
              {!showForm && (
                <Button
                  onClick={handleCreateProfile}
                  className="bg-gradient-to-r from-primary to-secondary"
                >
                  <Plus className="h-4 w-4" />
                  <span>New Profile</span>
                </Button>
              )}
            </motion.div>

            {/* Messages */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 flex items-start gap-3"
                >
                  <X className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-destructive">{error}</p>
                </motion.div>
              )}

              {success && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="rounded-xl border border-success/30 bg-success/5 p-4 flex items-start gap-3"
                >
                  <Check className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-success">{success}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Info Banner */}
            <motion.div
              variants={item}
              className="rounded-xl border border-info/30 bg-info/5 p-4 flex items-start gap-3"
            >
              <Shield className="h-5 w-5 text-info flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-info">
                  Secure Storage
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Your API credentials are stored in config.json and used for
                  report generation. Set a default profile to use across all
                  reports.
                </p>
              </div>
            </motion.div>

            {/* Create Form */}
            <AnimatePresence>
              {showForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <form
                    onSubmit={handleSubmit}
                    className="rounded-2xl border bg-card p-6 shadow-sm space-y-6"
                  >
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-semibold text-foreground">
                        Create New Profile
                      </h2>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={handleCancel}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="name">Profile Name *</Label>
                        <Input
                          id="name"
                          placeholder="e.g., gemini-1, claude-pro"
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="provider">Provider *</Label>
                        <select
                          id="provider"
                          value={formData.provider}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              provider: e.target.value,
                            })
                          }
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          required
                        >
                          {PROVIDERS.map((provider) => (
                            <option key={provider.value} value={provider.value}>
                              {provider.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="model">Model *</Label>
                      <Input
                        id="model"
                        placeholder="e.g., gemini-2.5-flash-lite"
                        value={formData.model}
                        onChange={(e) =>
                          setFormData({ ...formData, model: e.target.value })
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="apiKey">API Key *</Label>
                      <div className="relative">
                        <Input
                          id="apiKey"
                          type={showApiKey ? "text" : "password"}
                          placeholder="Enter your API key"
                          value={formData.apiKey}
                          onChange={(e) =>
                            setFormData({ ...formData, apiKey: e.target.value })
                          }
                          className="pr-10"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowApiKey(!showApiKey)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showApiKey ? "Hide" : "Show"}
                        </button>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button
                        type="submit"
                        disabled={submitting}
                        className="bg-gradient-to-r from-primary to-secondary"
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Saving...</span>
                          </>
                        ) : (
                          <>
                            <Check className="h-4 w-4" />
                            <span>Create Profile</span>
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancel}
                        disabled={submitting}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Profiles List */}
            {profiles.length === 0 && !showForm ? (
              <motion.div
                variants={item}
                className="rounded-2xl border border-dashed bg-card/50 p-12 text-center"
              >
                <Key className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold text-foreground">
                  No profiles yet
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Create your first LLM profile to start generating reports
                </p>
                <Button
                  onClick={handleCreateProfile}
                  className="mt-6 bg-gradient-to-r from-primary to-secondary"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create Profile</span>
                </Button>
              </motion.div>
            ) : (
              <motion.div variants={container} className="space-y-4">
                {profiles.map((profile) => (
                  <motion.div
                    key={profile.name}
                    variants={item}
                    whileHover={{ y: -2 }}
                    className="group rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-md hover:border-primary/30"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            <Key className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg font-semibold text-card-foreground">
                                {profile.name}
                              </h3>
                              {defaultProfile === profile.name && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-success/10 border border-success/20 px-2 py-0.5 text-xs font-medium text-success">
                                  <Star className="h-3 w-3 fill-success" />
                                  Default
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {PROVIDERS.find(
                                (p) => p.value === profile.provider
                              )?.label || profile.provider}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <span className="inline-flex items-center gap-1 rounded-md bg-muted/50 px-2 py-1 text-xs text-muted-foreground">
                            <Check className="h-3 w-3 text-success" />
                            Model: {profile.model}
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-md bg-muted/50 px-2 py-1 text-xs text-muted-foreground">
                            <Check className="h-3 w-3 text-success" />
                            API Key: ••••••••
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {defaultProfile !== profile.name && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSetDefault(profile.name)}
                            className="hover:bg-success/10 hover:text-success hover:border-success/50"
                          >
                            <Star className="h-4 w-4" />
                            <span className="hidden sm:inline">
                              Set Default
                            </span>
                          </Button>
                        )}
                        {defaultProfile !== profile.name && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteProfile(profile.name)}
                            className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="hidden sm:inline">Delete</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
