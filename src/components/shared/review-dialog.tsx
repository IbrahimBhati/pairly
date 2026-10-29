"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ReviewStars } from "./review-stars";
import { submitReviewAction } from "@/lib/actions/reviews";
import { toast } from "sonner";
import { Sparkles, CheckCircle2, Award, HeartHandshake } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  connectionId: string;
  revieweeId: string;
  revieweeName: string;
  skillsInvolved?: {
    offered?: string;
    wanted?: string;
  };
  onSuccess?: () => void;
}

export function ReviewDialog({
  open,
  onOpenChange,
  connectionId,
  revieweeId,
  revieweeName,
  skillsInvolved,
  onSuccess,
}: ReviewDialogProps) {
  const [rating, setRating] = React.useState<number>(5);
  const [comment, setComment] = React.useState<string>("");
  const [skillsRating, setSkillsRating] = React.useState<number>(5);
  const [commRating, setCommRating] = React.useState<number>(5);
  const [punctRating, setPunctRating] = React.useState<number>(5);
  const [showSubRatings, setShowSubRatings] = React.useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);
  const [submitted, setSubmitted] = React.useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating < 1 || rating > 5) {
      toast.error("Please provide an overall rating from 1 to 5 stars");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await submitReviewAction({
        connectionId,
        revieweeId,
        rating,
        comment,
        skillsRating: showSubRatings ? skillsRating : undefined,
        communicationRating: showSubRatings ? commRating : undefined,
        punctualityRating: showSubRatings ? punctRating : undefined,
      });

      if (!res.success) {
        toast.error(res.error || "Failed to submit review");
        setIsSubmitting(false);
        return;
      }

      setSubmitted(true);
      toast.success("Review submitted! +5 points awarded.");
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (submitted) {
      // Reset state for future use
      setSubmitted(false);
      setComment("");
      setRating(5);
      setShowSubRatings(false);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg overflow-hidden border-border bg-card">
        {submitted ? (
          <div className="py-8 text-center flex flex-col items-center animate-in fade-in zoom-in-95 duration-300">
            {/* CSS Celebration Animation Pulse */}
            <div className="relative mb-6">
              <div className="absolute -inset-4 rounded-full bg-primary/20 animate-ping opacity-75" />
              <div className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-primary-foreground shadow-lg">
                <Sparkles className="w-10 h-10 animate-bounce" />
              </div>
            </div>

            <DialogTitle className="text-2xl font-bold text-foreground">
              Thank You for Sharing Feedback!
            </DialogTitle>
            <DialogDescription className="text-muted-foreground mt-2 max-w-sm">
              Your honest review helps keep the Pairly community trustworthy, vibrant, and safe for everyone.
            </DialogDescription>

            {/* Points Award Card */}
            <div className="mt-6 flex items-center gap-3 px-5 py-3 rounded-2xl bg-secondary/80 border border-primary/20 text-foreground font-medium">
              <Award className="w-5 h-5 text-primary" />
              <span>
                You earned <strong className="text-primary font-bold">+5 points</strong> for your contribution!
              </span>
            </div>

            <Button
              onClick={handleClose}
              className="mt-8 px-8 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            >
              Done
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <div className="flex items-center gap-2 text-primary font-semibold text-xs tracking-wider uppercase mb-1">
                <HeartHandshake className="w-4 h-4" />
                Post-Exchange Review
              </div>
              <DialogTitle className="text-xl font-bold text-foreground">
                How was your exchange with {revieweeName}?
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                {skillsInvolved?.offered || skillsInvolved?.wanted ? (
                  <span>
                    Exchange skills:{" "}
                    <strong className="text-foreground">
                      {[skillsInvolved.offered, skillsInvolved.wanted].filter(Boolean).join(" ⇄ ")}
                    </strong>
                  </span>
                ) : (
                  "Share your experience to help other members find great learning partners."
                )}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-5">
              {/* Overall Star Rating */}
              <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-secondary/50 border border-border/60">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Overall Rating
                </span>
                <ReviewStars
                  value={rating}
                  onChange={setRating}
                  size="xl"
                  className="mb-1"
                />
                <span className="text-xs text-muted-foreground mt-1">
                  {rating === 5 && "Outstanding — Highly recommended!"}
                  {rating === 4 && "Great exchange — Learned a lot!"}
                  {rating === 3 && "Good — Met expectations."}
                  {rating === 2 && "Fair — Some issues occurred."}
                  {rating === 1 && "Poor experience."}
                </span>
              </div>

              {/* Optional Sub-ratings accordion toggle */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowSubRatings(!showSubRatings)}
                  className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 focus:outline-none"
                >
                  {showSubRatings ? "Hide detailed ratings" : "+ Add detailed ratings (Skill quality, communication, punctuality)"}
                </button>

                {showSubRatings && (
                  <div className="mt-3 p-4 rounded-xl bg-background/50 border border-border space-y-3 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-foreground">Skill Quality & Knowledge</span>
                      <ReviewStars value={skillsRating} onChange={setSkillsRating} size="sm" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-foreground">Communication & Friendliness</span>
                      <ReviewStars value={commRating} onChange={setCommRating} size="sm" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-foreground">Punctuality & Reliability</span>
                      <ReviewStars value={punctRating} onChange={setPunctRating} size="sm" />
                    </div>
                  </div>
                )}
              </div>

              {/* Written Comment */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-medium">
                  <label htmlFor="review-comment" className="text-foreground">
                    Your feedback (optional)
                  </label>
                  <span className={cn(
                    "text-[11px]",
                    comment.length > 500 ? "text-destructive" : "text-muted-foreground"
                  )}>
                    {comment.length}/500
                  </span>
                </div>
                <Textarea
                  id="review-comment"
                  placeholder={`What did you learn? How did ${revieweeName} explain concepts? Would you recommend them to others?`}
                  value={comment}
                  onChange={(e) => setComment(e.target.value.slice(0, 500))}
                  rows={3}
                  className="resize-none rounded-xl bg-background border-input focus-visible:ring-primary text-sm"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
              <Button
                type="button"
                variant="ghost"
                onClick={handleClose}
                disabled={isSubmitting}
                className="rounded-full text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || rating === 0}
                className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs px-5"
              >
                {isSubmitting ? "Submitting..." : "Submit Review"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
