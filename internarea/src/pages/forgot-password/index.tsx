import React, { useState } from "react";
import { Mail, Phone, Lock, Copy, Check, ShieldAlert, ArrowLeft, KeyRound } from "lucide-react";
import Link from "next/link";
import { toast } from "react-toastify";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/firebase/firebase";
import api from "../../utils/api";
import Head from "next/head";

const ForgotPassword = () => {
  const [identifier, setIdentifier] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [emailSentNotice, setEmailSentNotice] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      toast.error("Please enter your email or phone number");
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage(null);
      setGeneratedPassword(null);
      setEmailSentNotice(false);

      // Call backend route to handle once-per-day rule and letter-only password generation
      const res = await api.post("/api/user/forgot-password", { identifier });

      setGeneratedPassword(res.data.newPassword);
      toast.success("Password reset request processed successfully!");

      // If the identifier is a valid email, trigger Firebase Password Reset email as well
      if (identifier.includes("@")) {
        try {
          await sendPasswordResetEmail(auth, identifier.trim());
          setEmailSentNotice(true);
        } catch (firebaseErr: any) {
          console.log("Firebase email reset note:", firebaseErr.message);
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

  const handleCopy = () => {
    if (generatedPassword) {
      navigator.clipboard.writeText(generatedPassword);
      setCopied(true);
      toast.info("Generated password copied to clipboard!");
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <Head>
        <title>Forgot Password | InternArea</title>
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
          Enter your registered Email address or Phone number
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100">
          
          {/* Form */}
          {!generatedPassword && (
            <form className="space-y-6" onSubmit={handleSubmit}>
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
                      Generating Reset...
                    </div>
                  ) : (
                    "Reset Password"
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Result Box when Password Generated */}
          {generatedPassword && (
            <div className="space-y-6">
              <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-center">
                <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Lock className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-green-900">New Password Generated!</h3>
                <p className="text-xs text-green-700 mt-1">
                  Secure letter-only password generated (Uppercase & Lowercase letters, no numbers or symbols).
                </p>

                <div className="mt-4 p-3 bg-white border rounded-lg flex items-center justify-between font-mono text-lg font-bold text-gray-900 tracking-wider">
                  <span>{generatedPassword}</span>
                  <button
                    onClick={handleCopy}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    title="Copy to clipboard"
                  >
                    {copied ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>

                {emailSentNotice && (
                  <p className="text-xs text-blue-600 font-medium mt-3">
                    📧 A password reset link has also been sent to your email!
                  </p>
                )}
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                ⚠️ <strong>Daily Limit Notice:</strong> You can request a password reset only once per day. Please save this generated password.
              </div>

              <Link
                href="/login"
                className="w-full flex justify-center py-2.5 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition"
              >
                Back to Sign In
              </Link>
            </div>
          )}

          {/* Footer Back Link */}
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
