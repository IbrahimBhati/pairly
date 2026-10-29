"use client";

import React, { useState, useEffect } from "react";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import { fetchBlockedUsersAction, unblockUserAction, BlockedUserItem } from "@/lib/actions/safety";
import { toast } from "sonner";
import { UserX, ShieldCheck, Loader2 } from "lucide-react";

export function BlockedUsersList() {
  const [blockedUsers, setBlockedUsers] = useState<BlockedUserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [unblockingId, setUnblockingId] = useState<string | null>(null);

  const loadBlocked = () => {
    setLoading(true);
    fetchBlockedUsersAction()
      .then((res) => {
        if (res.success) setBlockedUsers(res.data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadBlocked();
  }, []);

  const handleUnblock = async (userId: string, name: string) => {
    setUnblockingId(userId);
    try {
      const res = await unblockUserAction(userId);
      if (!res.success) {
        toast.error(res.error || "Failed to unblock user");
        return;
      }
      toast.success(`${name} unblocked`);
      setBlockedUsers((prev) => prev.filter((u) => u.blockedId !== userId));
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    } finally {
      setUnblockingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-3 text-xs text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        <span>Loading blocked accounts...</span>
      </div>
    );
  }

  if (blockedUsers.length === 0) {
    return (
      <div className="flex items-center gap-2 py-2 text-xs text-muted-foreground">
        <ShieldCheck className="h-4 w-4 text-emerald-500" />
        <span>You haven't blocked any accounts.</span>
      </div>
    );
  }

  return (
    <div className="space-y-3 pt-1">
      {blockedUsers.map((user) => (
        <div
          key={user.blockedId}
          className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-muted/40 border border-border/60"
        >
          <div className="flex items-center gap-3 min-w-0">
            <UserAvatar
              profile={{
                id: user.blockedId,
                full_name: user.fullName,
                avatar_url: user.avatarUrl,
              }}
              size="sm"
            />
            <div className="min-w-0">
              <p className="text-xs font-bold text-foreground truncate">{user.fullName}</p>
              {user.headline && (
                <p className="text-[11px] text-muted-foreground truncate">{user.headline}</p>
              )}
            </div>
          </div>

          <Button
            size="sm"
            variant="outline"
            disabled={unblockingId === user.blockedId}
            onClick={() => handleUnblock(user.blockedId, user.fullName)}
            className="rounded-xl text-xs shrink-0 hover:bg-destructive/10 hover:text-destructive"
          >
            {unblockingId === user.blockedId ? (
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
            ) : null}
            <span>Unblock</span>
          </Button>
        </div>
      ))}
    </div>
  );
}
