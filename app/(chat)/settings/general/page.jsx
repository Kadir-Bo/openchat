"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth, useDatabase } from "@/context";
import { MODELS, THEMES } from "@/lib";
import {
  Input,
  PrimaryButton,
  Select,
  Textarea,
  ThemeSelect,
} from "@/components";
import { motion } from "framer-motion";

function GeneralSettingsPage() {
  const { user } = useAuth();
  const { getUserProfile, updateUserProfile, loading } = useDatabase();

  const [savedProfile, setSavedProfile] = useState(null);
  const [fullName, setFullName] = useState("");
  const [modelPreferences, setModelPreferences] = useState("");
  const [userDefaultModel, setUserDefaultModel] = useState(MODELS[0].id);
  const [activeTheme, setActiveTheme] = useState("auto");
  const [isSaved, setIsSaved] = useState(false);
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
          theme: profile.preferences?.theme || "auto",
        };

        setSavedProfile(initial);
        setFullName(initial.fullName);
        setModelPreferences(initial.modelPreferences);
        setUserDefaultModel(initial.defaultModel);
        setActiveTheme(initial.theme);
      }

      setIsProfileLoading(false);
    };

    if (user) loadProfile();
  }, [user, getUserProfile]);

  const hasChanges = useMemo(() => {
    if (!savedProfile) return false;

    return (
      fullName !== savedProfile.fullName ||
      modelPreferences !== savedProfile.modelPreferences ||
      userDefaultModel !== savedProfile.defaultModel ||
      activeTheme !== savedProfile.theme
    );
  }, [fullName, modelPreferences, userDefaultModel, activeTheme, savedProfile]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "full-name") setFullName(value);
    else if (name === "preferences") setModelPreferences(value);
    else if (name === "default-model") setUserDefaultModel(value);
  };

  const handleChangeTheme = (theme) => {
    setActiveTheme(theme);
  };

  const handleOnSave = useCallback(async () => {
    await updateUserProfile({
      displayName: fullName,
      preferences: {
        modelPreferences,
        defaultModel: userDefaultModel,
        theme: activeTheme,
        language: "de",
      },
    });

    setSavedProfile({
      fullName,
      modelPreferences,
      defaultModel: userDefaultModel,
      theme: activeTheme,
    });

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  }, [
    fullName,
    modelPreferences,
    userDefaultModel,
    activeTheme,
    updateUserProfile,
  ]);

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
      <div className="flex flex-col gap-5">
        <h4 className="font-medium">Profile</h4>
        <div className="flex flex-col gap-4 p-4 rounded-xl border border-neutral-800 bg-neutral-900/30">
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
      </div>

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
      </div>

      <hr className="text-neutral-700" />

      <div className="flex flex-col gap-5">
        <h4 className="font-medium">Model & Theme</h4>
        <div className="flex flex-col gap-6 p-4 rounded-xl border border-neutral-800 bg-neutral-900/30">
          <Select
            id="default-model"
            name="default-model"
            label="Default Model"
            list={MODELS}
            onChange={handleInputChange}
            value={currentModelLabel}
          />
          <ThemeSelect
            themes={THEMES}
            activeTheme={activeTheme}
            onClick={handleChangeTheme}
          />
        </div>
      </div>

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
          onClick={handleOnSave}
        >
          {loading ? "Saving..." : isSaved ? "Saved!" : "Save Changes"}
        </PrimaryButton>
      </motion.div>
    </div>
  );
}

export default GeneralSettingsPage;
