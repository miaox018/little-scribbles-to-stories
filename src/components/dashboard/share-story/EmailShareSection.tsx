
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Mail, Send, AlertCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface EmailShareSectionProps {
  story: any;
  onClose: () => void;
}

export function EmailShareSection({ story, onClose }: EmailShareSectionProps) {
  const [email, setEmail] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleShareByEmail = async () => {
    setError(null);
    
    if (!email) {
      const errorMsg = "Please enter an email address to share the story.";
      setError(errorMsg);
      toast({
        title: "Email Required",
        description: errorMsg,
        variant: "destructive",
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      const errorMsg = "Please enter a valid email address.";
      setError(errorMsg);
      toast({
        title: "Invalid Email",
        description: errorMsg,
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    
    try {
      console.log('🚀 Starting email share process...');
      console.log('Story data:', { id: story?.id, title: story?.title });
      console.log('Recipient email:', email);

      const { data, error } = await supabase.functions.invoke('send-story-email', {
        body: {
          recipientEmail: email,
          storyTitle: story?.title,
          storyId: story?.id,
        }
      });

      console.log('📧 Function response:', { data, error });

      if (error) {
        console.error('❌ Function invocation error:', error);
        throw new Error(error.message || 'Failed to send email');
      }
      
      console.log('✅ Email sent successfully');
      
      toast({
        title: "Story Shared! 📚",
        description: `Story "${story?.title}" has been shared with ${email}`,
      });
      
      setEmail("");
      onClose();
      
    } catch (error: any) {
      console.error('❌ Email sharing error:', error);
      
      let errorMessage = "Failed to share story. Please try again.";
      
      // Provide more specific error messages based on the error
      if (error.message) {
        if (error.message.includes('configuration')) {
          errorMessage = "Email service is not configured properly. Please contact support.";
        } else if (error.message.includes('authentication')) {
          errorMessage = "Authentication failed. Please try signing in again.";
        } else if (error.message.includes('not found')) {
          errorMessage = "Story not found. Please try refreshing the page.";
        } else if (error.message.includes('Invalid email')) {
          errorMessage = "Please enter a valid email address.";
        } else {
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
      toast({
        title: "Share Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="email" className="flex items-center gap-2">
        <Mail className="h-4 w-4 text-purple-600" />
        Share Story via Email
      </Label>
      <p className="text-sm text-gray-600 mb-3">
        Send information about your story to family and friends via email.
      </p>
      
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
          <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
      
      <div className="flex space-x-2">
        <Input
          id="email"
          type="email"
          placeholder="Enter email address"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (error) setError(null); // Clear error when user starts typing
          }}
          className="flex-1"
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleShareByEmail();
            }
          }}
          disabled={isSending}
        />
        <Button
          onClick={handleShareByEmail}
          disabled={isSending || !email}
          size="sm"
          className="px-4 bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
        >
          {isSending ? (
            <Mail className="h-4 w-4 animate-pulse" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
