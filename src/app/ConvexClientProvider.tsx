"use client";

import React from "react";
import { ConvexAuthNextjsProvider } from "@convex-dev/auth/nextjs";
import { ConvexReactClient } from "convex/react";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL?.trim() || "";
const convexClient = convexUrl ? new ConvexReactClient(convexUrl) : null;

export default function ConvexClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!convexClient) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Roboto, system-ui, sans-serif",
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
            boxShadow: "0 1px 2px rgba(60,64,67,.1)",
          }}
        >
          <h1
            style={{
              fontSize: "1.125rem",
              fontWeight: 500,
              color: "#202124",
              marginBottom: "0.75rem",
            }}
          >
            Convex URL not configured
          </h1>
          <p style={{ color: "#5F6368", fontSize: "0.875rem", lineHeight: 1.6 }}>
            Set{" "}
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
            in your deployment environment (Vercel → Settings → Environment
            Variables), then redeploy.{" "}
            <code style={{ fontSize: "0.75rem" }}>NEXT_PUBLIC_*</code> values are
            inlined at build time.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ConvexAuthNextjsProvider client={convexClient}>
      {children}
    </ConvexAuthNextjsProvider>
  );
}
