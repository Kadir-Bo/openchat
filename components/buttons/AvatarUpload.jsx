"use client";
import { useEffect, useRef, useState } from "react";
import { Camera, X } from "react-feather";
import { Icon, UserProfileImage } from "@/components";

export default function AvatarUpload({ currentUrl, displayName, onChange }) {
  const fileInputRef = useRef(null);
  const [preview, setPreview] = useState(currentUrl || null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    setPreview(currentUrl || null);
  }, [currentUrl]);

  const handleFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target.result);
      onChange(file, e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    setPreview(null);
    onChange(null, null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="flex items-center gap-5">
      {/* Avatar with interaction layer */}
      <div
        className={`relative group cursor-pointer shrink-0 rounded-full border-2 transition-colors ${
          isDragging
            ? "border-neutral-400 bg-neutral-700"
            : "border-neutral-700 hover:border-neutral-500"
        }`}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <UserProfileImage image={preview} username={displayName} size="lg" />

        {/* Hover overlay */}
        <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <Icon name={Camera} size="sm" className="text-white" />
        </div>

        {/* Remove button */}
        {preview && (
          <button
            onClick={handleRemove}
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-neutral-700 border border-neutral-600 flex items-center justify-center hover:bg-neutral-600 transition-colors z-10"
          >
            <Icon name={X} size="sm" className="text-neutral-300" />
          </button>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <p className="text-sm text-neutral-300">Profile photo</p>
        <p className="text-xs text-neutral-500">
          Click or drag an image to upload. JPG, PNG, GIF up to 5MB.
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  );
}
