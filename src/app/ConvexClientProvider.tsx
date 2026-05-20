"use client";

import React, { useState } from "react";
import { ConvexAuthNextjsProvider } from "@convex-dev/auth/nextjs";
import { ConvexReactClient } from "convex/react";

export default function ConvexClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

  const [client] = useState(() => {
    if (!convexUrl) return null;
    return new ConvexReactClient(convexUrl);
  });

  if (!client) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
          background: "#F8F9FA",
          padding: "2rem",
          textAlign: "center",
        }}
      >
        <div
          style={{
            background: "#fff",
            border: "1px solid #DADCE0",
            borderRadius: "8px",
            padding: "2.5rem 3rem",
            maxWidth: "480px",
            boxShadow: "0 1px 3px rgba(60,64,67,.12)",
          }}
        >
          <div
            style={{
              fontSize: "2rem",
              marginBottom: "1rem",
            }}
          >
            ⚙️
          </div>
          <h1
            style={{
              fontSize: "1.125rem",
              fontWeight: 700,
              color: "#202124",
              marginBottom: "0.75rem",
            }}
          >
            Convex URL Not Configured
          </h1>
          <p style={{ color: "#5F6368", fontSize: "0.875rem", lineHeight: 1.6 }}>
            The environment variable{" "}
            <code
              style={{
                background: "#F1F3F4",
                padding: "2px 6px",
                borderRadius: "4px",
                fontFamily: "monospace",
                fontSize: "0.8125rem",
                color: "#D93025",
              }}
            >
              NEXT_PUBLIC_CONVEX_URL
            </code>{" "}
            is not set.
          </p>
          <p
            style={{
              color: "#5F6368",
              fontSize: "0.8125rem",
              marginTop: "1rem",
              lineHeight: 1.6,
            }}
          >
            Go to your deployment dashboard (Vercel → Settings → Environment
            Variables), add{" "}
            <strong style={{ color: "#202124" }}>NEXT_PUBLIC_CONVEX_URL</strong>{" "}
            with your Convex deployment URL, then redeploy.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ConvexAuthNextjsProvider client={client}>
      {children}
    </ConvexAuthNextjsProvider>
  );
}
