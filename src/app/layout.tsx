import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { DeliverySessionProvider } from "@/context/delivery-session-context";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-app-sans",
});

export const metadata: Metadata = {
  title: "Mithren Agro — Delivery Partner Portal",
  description:
    "Mithren Agro delivery partner portal: pickups, deliveries and availability for partners registered by Mithren Agro.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${poppins.variable} font-sans antialiased`}>
        <DeliverySessionProvider>{children}</DeliverySessionProvider>
      </body>
    </html>
  );
}
