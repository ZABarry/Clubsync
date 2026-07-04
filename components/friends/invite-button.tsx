"use client";

import { Check, Copy, Link2, Loader2, MessageCircle } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type InviteButtonProps = {
  onCreateInvite: () => Promise<string>;
  className?: string;
};

export function InviteButton({ onCreateInvite, className }: InviteButtonProps) {
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCreate = useCallback(async () => {
    setLoading(true);
    try {
      const token = await onCreateInvite();
      const url = `${window.location.origin}/invite/${token}`;
      setInviteUrl(url);
      setCopied(false);
    } catch {
      toast.error("Failed to create invite link");
    } finally {
      setLoading(false);
    }
  }, [onCreateInvite]);

  const handleCopy = useCallback(async () => {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      toast.success("Invite link copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  }, [inviteUrl]);

  const handleShareWhatsApp = useCallback(() => {
    if (!inviteUrl) return;
    const text = encodeURIComponent(
      `Join me on ClubZer to plan summer clubs together: ${inviteUrl}`,
    );
    window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
  }, [inviteUrl]);

  return (
    <div className={cn("space-y-3", className)}>
      <Button onClick={handleCreate} disabled={loading}>
        {loading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Link2 className="size-4" />
        )}
        Create invite link
      </Button>

      {inviteUrl ? (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input readOnly value={inviteUrl} className="font-mono text-xs" />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleCopy}
              aria-label="Copy invite link"
            >
              {copied ? (
                <Check className="size-4 text-emerald-600" />
              ) : (
                <Copy className="size-4" />
              )}
            </Button>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleShareWhatsApp}
          >
            <MessageCircle className="size-4" />
            Share via WhatsApp
          </Button>
        </div>
      ) : null}
    </div>
  );
}
