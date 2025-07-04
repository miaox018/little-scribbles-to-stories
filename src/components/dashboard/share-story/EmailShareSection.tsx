
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FileText, Mail } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface EmailShareSectionProps {
  story: any;
  onClose: () => void;
}

export function EmailShareSection({ story, onClose }: EmailShareSectionProps) {
  const [email, setEmail] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleShareByEmail = async () => {
    if (!email) {
      toast({
        title: "Email Required",
        description: "Please enter an email address to share the story.",
        variant: "destructive",
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-story-email', {
        body: {
          recipientEmail: email,
          storyTitle: story?.title,
          storyId: story?.id,
        }
      });

      if (error) {
        throw error;
      }
      
      toast({
        title: "Story PDF Sent! 📚",
        description: `A PDF of "${story?.title}" has been sent to ${email}`,
      });
      setEmail("");
      onClose();
    } catch (error: any) {
      console.error('Email sharing error:', error);
      toast({
        title: "Share Failed",
        description: error.message || "Failed to send story PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="email" className="flex items-center gap-2">
        <FileText className="h-4 w-4 text-purple-600" />
        Send Story as PDF
      </Label>
      <p className="text-sm text-gray-600 mb-3">
        Recipients will receive a beautiful PDF version of your story that they can read, print, or share.
      </p>
      <div className="flex space-x-2">
        <Input
          id="email"
          type="email"
          placeholder="Enter email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1"
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleShareByEmail();
            }
          }}
        />
        <Button
          onClick={handleShareByEmail}
          disabled={isSending}
          size="sm"
          className="px-4 bg-purple-600 hover:bg-purple-700"
        >
          {isSending ? (
            <Mail className="h-4 w-4 animate-pulse" />
          ) : (
            <FileText className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
