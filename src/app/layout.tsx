import { Login } from "@mui/icons-material";
import React from "react";
import LoginPage from "./login/page";

export const metadata = {
  title: "webshield",
  description: "Sime Dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // <html>
    //   <body>
    //     <LoginPage />
    //   </body>
    // </html>
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
