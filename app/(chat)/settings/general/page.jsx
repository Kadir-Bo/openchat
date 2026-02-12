"use client";

import React, { useState } from "react";
import { useAuth } from "@/context";
import { MODELS, THEMES } from "@/lib";
import {
  SettingsInput,
  SettingsSelect,
  SettingsTextarea,
  SettingsThemes,
} from "@/components";

function GeneralSettingsPage() {
  const { user } = useAuth();
  const [fullName, setFullName] = useState(user.displayName || "");
  const [modelPreferences, setModelPreferences] = useState("");
  // Get from database
  const [userDefaultModel, setUserDefaultModel] = useState(MODELS[0].select);
  const [activeTheme, setActiveTheme] = useState("auto");

  const handleFullNameOnChange = (e) => {
    setFullName(e.target.value);
  };
  const handlePreferencesOnChange = (e) => {
    setModelPreferences(e.target.value);
  };
  const handleSelectModelOnChange = (model) => {
    setUserDefaultModel(model);
  };
  const handleChangeTheme = (theme) => {
    setActiveTheme(theme);
  };
  const TextareaPlaceholderExamples = [
    "Ask clarifying questions before answering...",
    "Be concise and to the point...",
    "Provide detailed explanations with examples...",
    "Use a casual and friendly tone...",
    "Focus on practical, actionable advice...",
  ];

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-5">
        <h4 className="font-medium">Profile</h4>
        <div className="flex items-start justify-between gap-6">
          <SettingsInput
            label="What would you like to be called?"
            value={fullName}
            onChange={handleFullNameOnChange}
            id="full-name"
            placeholder="No Name yet..."
          />
          <SettingsInput
            label="Email"
            value={user?.email || ""}
            onChange={() => {}}
            id="username"
            placeholder="email@example.com"
            disabled
          />
        </div>
        <SettingsTextarea
          label="What personal preferences should Claude consider in responses?"
          value={modelPreferences}
          onChange={handlePreferencesOnChange}
          id="preferences"
          placeholder={TextareaPlaceholderExamples}
          InputClassName="min-h-32"
        />
      </div>
      <hr className="text-neutral-700" />
      <div className="flex flex-col gap-5">
        <h4 className="font-medium mb-4">Preferences</h4>
        <SettingsSelect
          label="Default Model"
          list={MODELS}
          onChange={handleSelectModelOnChange}
          value={userDefaultModel}
        />
        <SettingsThemes
          themes={THEMES}
          activeTheme={activeTheme}
          onClick={handleChangeTheme}
        />
      </div>
    </div>
  );
}

export default GeneralSettingsPage;
