import "./globals.css";

export const metadata = {
    title: "SkillCraft - The story behind your skills",
    description: "Describe your project, review your skills, and draft your CV project section.",
    robots: { index: false, follow: false },
    icons: { icon: "/skillcraft.svg" },
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
