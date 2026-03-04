"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useAuth, useDatabase } from "@/context";
import { MODELS } from "@/lib";
import {
  AvatarUpload,
  Input,
  PrimaryButton,
  Select,
  Textarea,
} from "@/components";
import { motion } from "framer-motion";

function SaveButton({ hasChanges, loading, isSaved, onClick }) {
  return (
    <motion.div
      className="overflow-hidden flex justify-end"
      initial={{ height: 0, opacity: 0 }}
      animate={{
        height: hasChanges ? "auto" : 0,
        opacity: hasChanges ? 1 : 0,
      }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
    >
      <PrimaryButton
        className="w-max px-4"
        disabled={loading}
        onClick={onClick}
      >
        {loading ? "Saving..." : isSaved ? "Saved!" : "Save Changes"}
      </PrimaryButton>
    </motion.div>
  );
}

function GeneralSettingsPage() {
  const { user } = useAuth();
  const { getUserProfile, updateUserProfile, uploadProfileImage, loading } =
    useDatabase();

  const [savedProfile, setSavedProfile] = useState(null);

  // Per-field state
  const [fullName, setFullName] = useState("");
  const [modelPreferences, setModelPreferences] = useState("");
  const [userDefaultModel, setUserDefaultModel] = useState(MODELS[0].id);
  const [avatarFile, setAvatarFile] = useState(null); // File object
  const [avatarPreview, setAvatarPreview] = useState(null); // data URL or remote URL

  // Per-section saved feedback
  const [savedSection, setSavedSection] = useState(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      setIsProfileLoading(true);
      let profile = null;
      let attempts = 0;

      while (!profile && attempts < 5) {
        profile = await getUserProfile();
        if (!profile) {
          attempts++;
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }

      if (profile) {
        const initial = {
          fullName: profile.displayName || "",
          modelPreferences: profile.preferences?.modelPreferences || "",
          defaultModel: profile.preferences?.defaultModel || MODELS[0].id,
          avatarUrl: profile.photoURL || null,
        };
        setSavedProfile(initial);
        setFullName(initial.fullName);
        setModelPreferences(initial.modelPreferences);
        setUserDefaultModel(initial.defaultModel);
        setAvatarPreview(initial.avatarUrl);
      }

      setIsProfileLoading(false);
    };

    if (user) loadProfile();
  }, [user, getUserProfile]);

  const profileChanged =
    savedProfile &&
    (fullName !== savedProfile.fullName ||
      avatarPreview !== savedProfile.avatarUrl);

  const preferencesChanged =
    savedProfile && modelPreferences !== savedProfile.modelPreferences;

  const flashSaved = (section) => {
    setSavedSection(section);
    setTimeout(() => setSavedSection(null), 3000);
  };

  const handleSaveProfile = useCallback(async () => {
    let photoURL = savedProfile?.avatarUrl ?? null;

    if (avatarFile) {
      // If your useDatabase exposes uploadProfileImage, use it; otherwise
      // pass the file to updateUserProfile and let the hook handle upload.
      if (typeof uploadProfileImage === "function") {
        photoURL = await uploadProfileImage(avatarFile);
      }
    } else if (avatarPreview === null) {
      photoURL = null; // user removed their photo
    }

    await updateUserProfile({ displayName: fullName, photoURL });
    setSavedProfile((prev) => ({ ...prev, fullName, avatarUrl: photoURL }));
    setAvatarFile(null);
    flashSaved("profile");
  }, [
    fullName,
    avatarFile,
    avatarPreview,
    savedProfile,
    updateUserProfile,
    uploadProfileImage,
  ]);

  const handleSavePreferences = useCallback(async () => {
    await updateUserProfile({ preferences: { modelPreferences } });
    setSavedProfile((prev) => ({ ...prev, modelPreferences }));
    flashSaved("preferences");
  }, [modelPreferences, updateUserProfile]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "full-name") setFullName(value);
    else if (name === "preferences") setModelPreferences(value);
    else if (name === "default-model") setUserDefaultModel(value);
  };

  const handleAvatarChange = (file, preview) => {
    setAvatarFile(file);
    setAvatarPreview(preview);
  };

  const TextareaPlaceholderExamples = [
    "Ask clarifying questions before answering...",
    "Be concise and to the point...",
    "Provide detailed explanations with examples...",
    "Use a casual and friendly tone...",
    "Focus on practical, actionable advice...",
  ];

  const currentModelLabel =
    MODELS.find((m) => m.id === userDefaultModel)?.label || userDefaultModel;

  if (isProfileLoading) return null;

  return (
    <div className="flex flex-col gap-10">
      {/* ── Profile ── */}
      <div className="flex flex-col gap-5">
        <h4 className="font-medium">Profile</h4>
        <div className="flex flex-col gap-6 p-4 rounded-xl border border-neutral-800 bg-neutral-900/30">
          <AvatarUpload
            currentUrl={avatarPreview}
            displayName={fullName}
            onChange={handleAvatarChange}
          />
          <hr className="border-neutral-800" />
          <div className="flex flex-col md:flex-row items-start justify-between gap-6">
            <Input
              label="What would you like to be called?"
              value={fullName}
              onChange={handleInputChange}
              id="full-name"
              name="full-name"
              placeholder="No Name yet..."
            />
            <Input
              label="Email"
              value={user?.email || ""}
              onChange={() => {}}
              id="email"
              name="email"
              placeholder="email@example.com"
              disabled
            />
          </div>
        </div>
        <SaveButton
          hasChanges={profileChanged}
          loading={loading}
          isSaved={savedSection === "profile"}
          onClick={handleSaveProfile}
        />
      </div>

      {/* ── Preferences ── */}
      <div className="flex flex-col gap-5">
        <h4 className="font-medium">Preferences</h4>
        <div className="flex flex-col gap-4 p-4 rounded-xl border border-neutral-800 bg-neutral-900/30">
          <Textarea
            label="What personal preferences should Claude consider in responses?"
            value={modelPreferences}
            onChange={handleInputChange}
            id="preferences"
            name="preferences"
            placeholderArray={TextareaPlaceholderExamples}
            inputClassName="min-h-32"
          />
        </div>
        <SaveButton
          hasChanges={preferencesChanged}
          loading={loading}
          isSaved={savedSection === "preferences"}
          onClick={handleSavePreferences}
        />
      </div>

      <hr className="text-neutral-700" />

      {/* ── Model & Theme ── */}
      <div className="flex flex-col gap-5">
        <h4 className="font-medium">Default Model</h4>
        <div className="flex flex-col gap-6 p-4 rounded-xl border border-neutral-800 bg-neutral-900/30">
          <Select
            id="default-model"
            name="default-model"
            label="Default Model"
            list={MODELS}
            onChange={handleInputChange}
            value={currentModelLabel}
          />
        </div>
      </div>
    </div>
  );
}

export default GeneralSettingsPage;
