import { Noto_Sans, Roboto_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/context";

const notoSans = Noto_Sans({
  variable: "--font-noto-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata = {
  title: "OpenChat",
  description: "Modern multi-model chat application",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
        />
      </head>
      <body
        className={`${notoSans.variable} ${robotoMono.variable} antialiased bg-neutral-950 text-white h-dvh fixed w-full left-0 top-0 overflow-y-auto`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
