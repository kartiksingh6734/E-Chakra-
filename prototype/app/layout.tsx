import type { Metadata, Viewport } from "next";
import "./globals.css";
export const metadata: Metadata = {
 title: "E-CHAKRA | Collector", description: "Record your e-waste, compare offers and keep a clear handover and payment history.",
 manifest: "/manifest.webmanifest", appleWebApp: {capable:true,title:"E-CHAKRA",statusBarStyle:"default"},
 icons:{icon:"/favicon.svg",shortcut:"/favicon.svg",apple:"/icon-192.png"}
};
export const viewport: Viewport = {width:"device-width",initialScale:1,themeColor:"#087f72"};
export default function RootLayout({children}:{children:React.ReactNode}) {return <html lang="hi"><body>{children}</body></html>}
