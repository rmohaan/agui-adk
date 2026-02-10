import type { Metadata } from "next";
import { Manrope, Unbounded } from "next/font/google";
import { CopilotKit } from "@copilotkit/react-core";
import "./globals.css";

const heading = Unbounded({
  variable: "--font-heading",
  subsets: ["latin"],
});

const body = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mutual Fund Redemption | AG-UI + ADK",
  description:
    "Agentic mutual fund redemption form review with AG-UI, CopilotKit, and Google ADK.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${heading.variable} ${body.variable} antialiased`}>
        <CopilotKit
          runtimeUrl="/api/copilotkit"
          agent="adkAgent"
          useSingleEndpoint={false}
        >
          {children}
        </CopilotKit>
      </body>
    </html>
  );
}
