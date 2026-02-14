"use client";

import React, { useState } from "react";
import { useAuth } from "@/context";
import { MODELS, THEMES } from "@/lib";
import {
  Input,
  PrimaryButton,
  Select,
  Textarea,
  ThemeSelect,
} from "@/components";

function GeneralSettingsPage() {
  const { user } = useAuth();
  const [fullName, setFullName] = useState(user.displayName || "");
  const [modelPreferences, setModelPreferences] = useState("");
  const [userDefaultModel, setUserDefaultModel] = useState(MODELS[0].id);
  const [activeTheme, setActiveTheme] = useState("auto");

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "full-name") {
      setFullName(value);
    } else if (name === "preferences") {
      setModelPreferences(value);
    } else if (name === "default-model") {
      setUserDefaultModel(value);
    }
  };

  const handleChangeTheme = (theme) => {
    setActiveTheme(theme);
  };

  const handleOnSave = () => {};
  const TextareaPlaceholderExamples = [
    "Ask clarifying questions before answering...",
    "Be concise and to the point...",
    "Provide detailed explanations with examples...",
    "Use a casual and friendly tone...",
    "Focus on practical, actionable advice...",
  ];

  // Find the current model label for display
  const currentModelLabel =
    MODELS.find((m) => m.id === userDefaultModel)?.label || userDefaultModel;

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-5">
        <h4 className="font-medium">Profile</h4>
        <div className="flex items-start justify-between gap-6">
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
      <hr className="text-neutral-700" />
      <div className="flex flex-col gap-5">
        <h4 className="font-medium mb-4">Preferences</h4>
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
  );
}

export default GeneralSettingsPage;
