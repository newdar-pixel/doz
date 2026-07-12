import React from "react";
import { ScrollViewStyleReset } from "expo-router/html";

export default function Root({ children }) {
  return <html lang="tr">
    <head>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="theme-color" content="#32213A" />
      <link rel="icon" type="image/png" sizes="512x512" href="/doz-justice-v3.png" />
      <link rel="shortcut icon" type="image/png" href="/doz-justice-v3.png" />
      <link rel="apple-touch-icon" href="/doz-justice-v3.png" />
      <title>DOZ · Dosyadan öngörüye</title>
      <ScrollViewStyleReset />
    </head>
    <body>{children}</body>
  </html>;
}
