import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { QueryClientProvider } from "@/lib/queryClient";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import OverrideGithubTokenEnvVariable from "@/components/OverrideGithubTokenEnvVariable";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "GitPulse",
  description:
    "Monitor GitHub repository activity. Enter a username, select a repository, and view recent commit history with detailed information.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryClientProvider>
            <TooltipProvider>
              <div className="min-h-screen bg-background ">
                <header className="border-b border-border sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
                  <div className="container mx-auto px-4 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-semibold select-none">
                        GitPulse
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <OverrideGithubTokenEnvVariable />
                      <ThemeToggle />
                    </div>
                  </div>
                </header>
                {children}
              </div>
              <Toaster />
            </TooltipProvider>
          </QueryClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
