import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const repoName = process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "";
const explicitBasePath = process.env.BASE_PATH;
const inferredBasePath = repoName && !repoName.endsWith(".github.io") ? `/${repoName}` : "";
const basePath = explicitBasePath ?? inferredBasePath;

function assetPath(path: string): string {
  return `${basePath}${path}`;
}

const yekanBakh = localFont({
  src: "../../public/YekanBakhFaNum-Regular.ttf",
  variable: "--font-yekan-bakh",
  display: "swap",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "تقسیم هزینه گروهی و محاسبه دنگ | دنگ حساب",
  description:
    "هزینه های سفر، رستوران، خرید و خانه را سریع بین اعضای گروه تقسیم کنید، سهم هر نفر را دقیق ببینید و تسویه نهایی را بدون حساب و کتاب دستی انجام دهید.",
  applicationName: "دنگ حساب",
  category: "finance",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "fa_IR",
    siteName: "دنگ حساب",
    title: "تقسیم هزینه گروهی و محاسبه دنگ | دنگ حساب",
    description:
      "هزینه های سفر، رستوران، خرید و خانه را سریع بین اعضای گروه تقسیم کنید، سهم هر نفر را دقیق ببینید و تسویه نهایی را بدون حساب و کتاب دستی انجام دهید.",
  },
  twitter: {
    card: "summary",
    title: "تقسیم هزینه گروهی و محاسبه دنگ | دنگ حساب",
    description:
      "هزینه های سفر، رستوران، خرید و خانه را سریع بین اعضای گروه تقسیم کنید و تسویه نهایی را بدون حساب و کتاب دستی انجام دهید.",
  },
  icons: {
    icon: [{ url: assetPath("/dong-favicon.svg"), type: "image/svg+xml" }],
    shortcut: [assetPath("/dong-favicon.svg")],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0f172a",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fa"
      dir="rtl"
      className={`${yekanBakh.variable} ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-dvh flex flex-col font-sans">{children}</body>
    </html>
  );
}
