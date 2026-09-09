import "./globals.css";

export const metadata = {
  title: "🦅 GARUDA Sovereign AI Starter Kit | WhatsApp Bot & Milestone Escrow",
  description: "Production Next.js 14 + WhatsApp AI Receptionist & Razorpay 50/50 Milestone PWA Starter Kit.",
  keywords: ["GARUDA AI", "WhatsApp Bot", "AI Receptionist", "Next.js 14", "Razorpay Milestone", "Supabase Starter"]
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body className="bg-slate-950 text-slate-100 min-h-screen antialiased selection:bg-amber-400 selection:text-black">
        {children}
      </body>
    </html>
  );
}
