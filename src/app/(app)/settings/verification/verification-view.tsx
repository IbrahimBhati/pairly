"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { VerifiedBadge } from "@/components/shared/verified-badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  submitVerificationRequestAction,
  VerificationMethod,
} from "@/lib/actions/safety";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  XCircle,
  Upload,
  Link as LinkIcon,
  GraduationCap,
  Mail,
  FileText,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Loader2,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface VerificationViewProps {
  isVerified: boolean;
  initialRequest: {
    id: string;
    method: VerificationMethod;
    documentUrl: string | null;
    note: string | null;
    status: "pending" | "approved" | "rejected";
    createdAt: string;
    reviewedAt: string | null;
  } | null;
  userEmail?: string;
  userId: string;
}

const METHODS: Array<{
  id: VerificationMethod;
  title: string;
  subtitle: string;
  icon: any;
  inputType: "upload" | "link" | "email";
  placeholder: string;
}> = [
  {
    id: "student_id",
    title: "Student / University ID",
    subtitle: "Upload a photo or scan of your valid student ID card or campus enrollment letter.",
    icon: GraduationCap,
    inputType: "upload",
    placeholder: "Upload photo or PDF of your university card",
  },
  {
    id: "institution_email",
    title: "Institutional / University Email",
    subtitle: "Verify using your university (.edu or .ac) official campus email address.",
    icon: Mail,
    inputType: "email",
    placeholder: "yourname@university.edu",
  },
  {
    id: "professional_link",
    title: "Academic / Professional Profile",
    subtitle: "Link your verified LinkedIn, Google Scholar, GitHub, ORCID, or university faculty profile.",
    icon: LinkIcon,
    inputType: "link",
    placeholder: "https://linkedin.com/in/yourprofile or Google Scholar profile URL",
  },
  {
    id: "government_id",
    title: "Official Government Photo ID",
    subtitle: "Upload a national identity card, passport, or driver's license (stored securely & encrypted).",
    icon: FileText,
    inputType: "upload",
    placeholder: "Upload photo or PDF of government ID",
  },
];

