"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SettingsIcon, Save, Trash2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

const OverrideGithubTokenEnvVariable = () => {
  const [token, setToken] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [showToken, setShowToken] = useState(false);

  // Load token from localStorage on component mount
  useEffect(() => {
    const storedToken = localStorage.getItem("github-token");
    if (storedToken) {
      setToken(storedToken);
    }
  }, []);

  const handleSave = () => {
    if (token.trim()) {
      localStorage.setItem("github-token", token.trim());
      toast.success("Your GitHub token has been saved successfully.");
      setIsOpen(false);
    } else {
      toast.error("Please enter a valid GitHub token.");
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedText = e.clipboardData.getData("text");
    const trimmedText = pastedText.trim();

    // Check if pasted text contains key=value format (like "GITHUB_TOKEN=ghp_...")
    if (trimmedText.includes("=")) {
      const parts = trimmedText.split("=");
      if (parts.length >= 2) {
        // Take everything after the first = (in case there are multiple = signs)
        const tokenValue = parts.slice(1).join("=").trim();
        if (tokenValue && tokenValue !== pastedText) {
          setToken(tokenValue);
          e.preventDefault(); // Prevent the default paste behavior
          toast.success("Token extracted from pasted content");
          return;
        }
      }
    }

    // If no key=value format detected, use the original paste behavior
    setToken(pastedText);
  };

  const handleRemove = () => {
    localStorage.removeItem("github-token");
    setToken("");
    toast.success("Your GitHub token has been removed.");
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="cursor-pointer">
          <SettingsIcon className="h-[1.2rem] w-[1.2rem]" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>GitHub Token Configuration</DialogTitle>
          <DialogDescription>
            Configure your GitHub personal access token. This token will be used
            by server actions when the GITHUB_TOKEN environment variable is not
            available.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="token">Token</Label>
            <div className="col-span-3 relative">
              <Input
                id="token"
                type={showToken ? "text" : "password"}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                onPaste={handlePaste}
                className="pr-10"
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowToken(!showToken)}
              >
                {showToken ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            <p className="mb-2">
              <strong>How to get a token:</strong>
            </p>
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start cursor-pointer"
                onClick={() =>
                  window.open("https://github.com/settings/tokens", "_blank")
                }
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                Go to GitHub Personal Access Tokens
              </Button>
              <div className="text-xs space-y-1">
                <p>
                  Then select scopes: <code>repo</code>, <code>user</code>
                </p>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleRemove}
            disabled={!token}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Remove
          </Button>
          <Button type="submit" onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save Token
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OverrideGithubTokenEnvVariable;
