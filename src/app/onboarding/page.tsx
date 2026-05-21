"use client";

import React, { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";
import Wordmark from "@/components/Wordmark";
import { Upload, LogOut, User, Phone, Check } from "lucide-react";

export default function OnboardingPage() {
  const user = useQuery(api.users.viewer);
  const updateProfileMutation = useMutation(api.users.updateProfile);
  const generateUploadUrlMutation = useMutation(api.users.generateUploadUrl);
  const { signOut } = useAuthActions();
  const router = useRouter();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Prefill name if available
  useEffect(() => {
    if (user) {
      if (user.profileSetupComplete) {
        // Redirect to dashboard if onboarding is already completed
        if (user.role === "owner" || user.role === "manager") {
          router.replace("/manager");
        } else {
          router.replace("/worker");
        }
      } else {
        if (user.name) setName(user.name);
        if (user.phone) setPhone(user.phone);
      }
    }
  }, [user, router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!phone.trim()) {
      setError("Please enter your staff phone number.");
      return;
    }

    setLoading(true);
    try {
      let storageId: string | undefined = undefined;

      if (selectedFile) {
        // Step 1: Get upload URL from Convex
        const uploadUrl = await generateUploadUrlMutation();

        // Step 2: Upload file to storage URL
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

      // Step 3: Call profile update mutation
      await updateProfileMutation({
        name: name.trim(),
        phone: phone.trim(),
        image: storageId,
      });

      // Step 4: Redirect to home page
      router.push("/");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to update profile. Please try again.");
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/signin");
    } catch (err) {
      console.error("[Auth] Onboarding sign out failed:", err);
    }
  };

  if (user === undefined) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center font-sans text-[#4B5563]">
        <div className="text-center space-y-2">
          <span className="body-small block">Verifying registry authorization...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-screen bg-white flex flex-col md:flex-row font-sans text-black overflow-x-hidden selection:bg-[#E8F0FE]">
      {/* Left side info block */}
      <div className="hidden md:flex md:w-1/2 bg-[#1A56DB] items-center justify-center p-12 text-white">
        <div className="max-w-[400px] space-y-6">
          <Wordmark size={36} tone="white" />
          <div className="h-[2px] w-12 bg-white/20" />
          <h2 className="text-white text-2xl font-bold font-sans">
            Staff Registry Configuration
          </h2>
          <p className="text-white/80 text-sm leading-relaxed">
            Welcome to the Elfam operations portal. Before accessing the dashboards, please complete your staff registry details and upload a profile identification photo.
          </p>
          <div className="space-y-3 pt-4">
            <div className="flex items-center gap-3 text-xs text-white/90">
              <span className="h-5 w-5 bg-white/10 flex items-center justify-center border border-white/20">
                <Check className="h-3 w-3" />
              </span>
              <span>Establish unique worker identity record</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-white/90">
              <span className="h-5 w-5 bg-white/10 flex items-center justify-center border border-white/20">
                <Check className="h-3 w-3" />
              </span>
              <span>Register contact phone for operational dispatch</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-white/90">
              <span className="h-5 w-5 bg-white/10 flex items-center justify-center border border-white/20">
                <Check className="h-3 w-3" />
              </span>
              <span>Upload profile identification image (PFP)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side form */}
      <div className="flex-1 bg-white flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-[400px] space-y-6">
          <div className="md:hidden text-center pb-2">
            <Wordmark size={32} tone="blue" />
          </div>

          <div>
            <span className="label text-[#4B5563] block mb-1">Onboarding Setup</span>
            <h2 className="text-xl font-bold text-black">Complete Your Profile</h2>
            <p className="text-xs text-[#4B5563] mt-1">
              Set up your profile credentials for the <strong>{user?.role}</strong> portal.
            </p>
          </div>

          {error && (
            <div className="border border-[#FFBDAD] text-[#D93025] text-xs p-3 rounded-[4px]">
              [Error] {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* PFP Upload Section */}
            <div className="space-y-2">
              <label className="label text-[#4B5563] font-bold block">Profile Identification Photo</label>
              <div 
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border border-dashed border-gray-200 hover:border-[#1A56DB] bg-white p-4 text-center cursor-pointer transition-colors flex flex-col items-center justify-center space-y-2 group"
              >
                <input 
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
                
                {previewUrl ? (
                  <div className="relative h-20 w-20 border border-gray-200 overflow-hidden bg-gray-50">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={previewUrl} 
                      alt="PFP Preview" 
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-12 w-12 bg-gray-50 border border-gray-200 flex items-center justify-center text-[#4B5563] group-hover:text-[#1A56DB] group-hover:border-[#1A56DB] transition-colors">
                    <Upload className="h-5 w-5" />
                  </div>
                )}
                
                <div>
                  <span className="body-small font-bold text-black block">
                    {selectedFile ? selectedFile.name : "Click or drag photo here"}
                  </span>
                  <span className="text-[11px] text-[#4B5563] block mt-0.5">
                    PNG, JPG or WEBP (Max 5MB)
                  </span>
                </div>
              </div>
            </div>

            {/* Name Input */}
            <div className="space-y-1">
              <label htmlFor="name-input" className="label text-[#4B5563] font-bold block">
                Full Name
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4B5563]">
                  <User className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  id="name-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="e.g. Margaret Chebet"
                  className="input-field pl-10"
                />
              </div>
            </div>

            {/* Phone Input */}
            <div className="space-y-1">
              <label htmlFor="phone-input" className="label text-[#4B5563] font-bold block">
                Staff Phone Number
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4B5563]">
                  <Phone className="h-4 w-4" />
                </span>
                <input
                  type="tel"
                  id="phone-input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  placeholder="e.g. +254 712 345678"
                  className="input-field pl-10"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:opacity-50 h-10 text-xs uppercase tracking-wider font-bold"
            >
              {loading ? "Registering Profile..." : "Complete Profile setup"}
            </button>
          </form>

          <div className="pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 h-9 border border-gray-200 text-[#4B5563] text-[12px] font-bold hover:bg-gray-50 hover:text-black transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign Out from Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
