"use client";

import React from 'react';

// The centred card with the CISS logo used by the signed-out pages
// (forgot password, reset password). Same look as the login page.
export const AuthCard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="login-page">
    <div className="login-card">
      <div className="login-logo">
        {/* Plain <img>: a small static logo from /public, no optimisation needed. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="login-logo-img" src="/ciss-logo.png" alt="CISS" width={40} height={40} />
        <h1>Click up CISS</h1>
      </div>
      {children}
    </div>
  </div>
);
