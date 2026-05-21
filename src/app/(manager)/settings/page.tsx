"use client";

import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";
import { Upload, LogOut, Lock, ToggleLeft, ToggleRight, Check } from "lucide-react";

export default function SettingsPage() {
  const user = useQuery(api.users.viewer);
  const updateProfileMutation = useMutation(api.users.updateProfile);
  const generateUploadUrlMutation = useMutation(api.users.generateUploadUrl);
  const changePasswordMutation = useMutation(api.users.changePassword);
  const { signOut } = useAuthActions();
  const router = useRouter();

  // Profile fields
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Password fields
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Preferences (Local Storage persistent)
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [soundAlerts, setSoundAlerts] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name ?? "");
      setPhone(user.phone ?? "");
    }
  }, [user]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setEmailAlerts(localStorage.getItem("pref_email_alerts") !== "false");
      setSoundAlerts(localStorage.getItem("pref_sound_alerts") === "true");
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);

    if (!name.trim()) {
      setProfileError("Please enter your full name.");
      return;
    }
    if (!phone.trim()) {
      setProfileError("Please enter your phone number.");
      return;
    }

    setProfileLoading(true);
    try {
      let storageId: string | undefined = undefined;

      if (selectedFile) {
        const uploadUrl = await generateUploadUrlMutation();
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": selectedFile.type },
          body: selectedFile,
        });

        if (!result.ok) {
          throw new Error("Failed to upload profile picture.");
        }

        const data = await result.json();
        storageId = data.storageId;
      }

      await updateProfileMutation({
        name: name.trim(),
        phone: phone.trim(),
        image: storageId,
      });

      setProfileSuccess("PROFILE UPDATED SUCCESSFULLY");
      setSelectedFile(null);
    } catch (err: any) {
      console.error(err);
      setProfileError(err.message || "Failed to update profile details.");
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (password !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters long.");
      return;
    }

    setPasswordLoading(true);
    try {
      await changePasswordMutation({ password });
      setPasswordSuccess("PASSWORD UPDATED SUCCESSFULLY");
      setPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      console.error(err);
      setPasswordError(err.message || "Failed to update password.");
    } finally {
      setPasswordLoading(false);
    }
  };

  const toggleEmailPref = () => {
    const nextVal = !emailAlerts;
    setEmailAlerts(nextVal);
    localStorage.setItem("pref_email_alerts", String(nextVal));
  };

  const toggleSoundPref = () => {
    const nextVal = !soundAlerts;
    setSoundAlerts(nextVal);
    localStorage.setItem("pref_sound_alerts", String(nextVal));
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/signin");
    } catch (err) {
      console.error("[Auth] signOut failed:", err);
    }
  };

  if (user === undefined) {
    return (
      <div className="body-small text-[#4B5563] italic p-8 font-sans">
        Loading user settings...
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <header className="border-b border-gray-200 pb-4">
        <span className="label text-[#4B5563] block mb-1">
          System Config
        </span>
        <h2 className="text-xl font-bold text-black">
          User Settings
        </h2>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Profile Card */}
        <div className="border border-gray-200 bg-white p-6 space-y-4">
          <h3 className="border-b border-gray-200 pb-2 text-base font-bold text-black flex items-center justify-between">
            <span>Ledger Profile File</span>
            <span className="badge border-primary text-[#1A56DB] bg-[#E8F0FE] font-medium text-xs rounded-none">
              {user?.role ?? "—"}
            </span>
          </h3>

          {profileError && (
            <div className="border border-[#FFBDAD] text-[#D93025] text-xs p-3 rounded-none">
              [Error] {profileError}
            </div>
          )}

          {profileSuccess && (
            <div className="border border-[#ABF5D1] text-[#1E8E3E] text-[11px] uppercase tracking-wider font-semibold p-3 rounded-none">
              {profileSuccess}
            </div>
          )}

          <form onSubmit={handleProfileUpdate} className="space-y-4">
            {/* PFP Change Display */}
            <div className="flex items-center gap-4 border-b border-gray-100 pb-4">
              <div className="relative h-16 w-16 border border-gray-200 overflow-hidden shrink-0 bg-gray-50 flex items-center justify-center">
                {previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previewUrl} alt="PFP Preview" className="h-full w-full object-cover" />
                ) : user?.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.imageUrl} alt="PFP" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-lg font-bold text-black select-none">
                    {(user?.name ?? "U").charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="space-y-1">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-secondary h-8 text-xs font-bold border-gray-200 hover:bg-gray-50"
                >
                  <Upload className="h-3 w-3 mr-1 inline" />
                  Upload Photo
                </button>
                <p className="text-[10px] text-[#4B5563]">
                  PNG, JPG or WEBP. Max 5MB.
                </p>
              </div>
            </div>

            {/* Email - Read-only */}
            <div className="space-y-1">
              <label className="label text-[#4B5563] font-bold block text-xs">Email Address (Registry Primary)</label>
              <input
                type="text"
                disabled
                value={user?.email ?? ""}
                className="input-field bg-gray-50 text-[#4B5563] cursor-not-allowed border-gray-200 rounded-none"
              />
            </div>

            {/* Full Name */}
            <div className="space-y-1">
              <label htmlFor="edit-name-input" className="label text-[#4B5563] font-bold block text-xs">Full Name</label>
              <input
                type="text"
                id="edit-name-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="input-field rounded-none"
              />
            </div>

            {/* Phone */}
            <div className="space-y-1">
              <label htmlFor="edit-phone-input" className="label text-[#4B5563] font-bold block text-xs">Staff Phone Number</label>
              <input
                type="tel"
                id="edit-phone-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="input-field rounded-none"
              />
            </div>

            <button
              type="submit"
              disabled={profileLoading}
              className="btn-primary w-full disabled:opacity-50 h-9 text-xs uppercase tracking-wider font-bold rounded-none"
            >
              {profileLoading ? "Saving Details..." : "Save Profile Details"}
            </button>
          </form>
        </div>

        {/* Right column: Password & Preferences */}
        <div className="space-y-6">
          {/* Password Reset Card */}
          <div className="border border-gray-200 bg-white p-6 space-y-4">
            <h3 className="border-b border-gray-200 pb-2 text-base font-bold text-black">
              Change Access Password
            </h3>

            {passwordError && (
              <div className="border border-[#FFBDAD] text-[#D93025] text-xs p-3 rounded-none">
                [Error] {passwordError}
              </div>
            )}

            {passwordSuccess && (
              <div className="border border-[#ABF5D1] text-[#1E8E3E] text-[11px] uppercase tracking-wider font-semibold p-3 rounded-none">
                {passwordSuccess}
              </div>
            )}

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="space-y-1">
                <label
                  htmlFor="new-password"
                  className="label text-[#4B5563] font-bold block text-xs"
                >
                  New Password
                </label>
                <input
                  type="password"
                  id="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="input-field rounded-none"
                  placeholder="Minimum 6 characters"
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="confirm-password"
                  className="label text-[#4B5563] font-bold block text-xs"
                >
                  Confirm New Password
                </label>
                <input
                  type="password"
                  id="confirm-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="input-field rounded-none"
                  placeholder="Confirm password"
                />
              </div>

              <button
                type="submit"
                disabled={passwordLoading}
                className="btn-primary w-full disabled:opacity-50 h-9 text-xs uppercase tracking-wider font-bold rounded-none"
              >
                {passwordLoading ? "Updating Credentials..." : "Update Password"}
              </button>
            </form>
          </div>

          {/* Preferences Card */}
          <div className="border border-gray-200 bg-white p-6 space-y-4">
            <h3 className="border-b border-gray-200 pb-2 text-base font-bold text-black">
              System Preferences
            </h3>

            <div className="space-y-4">
              {/* Email Notifications */}
              <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                <div>
                  <span className="body-small font-bold text-black block">Email Alerts Dispatch</span>
                  <span className="text-[11px] text-[#4B5563] block">Receive daily milk audits and incident reports</span>
                </div>
                <button
                  type="button"
                  onClick={toggleEmailPref}
                  className="text-[#1A56DB] hover:opacity-80 transition-opacity p-1 cursor-pointer bg-transparent border-none"
                >
                  {emailAlerts ? (
                    <ToggleRight className="h-7 w-7" />
                  ) : (
                    <ToggleLeft className="h-7 w-7 text-gray-300" />
                  )}
                </button>
              </div>

              {/* Sound Alerts */}
              <div className="flex items-center justify-between py-1.5">
                <div>
                  <span className="body-small font-bold text-black block">Sound Notifications</span>
                  <span className="text-[11px] text-[#4B5563] block">Play alerts for critical livestock withholding warnings</span>
                </div>
                <button
                  type="button"
                  onClick={toggleSoundPref}
                  className="text-[#1A56DB] hover:opacity-80 transition-opacity p-1 cursor-pointer bg-transparent border-none"
                >
                  {soundAlerts ? (
                    <ToggleRight className="h-7 w-7" />
                  ) : (
                    <ToggleLeft className="h-7 w-7 text-gray-300" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Danger/Action Zone */}
      <div className="border-t border-gray-200 pt-4">
        <h3 className="label text-[#4B5563] font-bold mb-3">
          Session Terminate
        </h3>
        <button
          type="button"
          onClick={handleSignOut}
          className="btn-secondary h-9 border-[#FFBDAD] hover:bg-[#FFEBE6] text-[#D93025] text-xs font-bold rounded-none"
        >
          Sign Out of System
        </button>
      </div>
    </div>
  );
}
