import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { MainNav } from "@/components/nav/MainNav";
import { Container } from "@/components/ui/container";
import { getCurrentUser } from "@/lib/supabase/getCurrentUser";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { Toaster } from "sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "LoopyLink",
  description: "Your link management platform",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser();
  
  let profile = null;
  if (user) {
    const supabase = createServerComponentClient({ cookies });
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    profile = data;
  }

  const isAuthPage = children?.toString().includes("login") || 
                    children?.toString().includes("register");

  return (
    <html lang="en" className="h-full">
      <body className={`${inter.variable} min-h-full bg-black text-white antialiased`}>
        {!isAuthPage && user && (
          <MainNav
            user={{
              id: user.id,
              email: user.email,
              profile: profile || undefined,
            }}
          />
        )}
        <div className="flex min-h-screen flex-col">
          {isAuthPage ? (
            children
          ) : (
            <Container className="py-8">
              {children}
            </Container>
          )}
        </div>
        <Toaster />
      </body>
    </html>
  );
}
