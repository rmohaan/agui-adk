import type { Metadata } from "next";
import { IBM_Plex_Sans, Source_Serif_4 } from "next/font/google";
import { CopilotKit } from "@copilotkit/react-core";
import "./globals.css";

const heading = Source_Serif_4({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const body = IBM_Plex_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
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
