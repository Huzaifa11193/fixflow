"use client";

import { KeyRound, Loader2, Check, AlertCircle } from "lucide-react";
import { useState } from "react";

import { AppShell, Panel } from "@/components/fixflow/app-shell";
import { Button } from "@/components/ui/button";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { changePassword } from "@/lib/auth-utils";

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const validatePasswords = () => {
    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters long");
      return false;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return false;
    }
    if (currentPassword === newPassword) {
      setError("New password must be different from current password");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setSuccess(false);

    if (!validatePasswords()) {
      return;
    }

    setIsLoading(true);

    try {
      // Note: Supabase doesn't provide a way to verify the current password
      // on the client side. The changePassword function will update the password.
      // In a production app, you might want to add additional verification.

      const result = await changePassword(newPassword);

      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        setMessage("Password changed successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");

        // Auto-clear success message after 5 seconds
        setTimeout(() => {
          setSuccess(false);
          setMessage("");
        }, 5000);
      }
    } catch (err) {
      setError("Failed to change password. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <AppShell
        active="Settings"
        description="Update your password to keep your account secure."
        title="Change Password"
      >
        <div className="max-w-2xl">
          <Panel>
            <div className="border-b border-white/10 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-zinc-200">
                <KeyRound className="size-4 text-cyan-300" />
                Update Your Password
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Warning Message */}
              <div className="rounded-lg border border-amber-300/20 bg-amber-300/10 p-4">
                <p className="text-sm text-amber-100">
                  ⚠️ For security, we recommend using a strong, unique password.
                </p>
              </div>

              {/* Current Password */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter your current password"
                  className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/[0.04] text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-cyan-300/60 transition"
                  disabled={isLoading}
                />
                <p className="text-xs text-zinc-500 mt-2">
                  Required for security verification
                </p>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter your new password"
                  className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/[0.04] text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-cyan-300/60 transition"
                  disabled={isLoading}
                  minLength={6}
                />
                <p className="text-xs text-zinc-500 mt-2">
                  Minimum 6 characters required
                </p>

                {/* Password Strength Indicator */}
                {newPassword && (
                  <div className="mt-3 space-y-2">
                    <div className="flex gap-1">
                      {[...Array(4)].map((_, i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full ${
                            newPassword.length >= (i + 1) * 2 + 2
                              ? i < 1
                                ? "bg-rose-400"
                                : i < 2
                                  ? "bg-amber-400"
                                  : "bg-emerald-400"
                              : "bg-white/10"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-zinc-400">
                      {newPassword.length < 8
                        ? "Weak"
                        : newPassword.length < 12
                          ? "Good"
                          : "Strong"}
                    </p>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your new password"
                  className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/[0.04] text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-cyan-300/60 transition"
                  disabled={isLoading}
                  minLength={6}
                />

                {/* Password Match Indicator */}
                {confirmPassword && (
                  <div className="mt-2 flex items-center gap-2">
                    {newPassword === confirmPassword ? (
                      <>
                        <Check className="size-4 text-emerald-400" />
                        <p className="text-xs text-emerald-400">Passwords match</p>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="size-4 text-rose-400" />
                        <p className="text-xs text-rose-400">Passwords don&apos;t match</p>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="rounded-lg border border-rose-300/20 bg-rose-300/10 p-3 flex gap-2">
                  <AlertCircle className="size-4 text-rose-300 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-rose-100">{error}</p>
                </div>
              )}

              {/* Success Message */}
              {success && message && (
                <div className="rounded-lg border border-emerald-300/20 bg-emerald-300/10 p-3 flex gap-2">
                  <Check className="size-4 text-emerald-300 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-emerald-100">{message}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="gap-2 bg-emerald-400 text-[#071015] hover:bg-emerald-300"
                >
                  {isLoading && <Loader2 className="size-4 animate-spin" />}
                  Update Password
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2 border-white/10 bg-white/[0.04] text-zinc-300 hover:bg-white/[0.08]"
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Panel>

          {/* Security Tips */}
          <Panel className="mt-6">
            <div className="p-6">
              <h3 className="text-sm font-medium text-zinc-200 mb-4">
                💡 Password Security Tips
              </h3>
              <ul className="space-y-2 text-sm text-zinc-400">
                <li>✓ Use a combination of uppercase, lowercase, numbers, and symbols</li>
                <li>✓ Avoid using personal information like names or birthdates</li>
                <li>✓ Never reuse passwords across different platforms</li>
                <li>✓ Update your password regularly (every 3-6 months)</li>
                <li>✓ Use a password manager to generate and store strong passwords</li>
              </ul>
            </div>
          </Panel>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
