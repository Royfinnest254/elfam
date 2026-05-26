"use client";

import React, { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";
import Wordmark from "@/components/Wordmark";
import { Upload, LogOut, User, Phone, Check, ChevronRight, ChevronLeft, ArrowRight, ShieldCheck, Sprout } from "lucide-react";

// Inline SVG avatars representing local agribusiness roles
const AVATARS = [
  {
    id: "avatar:highland_farmer",
    name: "Highland Farmer",
    desc: "Mixed agriculture specialist",
    svg: (
      <svg className="w-12 h-12" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="48" height="48" fill="#1f3a2e"/>
        <path d="M24 12C20.6863 12 18 14.6863 18 18C18 21.3137 20.6863 24 24 24C27.3137 24 30 21.3137 30 18C30 14.6863 27.3137 12 24 12Z" fill="#f5f2e3"/>
        <path d="M12 36C12 29.3726 17.3726 24 24 24C30.6274 24 36 29.3726 36 36" stroke="#f5f2e3" strokeWidth="3" strokeLinecap="round"/>
        <path d="M24 6L14 12V14H34V12L24 6Z" fill="#6b8e5a"/>
      </svg>
    )
  },
  {
    id: "avatar:dairy_specialist",
    name: "Dairy Specialist",
    desc: "Livestock & milking systems",
    svg: (
      <svg className="w-12 h-12" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="48" height="48" fill="#f5f2e3"/>
        <path d="M24 14C20.6863 14 18 16.6863 18 20C18 23.3137 20.6863 26 24 26C27.3137 26 30 23.3137 30 20C30 16.6863 27.3137 14 24 14Z" fill="#1f3a2e"/>
        <path d="M14 38C14 31.3726 19.3726 26 26 26C32.6274 26 38 31.3726 38 38" stroke="#1f3a2e" strokeWidth="3" strokeLinecap="round"/>
        <circle cx="12" cy="14" r="3" fill="#6b8e5a"/>
        <circle cx="36" cy="12" r="2.5" fill="#6b8e5a"/>
      </svg>
    )
  },
  {
    id: "avatar:cereal_agronomist",
    name: "Cereal Agronomist",
    desc: "Barley & wheat specialist",
    svg: (
      <svg className="w-12 h-12" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="48" height="48" fill="#1f3a2e"/>
        <path d="M24 15C21.2386 15 19 17.2386 19 20C19 22.7614 21.2386 25 24 25C26.7614 25 29 22.7614 29 20C29 17.2386 26.7614 15 24 15Z" fill="#6b8e5a"/>
        <path d="M24 25V39M20 29L24 33M28 31L24 35" stroke="#f5f2e3" strokeWidth="3" strokeLinecap="round"/>
        <path d="M15 15C18 17 21 17 24 15C27 17 30 17 33 15" stroke="#6b8e5a" strokeWidth="2"/>
      </svg>
    )
  },
  {
    id: "avatar:beekeeper_pioneer",
    name: "Beekeeper Pioneer",
    desc: "Apiculture & honey tracking",
    svg: (
      <svg className="w-12 h-12" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="48" height="48" fill="#f5f2e3"/>
        <path d="M24 14C21.2386 14 19 16.2386 19 19C19 21.7614 21.2386 24 24 24C26.7614 24 29 21.7614 29 19C29 16.2386 26.7614 14 24 14Z" fill="#1f3a2e"/>
        <path d="M12 36C12 30.4772 17.3726 26 24 26C30.6274 26 36 30.4772 36 36" fill="#1f3a2e"/>
        <path d="M18 10H30V13H18V10Z" fill="#6b8e5a"/>
        <circle cx="24" cy="20" r="1.5" fill="#f5f2e3"/>
      </svg>
    )
  }
];

export default function OnboardingPage() {
  const user = useQuery(api.users.viewer);
  const updateProfileMutation = useMutation(api.users.updateProfile);
  const generateUploadUrlMutation = useMutation(api.users.generateUploadUrl);
  const { signOut } = useAuthActions();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  
  // Avatar selection state: either a selected avatar id or custom file
  const [selectedAvatarId, setSelectedAvatarId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Prefill details if user info loads
  useEffect(() => {
    if (user) {
      if (user.profileSetupComplete) {
        if (user.role === "supervisor") {
          router.replace("/owner");
        } else if (user.role === "manager") {
          router.replace("/manager");
        } else {
          router.replace("/worker");
        }
      } else {
        if (user.name) setName(user.name);
        if (user.phone) setPhone(user.phone);
        if (user.image && user.image.startsWith("avatar:")) {
          setSelectedAvatarId(user.image);
        }
      }
    }
  }, [user, router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setSelectedAvatarId(null); // Deselect preset avatars
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handlePresetSelect = (avatarId: string) => {
    setSelectedAvatarId(avatarId);
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const handleNextStep = () => {
    setError(null);
    if (step === 1) {
      if (!name.trim()) {
        setError("Please enter your full name.");
        return;
      }
      if (!phone.trim()) {
        setError("Please enter your phone number.");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!selectedAvatarId && !selectedFile) {
        setError("Please select an avatar or upload an identification photo.");
        return;
      }
      setStep(3);
    }
  };

  const handlePrevStep = () => {
    setError(null);
    setStep(step - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let imageValue: string | undefined = undefined;

      if (selectedFile) {
        // Custom upload
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
        imageValue = data.storageId;
      } else if (selectedAvatarId) {
        // Preset avatar selection
        imageValue = selectedAvatarId;
      }

      await updateProfileMutation({
        name: name.trim(),
        phone: phone.trim(),
        image: imageValue,
      });

      // Redirect to correct dashboard
      if (user?.role === "supervisor") {
        router.push("/owner");
      } else if (user?.role === "manager") {
        router.push("/manager");
      } else {
        router.push("/worker");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to finalize profile registry.");
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/signin");
    } catch (err) {
      console.error("[Auth] Sign out failed:", err);
    }
  };

  if (user === undefined) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center font-sans text-muted">
        <div className="text-center space-y-2">
          <span className="body-small block">Verifying registry authorization...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-screen bg-paper flex flex-col md:flex-row font-sans text-ink selection:bg-cream overflow-y-auto">
      {/* Left branding panel */}
      <div className="hidden md:flex md:w-1/2 bg-moss items-center justify-center p-12 text-cream border-r border-rule">
        <div className="max-w-[420px] space-y-8">
          <Wordmark size={42} tone="cream" />
          <div className="h-[1px] w-16 bg-cream/30" />
          <div className="space-y-4">
            <h2 className="text-3xl font-display font-medium text-cream leading-tight">
              Agribusiness Staff Registry
            </h2>
            <p className="text-cream/80 text-sm leading-relaxed font-sans">
              Welcome to the Elfam operations portal. Follow the steps to set up your profile details, avatar, and verify your gateway access permissions.
            </p>
          </div>

          {/* Stepper visual */}
          <div className="space-y-4 pt-6">
            <div className="flex items-center gap-4">
              <span className={`h-8 w-8 flex items-center justify-center border font-mono text-xs ${step >= 1 ? "bg-cream text-moss border-cream" : "border-cream/40 text-cream/40"}`}>
                01
              </span>
              <span className={`text-xs uppercase tracking-wider font-bold ${step === 1 ? "text-cream" : "text-cream/50"}`}>
                Personal Registry details
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className={`h-8 w-8 flex items-center justify-center border font-mono text-xs ${step >= 2 ? "bg-cream text-moss border-cream" : "border-cream/40 text-cream/40"}`}>
                02
              </span>
              <span className={`text-xs uppercase tracking-wider font-bold ${step === 2 ? "text-cream" : "text-cream/50"}`}>
                Agribusiness Avatar selection
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className={`h-8 w-8 flex items-center justify-center border font-mono text-xs ${step >= 3 ? "bg-cream text-moss border-cream" : "border-cream/40 text-cream/40"}`}>
                03
              </span>
              <span className={`text-xs uppercase tracking-wider font-bold ${step === 3 ? "text-cream" : "text-cream/50"}`}>
                Gateway Permissions review
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Right onboarding wizard content */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-[420px] space-y-6">
          <div className="md:hidden text-center pb-2">
            <Wordmark size={36} tone="moss" />
          </div>

          {/* Form container */}
          <div className="bg-paper border border-rule p-8 space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-rule">
              <div>
                <span className="text-xs-label block">Step {step} of 3</span>
                <h3 className="text-lg font-display text-ink mt-0.5">
                  {step === 1 && "Personal Credentials"}
                  {step === 2 && "Identity Illustration"}
                  {step === 3 && "Portal Authorization"}
                </h3>
              </div>
              <span className="text-xs font-mono bg-cream text-moss px-2 py-0.5 border border-moss">
                {user?.role?.toUpperCase()} PORTAL
              </span>
            </div>

            {error && (
              <div className="border border-alert bg-[#fdf2f0] text-alert text-xs p-3 font-mono">
                [Setup Error] {error}
              </div>
            )}

            {/* STEP 1: Details */}
            {step === 1 && (
              <div className="space-y-4">
                <p className="text-xs text-muted leading-relaxed">
                  Please enter your real full name and operational phone number. This information is indexed in the staff directory for coordination.
                </p>
                <div className="space-y-1">
                  <label htmlFor="name-field" className="label text-xs-label block">Full Name</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
                      <User className="h-4 w-4" />
                    </span>
                    <input
                      type="text"
                      id="name-field"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Margaret Chebet"
                      className="input-field pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label htmlFor="phone-field" className="label text-xs-label block">Operational Phone Number</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
                      <Phone className="h-4 w-4" />
                    </span>
                    <input
                      type="tel"
                      id="phone-field"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. +254 712 345678"
                      className="input-field pl-10"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Avatars / Upload */}
            {step === 2 && (
              <div className="space-y-4">
                <p className="text-xs text-muted leading-relaxed">
                  Choose a signature agribusiness illustration avatar, or upload a custom identification photograph.
                </p>

                {/* Grid of presets */}
                <div className="grid grid-cols-2 gap-3">
                  {AVATARS.map((av) => {
                    const isSelected = selectedAvatarId === av.id;
                    return (
                      <button
                        type="button"
                        key={av.id}
                        onClick={() => handlePresetSelect(av.id)}
                        className={`p-3 border text-left flex items-start gap-3 transition-colors ${isSelected ? "border-moss bg-cream" : "border-rule bg-paper hover:bg-paper-2"}`}
                      >
                        <div className="shrink-0 border border-rule overflow-hidden">
                          {av.svg}
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-ink block truncate">{av.name}</span>
                          <span className="text-[10px] text-muted block leading-tight">{av.desc}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-rule"></div>
                  <span className="flex-shrink mx-4 text-[10px] text-muted uppercase font-bold tracking-wider">Or Upload Custom Photo</span>
                  <div className="flex-grow border-t border-rule"></div>
                </div>

                {/* Upload button */}
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={`border border-dashed p-4 text-center cursor-pointer transition-colors flex flex-col items-center justify-center space-y-2 ${selectedFile ? "border-moss bg-cream" : "border-rule hover:border-moss bg-paper"}`}
                >
                  <input 
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                  {previewUrl ? (
                    <div className="relative h-14 w-14 border border-rule overflow-hidden bg-paper-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={previewUrl} alt="Upload Preview" className="h-full w-full object-cover" />
                    </div>
                  ) : (
                    <Upload className="h-5 w-5 text-muted" />
                  )}
                  <div>
                    <span className="text-xs font-bold text-ink block">
                      {selectedFile ? selectedFile.name : "Select raw photo file"}
                    </span>
                    <span className="text-[10px] text-muted block">PNG, JPG, WEBP (Max 5MB)</span>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Verification */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="bg-cream border border-moss p-4 space-y-3">
                  <div className="flex items-center gap-3 text-moss">
                    <ShieldCheck className="h-5 w-5 shrink-0" />
                    <span className="text-xs font-bold uppercase tracking-wider">Registry Credentials Verified</span>
                  </div>
                  <div className="text-xs text-ink/90 leading-relaxed font-mono">
                    <div>[NAME]: {name}</div>
                    <div>[TEL ]: {phone}</div>
                    <div>[ROLE]: {user?.role?.toUpperCase()}</div>
                    <div>[AVATAR]: {selectedAvatarId ? selectedAvatarId.split(":")[1] : "Custom image file"}</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="label text-xs-label block">Associated Clearances</span>
                  <ul className="space-y-2 text-xs text-muted list-none pl-0">
                    {user?.role === "supervisor" && (
                      <>
                        <li className="flex items-start gap-2">
                          <Check className="h-3.5 w-3.5 text-pasture shrink-0 mt-0.5" />
                          <span>Full agribusiness ledger control & reports access</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="h-3.5 w-3.5 text-pasture shrink-0 mt-0.5" />
                          <span>Staff management and supervisor dispatch operations</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="h-3.5 w-3.5 text-pasture shrink-0 mt-0.5" />
                          <span>Agribusiness parameters management (Danger zone wiping)</span>
                        </li>
                      </>
                    )}
                    {user?.role === "manager" && (
                      <>
                        <li className="flex items-start gap-2">
                          <Check className="h-3.5 w-3.5 text-pasture shrink-0 mt-0.5" />
                          <span>Add, update, and manage livestock and group records</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="h-3.5 w-3.5 text-pasture shrink-0 mt-0.5" />
                          <span>Milking logs, soil testing entries, and field operations</span>
                        </li>
                      </>
                    )}
                    {user?.role === "worker" && (
                      <>
                        <li className="flex items-start gap-2">
                          <Check className="h-3.5 w-3.5 text-pasture shrink-0 mt-0.5" />
                          <span>Log production yields (milk, eggs, wool, honey)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="h-3.5 w-3.5 text-pasture shrink-0 mt-0.5" />
                          <span>View tasks list assigned by management</span>
                        </li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            )}

            {/* Stepper buttons */}
            <div className="flex justify-between items-center pt-4 border-t border-rule gap-3">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="btn-secondary flex-1 flex items-center justify-center gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="btn-secondary flex-1 flex items-center justify-center gap-2 text-alert border-alert/20"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              )}

              {step < 3 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  Continue
                  <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  {loading ? "Registering..." : "Enter Portal"}
                  <Sprout className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
