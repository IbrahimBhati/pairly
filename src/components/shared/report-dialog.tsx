"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { submitReportAction, ReportReason } from "@/lib/actions/safety";
import { toast } from "sonner";
import { Flag, ShieldAlert, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportedUserId?: string;
  reportedUserName?: string;
  reportedListingId?: string;
  reportedListingTitle?: string;
}

const REPORT_REASONS: Array<{ id: ReportReason; label: string; description: string }> = [
  {
    id: "spam",
    label: "Spam or Advertising",
    description: "Commercial ads, unwanted links, or repetitive messages.",
  },
  {
    id: "harassment",
    label: "Harassment or Bullying",
    description: "Hostile, threatening, intimidating, or offensive behavior.",
  },
  {
    id: "inappropriate_content",
    label: "Inappropriate Content",
    description: "Sexually suggestive, violent, or culturally insensitive content.",
  },
  {
    id: "scam",
    label: "Scam or Fraud",
    description: "Requests for money, crypto, phishing links, or fraudulent offers.",
  },
  {
    id: "fake_profile",
    label: "Impersonation or Fake Profile",
    description: "Using false identity or misrepresenting academic qualifications.",
  },
  {
    id: "other",
    label: "Other Safety Violation",
    description: "Any other behavior violating Pairly community standards.",
  },
];

export function ReportDialog({
  open,
  onOpenChange,
  reportedUserId,
  reportedUserName,
  reportedListingId,
  reportedListingTitle,
}: ReportDialogProps) {
  const [reason, setReason] = React.useState<ReportReason>("spam");
  const [details, setDetails] = React.useState<string>("");
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!details.trim()) {
      toast.error("Please explain what happened in the details field.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await submitReportAction({
        reportedUserId,
        reportedListingId,
        reason,
        details,
      });

      if (!res.success) {
        toast.error(res.error || "Failed to submit report");
        setIsSubmitting(false);
        return;
      }

      toast.success("Report Submitted", {
        description: "Thank you for helping keep Pairly a safe academic community. Our moderation team will investigate.",
      });
      setDetails("");
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-border bg-card">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="space-y-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/15 text-destructive">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <DialogTitle className="text-lg font-bold text-foreground">
              Report {reportedListingTitle ? `Listing: "${reportedListingTitle}"` : reportedUserName || "User"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Reports are confidential and reviewed by Pairly community moderators within 24 hours.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Reason selection */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Reason for report
              </label>
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {REPORT_REASONS.map((r) => (
                  <label
                    key={r.id}
                    className={cn(
                      "flex items-start gap-3 p-2.5 rounded-xl border text-xs cursor-pointer transition-all",
                      reason === r.id
                        ? "border-destructive/80 bg-destructive/5 text-foreground font-medium"
                        : "border-border/60 hover:bg-muted/50 text-muted-foreground"
                    )}
                  >
                    <input
                      type="radio"
                      name="report-reason"
                      value={r.id}
                      checked={reason === r.id}
                      onChange={() => setReason(r.id)}
                      className="mt-0.5 text-destructive focus:ring-destructive"
                    />
                    <div>
                      <div className="font-semibold text-foreground">{r.label}</div>
                      <div className="text-[11px] text-muted-foreground">{r.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Details Textarea */}
            <div className="space-y-1.5">
              <label htmlFor="report-details" className="text-xs font-semibold text-foreground">
                Details & Context <span className="text-destructive">*</span>
              </label>
              <Textarea
                id="report-details"
                placeholder="Please describe specifically what occurred, including timestamps or message context..."
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={3}
                required
                className="resize-none rounded-xl text-xs bg-background"
              />
            </div>
          </div>

          <DialogFooter className="flex-row items-center justify-end gap-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="rounded-xl text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || !details.trim()}
              className="rounded-xl text-xs font-semibold bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              <Flag className="h-3.5 w-3.5 mr-1" />
              {isSubmitting ? "Submitting..." : "Submit Report"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
