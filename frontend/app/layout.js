import {
  IBM_Plex_Sans,
  IBM_Plex_Sans_Arabic
} from "next/font/google";

import "./enclave-system.css";
import EnclaveSystemShell from "./EnclaveSystemShell";

const plexEnglish = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-en"
});

const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-ar"
});

export const metadata = {
  title: "Enclave AI Command Center",
  description: "Private AI Command Center",
  icons: {
    icon: "/brand/enclave-favicon.svg"
  }
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${plexEnglish.variable} ${plexArabic.variable}`}
    >
      <body
        style={{
          margin: 0,
          fontFamily:
            "var(--font-ar), var(--font-en), sans-serif"
        }}
      >
        <EnclaveSystemShell>{children}</EnclaveSystemShell>
      </body>
    </html>
  );
}
