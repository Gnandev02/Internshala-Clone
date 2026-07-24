import React, { useState } from "react";
import { Mail, Phone, Lock, Eye, EyeOff, Sparkles, ShieldAlert, ArrowLeft, KeyRound, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { toast } from "react-toastify";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/firebase/firebase";
import api from "../../utils/api";
import Head from "next/head";

// Letter-only random password generator helper (uppercase + lowercase letters, no numbers, no special characters)
function generateLetterOnlyPassword(length = 12): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  let result = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    result += chars.charAt(randomIndex);
  }
  return result;
}

const ForgotPassword = () => {
  const [identifier, setIdentifier] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [emailSentNotice, setEmailSentNotice] = useState(false);

  // Optional helper to generate a secure letter-only password
  const handleAutoGeneratePassword = () => {
    const generated = generateLetterOnlyPassword(12);
    setNewPassword(generated);
    setShowPassword(true); // show generated password so user can see it
    toast.info("Generated letter-only password auto-filled!");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      toast.error("Please enter your email or phone number");
      return;
    }
    if (!newPassword.trim()) {
      toast.error("Please enter your new password");
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage(null);
      setEmailSentNotice(false);

      // Call backend route to handle once-per-day rate limit rule and log reset
      const res = await api.post("/api/user/forgot-password", {
        identifier: identifier.trim(),
        newPassword: newPassword.trim(),
      });

      setIsSuccess(true);
      toast.success("Password reset successfully!");

      // If identifier is an email, send Firebase reset link as well
      if (identifier.includes("@")) {
        try {
          await sendPasswordResetEmail(auth, identifier.trim());
          setEmailSentNotice(true);
        } catch (firebaseErr: any) {
          console.log("Firebase reset note:", firebaseErr.message);
        }
      }
    } catch (error: any) {
      console.error("Forgot Password Error:", error.response?.data || error);
      const msg = error.response?.data?.error || error.message || "Failed to process password reset";
      
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <Head>
        <title>Reset Password | InternArea</title>
      </Head>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-2">
          <div className="p-3 bg-blue-100 rounded-full text-blue-600">
            <KeyRound className="w-8 h-8" />
          </div>
        </div>
        <h2 className="text-center text-3xl font-extrabold text-gray-900">
          Reset Your Password
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Enter your account details and choose a new password
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100">
          
          {!isSuccess ? (
            <form className="space-y-6" onSubmit={handleSubmit}>
              
              {/* Email or Phone Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email or Phone Number
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    {identifier.includes("@") ? (
                      <Mail className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Phone className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="block w-full text-black pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="user@example.com or +1234567890"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Custom New Password Field */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-gray-700">
                    New Password
                  </label>
                  <button
                    type="button"
                    onClick={handleAutoGeneratePassword}
                    className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 hover:underline"
                    title="Generate letter-only password (A-Z, a-z)"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                    <span>Generate Password</span>
                  </button>
                </div>

                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="block w-full text-black pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm font-mono"
                    placeholder="Type your new password"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  You can type your own password or click &quot;Generate Password&quot; to auto-fill a letter-only password.
                </p>
              </div>

              {/* Warning Alert if daily limit exceeded */}
              {errorMessage && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start space-x-3">
                  <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-800 font-medium">{errorMessage}</p>
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition"
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                      Resetting Password...
                    </div>
                  ) : (
                    "Reset Password"
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* Success State */
            <div className="space-y-6">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-center">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Mail className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-blue-900">Check Your Email Inbox!</h3>
                <p className="text-sm text-blue-700 mt-1">
                  A password reset email has been sent to <strong>{identifier}</strong>.
                </p>

                <div className="mt-4 p-3 bg-white border border-blue-200 rounded-lg text-left text-xs space-y-1.5 text-gray-700">
                  <p className="font-bold text-blue-950">To complete your password update:</p>
                  <ol className="list-decimal list-inside space-y-1 text-gray-600">
                    <li>Open the email sent to <strong>{identifier}</strong>.</li>
                    <li>Click the <strong>Reset Password</strong> link inside the email.</li>
                    <li>Enter your new password on Firebase&apos;s page.</li>
                    <li>Return to InternArea and <strong>Sign In</strong>!</li>
                  </ol>
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                ⚠️ <strong>Daily Limit Notice:</strong> You can request a password reset only once per day.
              </div>

              <Link
                href="/login"
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition"
              >
                Go to Sign In
              </Link>
            </div>
          )}

          {/* Back to Sign In Link */}
          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              <ArrowLeft className="w-4 h-4 mr-1" /> Back to Sign In
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