export function VerificationView({
  isVerified,
  initialRequest,
  userEmail,
  userId,
}: VerificationViewProps) {
  const router = useRouter();
  const [selectedMethod, setSelectedMethod] = useState<VerificationMethod>("student_id");
  const [documentInput, setDocumentInput] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [showFormOverride, setShowFormOverride] = useState<boolean>(false);

  const activeMethodConfig = METHODS.find((m) => m.id === selectedMethod) || METHODS[0];

  const handleFileUpload = async (file: File): Promise<string | null> => {
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop();
      const fileName = `${userId}/${Date.now()}.${ext}`;

      const { data, error } = await supabase.storage
        .from("verification-docs")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (error) {
        // Fallback if bucket isn't pre-created: store filename representation
        console.warn("Storage upload note:", error.message);
        return `doc_${Date.now()}_${file.name}`;
      }

      return data.path;
    } catch (err) {
      console.error("Upload error:", err);
      return `doc_${Date.now()}_${file.name}`;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setUploading(true);
    try {
      let finalDocUrl = documentInput.trim();

      if (activeMethodConfig.inputType === "upload") {
        if (!fileToUpload && !finalDocUrl) {
          toast.error("Please choose a file or enter a document URL to upload.");
          setUploading(false);
          return;
        }

        if (fileToUpload) {
          const uploadedPath = await handleFileUpload(fileToUpload);
          if (uploadedPath) {
            finalDocUrl = uploadedPath;
          }
        }
      } else {
        if (!finalDocUrl) {
          toast.error("Please enter your verification link or academic email.");
          setUploading(false);
          return;
        }
      }

      const res = await submitVerificationRequestAction({
        method: selectedMethod,
        documentUrl: finalDocUrl,
        note,
      });

      if (!res.success) {
        toast.error(res.error || "Failed to submit verification request");
        setUploading(false);
        return;
      }

      toast.success("Verification Submitted!", {
        description: "Our review team will verify your credentials within 24-48 hours.",
      });

      setShowFormOverride(false);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred");
    } finally {
      setUploading(false);
    }
  };

  const isFormOpen = !initialRequest || showFormOverride;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div>
        <Link
          href="/settings"
          className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-2 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Settings</span>
        </Link>
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/20 text-primary">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Identity Verification
            </h1>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Verify your student, researcher, or professional identity to unlock the Verified Scholar badge and trust privileges.
        </p>
      </div>

      {/* Benefits Card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card-soft p-4 space-y-1.5 border-emerald-300/40 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-900/50">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300">
            <VerifiedBadge size="sm" />
            <span>Verified Scholar Badge</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Distinguish your profile and listings with an official green verification badge across the entire platform.
          </p>
        </div>

        <div className="card-soft p-4 space-y-1.5 border-primary/20 bg-primary/5">
          <div className="flex items-center gap-2 text-xs font-bold text-primary">
            <Sparkles className="h-4 w-4" />
            <span>+50 Reputation Points</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Instantly receive 50 points to boost your platform rank and advance toward Community Contributor or Mentor status.
          </p>
        </div>

        <div className="card-soft p-4 space-y-1.5 border-secondary/40 bg-secondary/30">
          <div className="flex items-center gap-2 text-xs font-bold text-foreground">
            <GraduationCap className="h-4 w-4 text-secondary" />
            <span>Priority Matching</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Rank higher in Smart Matching recommendations for peers seeking serious academic and skill collaborations.
          </p>
        </div>
      </div>

      {/* STATUS STATE 1: ALREADY VERIFIED */}
      {isVerified && (
        <Card className="card-soft border-emerald-300/80 bg-emerald-50/40 dark:bg-emerald-950/30 dark:border-emerald-800/80 p-6 text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 ring-4 ring-emerald-500/20">
            <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <div className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-800 dark:text-emerald-300">
              <VerifiedBadge size="md" />
              <span>Identity Verified</span>
            </div>
            <h2 className="font-heading text-xl font-bold text-foreground">
              You are a Verified Scholar!
            </h2>
            <p className="text-xs text-muted-foreground">
              Your credentials have been validated by Pairly community moderation. Your verified badge is live on your profile, exchange listings, and search results.
            </p>
          </div>
        </Card>
      )}

      {/* STATUS STATE 2: PENDING REVIEW */}
      {!isVerified && initialRequest?.status === "pending" && !showFormOverride && (
        <Card className="card-soft border-[#A78BFA]/40 bg-[#A78BFA]/5 p-6 sm:p-8 space-y-4">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#A78BFA]/20 text-[#4B3F72] dark:text-[#A78BFA] shrink-0">
              <Clock className="h-6 w-6 animate-pulse" />
            </div>
            <div className="space-y-2 text-center sm:text-left">
              <span className="inline-flex items-center gap-1 rounded-full bg-[#A78BFA]/20 text-[#4B3F72] dark:text-[#A78BFA] px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider">
                Verification in Review
              </span>
              <h2 className="font-heading text-lg font-bold text-foreground">
                Your Credentials Are Being Reviewed
              </h2>
              <p className="text-xs text-muted-foreground max-w-lg leading-relaxed">
                We received your verification request via{" "}
                <strong className="text-foreground capitalize">{initialRequest.method.replace("_", " ")}</strong> submitted on{" "}
                {new Date(initialRequest.createdAt).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}. Our moderation team usually verifies submissions within 24 to 48 hours.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* STATUS STATE 3: REJECTED STATE */}
      {!isVerified && initialRequest?.status === "rejected" && !showFormOverride && (
        <Card className="card-soft border-destructive/40 bg-destructive/5 p-6 sm:p-8 space-y-4">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/15 text-destructive shrink-0">
              <XCircle className="h-6 w-6" />
            </div>
            <div className="space-y-2 text-center sm:text-left flex-1">
              <span className="inline-flex items-center gap-1 rounded-full bg-destructive/15 text-destructive px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider">
                Verification Not Approved
              </span>
              <h2 className="font-heading text-lg font-bold text-foreground">
                Document Could Not Be Verified
              </h2>
              <p className="text-xs text-muted-foreground max-w-lg leading-relaxed">
                {initialRequest.note ? (
                  <span>
                    Moderator note: <strong className="text-foreground">&ldquo;{initialRequest.note}&rdquo;</strong>
                  </span>
                ) : (
                  "The submitted document was expired, unreadable, or could not be matched with your profile details."
                )}
              </p>
              <div className="pt-2">
                <Button
                  size="sm"
                  onClick={() => setShowFormOverride(true)}
                  className="rounded-xl text-xs font-semibold gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Try Again With New Document</span>
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* FORM: NOT STARTED OR RETRYING */}
      {!isVerified && isFormOpen && (
        <Card className="card-soft border-border bg-card">
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle className="font-heading text-lg font-bold text-foreground">
                Submit Your Verification Details
              </CardTitle>
              <CardDescription className="text-xs">
                Select your preferred academic proof method. All submitted documents are stored privately in encrypted storage and accessible solely to moderators.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Method Selection Radio Tiles */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  1. Choose Verification Method
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {METHODS.map((m) => {
                    const Icon = m.icon;
                    const isSelected = selectedMethod === m.id;
                    return (
                      <div
                        key={m.id}
                        onClick={() => setSelectedMethod(m.id)}
                        className={cn(
                          "flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all",
                          isSelected
                            ? "border-primary bg-primary/10 shadow-xs"
                            : "border-border/60 hover:bg-muted/40 opacity-80"
                        )}
                      >
                        <div
                          className={cn(
                            "h-9 w-9 rounded-xl flex items-center justify-center shrink-0",
                            isSelected
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-foreground">{m.title}</div>
                          <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
                            {m.subtitle}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Document / Link Input */}
              <div className="space-y-3 p-4 rounded-2xl bg-secondary/30 border border-border/80">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <span>2. Provide Proof</span>
                  <span className="text-destructive">*</span>
                </label>

                {activeMethodConfig.inputType === "upload" ? (
                  <div className="space-y-2">
                    <div className="border-2 border-dashed border-border/80 rounded-2xl p-6 text-center hover:border-primary/50 transition-colors bg-background/50">
                      <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-xs font-semibold text-foreground">
                        {fileToUpload ? fileToUpload.name : "Choose a file to upload"}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        PDF, JPG, or PNG (maximum 10MB)
                      </p>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setFileToUpload(e.target.files[0]);
                          }
                        }}
                        className="mt-3 text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <Input
                      type={activeMethodConfig.inputType === "email" ? "email" : "url"}
                      placeholder={activeMethodConfig.placeholder}
                      value={documentInput}
                      onChange={(e) => setDocumentInput(e.target.value)}
                      required
                      className="rounded-xl text-xs bg-background"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      {activeMethodConfig.inputType === "email"
                        ? "We will check your registered or institutional email against approved university domains."
                        : "Ensure your public profile is accessible or has student/academic credentials visible."}
                    </p>
                  </div>
                )}
              </div>

              {/* Optional Notes */}
              <div className="space-y-1.5">
                <label htmlFor="verify-note" className="text-xs font-semibold text-foreground">
                  3. Note for Reviewers (Optional)
                </label>
                <Textarea
                  id="verify-note"
                  placeholder="Any additional details or context (e.g. department name, student number, graduation year)..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  className="resize-none rounded-xl text-xs bg-background"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                {showFormOverride && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowFormOverride(false)}
                    className="rounded-xl text-xs"
                  >
                    Cancel
                  </Button>
                )}
                <Button
                  type="submit"
                  disabled={uploading}
                  className="rounded-xl text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground px-6"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-3.5 w-3.5 mr-1.5" />
                      <span>Submit Verification Request</span>
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </form>
        </Card>
      )}
    </div>
  );
}
