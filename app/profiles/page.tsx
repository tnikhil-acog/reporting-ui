"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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

export default function ProfilesPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [defaultProfile, setDefaultProfile] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [editingProfile, setEditingProfile] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    provider: "gemini",
    model: "",
    apiKey: "",
  });

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/profiles");
      const data: ProfilesResponse = await response.json();

      if (response.ok) {
        setProfiles(data.profiles);
        setDefaultProfile(data.defaultProfile);
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

  const handleAddNew = () => {
    setEditingProfile(null);
    setFormData({
      name: "",
      provider: "gemini",
      model: "",
      apiKey: "",
    });
    setShowForm(true);
  };

  const handleEdit = (profile: Profile) => {
    setEditingProfile(profile.name);
    setFormData({
      name: profile.name,
      provider: profile.provider,
      model: profile.model,
      apiKey: profile.apiKey,
    });
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingProfile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (
      !formData.name ||
      !formData.provider ||
      !formData.model ||
      !formData.apiKey
    ) {
      setError("Please fill in all required fields");
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
        setSuccess(data.message);
        setShowForm(false);
        setEditingProfile(null);
        fetchProfiles();
      } else {
        throw new Error(data.error || "Failed to save profile");
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
        setSuccess(data.message);
        setDefaultProfile(profileName);
      } else {
        throw new Error(data.error || "Failed to set default profile");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const handleDelete = async (profileName: string) => {
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
        setSuccess(data.message);
        fetchProfiles();
      } else {
        throw new Error(data.error || "Failed to delete profile");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <Link
                href="/"
                className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                ← Back Home
              </Link>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                🔐 LLM Profiles
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Manage your LLM provider profiles
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Messages */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900/20 dark:bg-red-900/10">
            <p className="text-red-800 dark:text-red-300">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900/20 dark:bg-green-900/10">
            <p className="text-green-800 dark:text-green-300">{success}</p>
          </div>
        )}

        {/* Add New Button */}
        <div className="mb-8 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Available Profiles
          </h2>
          {!showForm && (
            <button
              onClick={handleAddNew}
              className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 font-medium transition-colors"
            >
              + Add Profile
            </button>
          )}
        </div>

        {/* Form */}
        {showForm && (
          <div className="mb-8 rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
            <h3 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
              {editingProfile ? "Edit Profile" : "New Profile"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Profile Name *
                </label>
                <input
                  type="text"
                  disabled={!!editingProfile}
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-gray-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white disabled:opacity-50"
                  placeholder="e.g., gemini-1, claude-pro"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Provider *
                </label>
                <select
                  value={formData.provider}
                  onChange={(e) =>
                    setFormData({ ...formData, provider: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-gray-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                >
                  <option value="gemini">Google Gemini</option>
                  <option value="openai">OpenAI</option>
                  <option value="deepseek">DeepSeek</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Model *
                </label>
                <input
                  type="text"
                  value={formData.model}
                  onChange={(e) =>
                    setFormData({ ...formData, model: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-gray-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                  placeholder="e.g., gemini-2.5-flash-lite"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  API Key *
                </label>
                <input
                  type="password"
                  value={formData.apiKey}
                  onChange={(e) =>
                    setFormData({ ...formData, apiKey: e.target.value })
                  }
                  required
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-gray-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                  placeholder="Enter your API key"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 font-medium transition-colors"
                >
                  Save Profile
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-gray-900 px-6 py-2 font-medium transition-colors dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:hover:bg-slate-600"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="text-center">
              <div className="mb-4 inline-block">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600 dark:border-gray-600 dark:border-t-blue-400"></div>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                Loading profiles...
              </p>
            </div>
          </div>
        ) : profiles.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-12 text-center dark:border-gray-700 dark:bg-slate-800">
            <p className="mb-6 text-gray-600 dark:text-gray-400">
              No profiles configured yet. Create your first profile to get
              started.
            </p>
            {!showForm && (
              <button
                onClick={handleAddNew}
                className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 font-medium transition-colors"
              >
                + Create Profile
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {profiles.map((profile) => (
              <div
                key={profile.name}
                className="rounded-lg border-2 border-gray-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {profile.name}
                      </h3>
                      {defaultProfile === profile.name && (
                        <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800 dark:bg-green-900/20 dark:text-green-300">
                          ✓ Default
                        </span>
                      )}
                    </div>
                    <div className="space-y-1 text-sm">
                      <p className="text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Provider:</span>{" "}
                        {profile.provider}
                      </p>
                      <p className="text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Model:</span>{" "}
                        {profile.model}
                      </p>
                      {profile.apiKey && (
                        <p className="text-gray-600 dark:text-gray-400">
                          <span className="font-medium">API Key:</span> ••••••••
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(profile)}
                      className="rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-gray-900 px-4 py-2 font-medium transition-colors dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:hover:bg-slate-600"
                    >
                      Edit
                    </button>

                    {defaultProfile !== profile.name && (
                      <button
                        onClick={() => handleSetDefault(profile.name)}
                        className="rounded-lg border border-green-300 bg-white hover:bg-green-50 text-green-700 px-4 py-2 font-medium transition-colors dark:border-green-600 dark:bg-green-900/10 dark:text-green-400 dark:hover:bg-green-900/20"
                      >
                        Set Default
                      </button>
                    )}

                    {defaultProfile !== profile.name && (
                      <button
                        onClick={() => handleDelete(profile.name)}
                        className="rounded-lg border border-red-300 bg-white hover:bg-red-50 text-red-700 px-4 py-2 font-medium transition-colors dark:border-red-600 dark:bg-red-900/10 dark:text-red-400 dark:hover:bg-red-900/20"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
