
import { Button } from "@/components/ui/button";
import { Loader2, Wand2 } from "lucide-react";

interface TransformButtonProps {
  isTransforming: boolean;
  isDisabled: boolean;
  onTransform: () => void;
}

export function TransformButton({ isTransforming, isDisabled, onTransform }: TransformButtonProps) {
  return (
    <Button
      onClick={onTransform}
      disabled={isDisabled}
      size="lg"
      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
    >
      {isTransforming ? (
        <>
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          Transforming Story...
        </>
      ) : (
        <>
          <Wand2 className="h-5 w-5 mr-2" />
          Transform My Story
        </>
      )}
    </Button>
  );
}
