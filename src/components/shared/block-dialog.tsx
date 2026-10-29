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
import { blockUserAction } from "@/lib/actions/safety";
import { toast } from "sonner";
import { UserX, ShieldOff, Loader2 } from "lucide-react";

interface BlockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
  onSuccess?: () => void;
}

export function BlockDialog({
  open,
  onOpenChange,
  userId,
  userName,
  onSuccess,
}: BlockDialogProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleBlock = async () => {
    setIsSubmitting(true);
    try {
      const res = await blockUserAction(userId);
      if (!res.success) {
        toast.error(res.error || "Failed to block user");
        setIsSubmitting(false);
        return;
      }

      toast.success(`${userName} has been blocked`, {
        description: "They can no longer contact you, view your listings, or match with your skills.",
      });

      onOpenChange(false);
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-border bg-card">
        <DialogHeader className="space-y-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/15 text-destructive">
            <UserX className="h-5 w-5" />
          </div>
          <DialogTitle className="text-lg font-bold text-foreground">
            Block {userName}?
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed space-y-2">
            <p>
              Are you sure you want to block this user? The following restrictions will apply immediately:
            </p>
          </DialogDescription>
        </DialogHeader>

        <div className="py-2 space-y-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2 p-2 rounded-xl bg-muted/40">
            <ShieldOff className="h-4 w-4 text-destructive shrink-0" />
            <span>They cannot view your listings or search for your profile</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-xl bg-muted/40">
            <ShieldOff className="h-4 w-4 text-destructive shrink-0" />
            <span>They cannot send connection requests or chat messages</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-xl bg-muted/40">
            <ShieldOff className="h-4 w-4 text-destructive shrink-0" />
            <span>Smart Matching will hide both profiles from mutual recommendations</span>
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
            type="button"
            size="sm"
            onClick={handleBlock}
            disabled={isSubmitting}
            className="rounded-xl text-xs font-semibold bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-sm"
          >
            {isSubmitting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
            ) : (
              <UserX className="h-3.5 w-3.5 mr-1" />
            )}
            <span>Block User</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
