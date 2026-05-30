"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const STORAGE_KEY = "pc_ci_email";
const PENDING_EMAIL_KEY = "pc_ci_pending_email";
const LAST_Q_KEY = "pc_ci_last_q";
const LAST_VIEW_KEY = "pc_ci_last_view";

function hasStoredAccess() {
  try {
    const email = window.localStorage.getItem(STORAGE_KEY);
    return Boolean(email && email.includes("@"));
  } catch {
    return false;
  }
}

export default function CIAccessNavLink() {
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

  function handleLogOff() {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
      window.localStorage.removeItem(PENDING_EMAIL_KEY);
      window.localStorage.removeItem(LAST_Q_KEY);
      window.localStorage.removeItem(LAST_VIEW_KEY);
      window.dispatchEvent(new Event("pc-ci-auth-change"));
    } catch {
      // ignore
    }

    window.location.href = "/";
  }

  if (!ready) return null;

  if (hasAccess) {
    return (
      <button
        type="button"
        onClick={handleLogOff}
        className="text-[12px] sm:text-[13px] uppercase underline underline-offset-4 decoration-[0.5px] hover:opacity-70"
      >
        LOG OFF
      </button>
    );
  }

  return (
    <Link
      href="/pricing"
      className="text-[12px] sm:text-[13px] underline underline-offset-4 decoration-[0.5px] hover:opacity-70"
    >
      CI Access
    </Link>
  );
}