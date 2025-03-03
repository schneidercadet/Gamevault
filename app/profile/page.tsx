"use client";

import { useAuthContext } from "@/components/AuthProvider";
import { useProfile } from "@/hooks/useProfile";
import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import BackButton from "@/components/BackButton";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { CheckCircle } from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const { user } = useAuthContext();
  const {
    profile,
    loading,
    error,
    updateProfile,
    uploadProfilePicture,
    updateUsername,
    deleteAccount,
  } = useProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(profile?.displayName || "");
  const [username, setUsername] = useState(profile?.username || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [password, setPassword] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) {
      console.log("Profile updated:", profile);
      setDisplayName(profile.displayName || "");
      setUsername(profile.username || "");
      setBio(profile.bio || "");
    }
  }, [profile]);

  if (!user) return null;

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <div className="text-foreground-muted">Loading profile...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (await updateProfile({ displayName, bio })) {
      setIsEditing(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB");
      return;
    }

    await uploadProfilePicture(file);
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center gap-4">
        <BackButton />
        <h1 className="text-2xl font-bold tracking-tight">Profile Settings</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-[280px_1fr]">
        {/* Profile Picture Section */}
        <Card className="h-fit">
          <CardContent className="p-6">
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <div className="relative h-32 w-32 overflow-hidden rounded-full ring-2 ring-background-lighter">
                  <Image
                    src={profile?.photoURL || "/default-avatar.png"}
                    alt="Profile"
                    className="object-cover"
                    fill
                  />
                </div>
                <Button
                  size="sm"
                  className="absolute bottom-0 right-0 rounded-full bg-primary-dark p-2 text-white shadow-lg hover:bg-primary-dark/90"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-4 w-4"
                  >
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                </Button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <div className="text-center">
                <h2 className="font-semibold">{profile?.displayName}</h2>
                <p className="text-sm text-foreground-muted">
                  {profile?.username ? `@${profile.username}` : "No username set"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Details Section */}
        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleProfileUpdate} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <div className="flex gap-2">
                    <Input
                      id="username"
                      placeholder="Enter your username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      disabled={!isEditing}
                      className={cn(
                        "flex-1",
                        !isEditing && "border-transparent bg-background-lighter"
                      )}
                    />
                    {isEditing && (
                      <Button
                        type="button"
                        onClick={async () => {
                          if (!username.match(/^[a-zA-Z0-9_]{3,20}$/)) {
                            setSuccessMessage(
                              "Username must be 3-20 characters long and can only contain letters, numbers, and underscores"
                            );
                            setShowSuccessDialog(true);
                            return;
                          }
                          if (await updateUsername(username)) {
                            setSuccessMessage("Username updated successfully");
                            setShowSuccessDialog(true);
                          }
                        }}
                        className="bg-primary-dark text-white hover:bg-primary-dark/90"
                      >
                        Update
                      </Button>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    placeholder="Enter your display name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    disabled={!isEditing}
                    className={cn(
                      !isEditing && "border-transparent bg-background-lighter"
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    placeholder="Tell us about yourself"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    disabled={!isEditing}
                    className={cn(
                      "h-24 resize-none",
                      !isEditing && "border-transparent bg-background-lighter"
                    )}
                  />
                </div>
              </div>

              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditing(!isEditing)}
                  className={cn(
                    "border-background-lighter",
                    isEditing &&
                      "border-red-500 text-red-500 hover:bg-red-500/10"
                  )}
                >
                  {isEditing ? "Cancel" : "Edit Profile"}
                </Button>
                {isEditing && (
                  <Button
                    type="submit"
                    className="bg-primary-dark text-white hover:bg-primary-dark/90"
                  >
                    Save Changes
                  </Button>
                )}
              </div>

              <Separator className="my-6" />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-red-500">
                  Danger Zone
                </h3>
                <p className="text-sm text-foreground-muted">
                  Once you delete your account, there is no going back. Please
                  be certain.
                </p>
                <Button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full border-red-500 text-red-500 hover:bg-red-500/10"
                  variant="outline"
                >
                  Delete Account
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center space-y-4 py-4">
            <div className="rounded-full bg-green-500/10 p-3">
              <CheckCircle className="h-6 w-6 text-green-500" />
            </div>
            <div className="text-center">
              <DialogTitle className="text-lg font-semibold tracking-tight">
                Success
              </DialogTitle>
              <DialogDescription className="mt-1 text-foreground-muted">
                {successMessage}
              </DialogDescription>
            </div>
            <Button
              className="mt-4 bg-primary-dark text-white hover:bg-primary-dark/90"
              onClick={() => setShowSuccessDialog(false)}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Account Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Account</DialogTitle>
            <DialogDescription>
              This action cannot be undone. Please enter your password to
              confirm.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                variant="outline"
                className="border-background-lighter hover:bg-background-lighter"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={async () => {
                  if (await deleteAccount(password)) {
                    router.push("/");
                  }
                }}
                className="bg-red-500 text-white hover:bg-red-500/90"
              >
                Delete Account
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
