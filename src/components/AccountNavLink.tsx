"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const STORAGE_KEY = "pc_ci_email";

function hasStoredAccess() {
  try {
    const email = window.localStorage.getItem(STORAGE_KEY);
    return Boolean(email && email.includes("@"));
  } catch {
    return false;
  }
}

export default function AccountNavLink() {
  const [hasAccess, setHasAccess] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const update = () => {
      setHasAccess(hasStoredAccess());
      setReady(true);
    };

    update();

    window.addEventListener("storage", update);
    window.addEventListener("pc-ci-auth-change", update);

    return () => {
      window.removeEventListener("storage", update);
      window.removeEventListener("pc-ci-auth-change", update);
    };
  }, []);

  if (!ready) return null;

  return (
    <Link
      href="/account"
      className="text-[12px] sm:text-[13px] underline underline-offset-4 decoration-[0.5px] hover:opacity-70"
    >
      {hasAccess ? "Account" : "Log In"}
    </Link>
  );
}