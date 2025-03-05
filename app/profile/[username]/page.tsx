"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuthContext } from "@/components/AuthProvider";
import Navbar from "@/components/Navbar";
import Avatar from "@/components/Avatar";
import { db } from "@/lib/firebase/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  photoURL?: string;
  email?: string;
  bio?: string;
  socialLinks?: {
    discord?: string;
    twitter?: string;
    steam?: string;
  };
  favoriteGames?: string[];
}

export default function ProfilePage() {
  const params = useParams();
  const { user } = useAuthContext();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!params.username) return;

      try {
        const usersQuery = query(
          collection(db, "userProfiles"),
          where("username", "==", params.username)
        );
        const snapshot = await getDocs(usersQuery);

        if (!snapshot.empty) {
          setProfile({
            id: snapshot.docs[0].id,
            ...snapshot.docs[0].data(),
          } as UserProfile);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [params.username]);

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-background pt-20">
          <div className="container mx-auto px-4 py-8">
            <div className="animate-pulse space-y-4">
              <div className="h-32 w-32 rounded-full bg-background-lighter" />
              <div className="h-8 w-48 rounded bg-background-lighter" />
              <div className="h-4 w-24 rounded bg-background-lighter" />
            </div>
          </div>
        </main>
      </>
    );
  }

  if (!profile) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-background pt-20">
          <div className="container mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold text-foreground">
              User not found
            </h1>
          </div>
        </main>
      </>
    );
  }

  const isCurrentUser = user?.uid === profile.id;

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background pt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="rounded-lg bg-background-lighter p-8">
            <div className="flex items-start space-x-6">
              <Avatar user={profile} size="lg" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-foreground">
                      {profile.displayName}
                    </h1>
                    <p className="text-foreground-muted">@{profile.username}</p>
                  </div>
                  {!isCurrentUser && <div className="flex space-x-2"></div>}
                </div>

                {profile.bio && (
                  <p className="mt-4 text-foreground">{profile.bio}</p>
                )}

                {profile.socialLinks &&
                  Object.keys(profile.socialLinks).length > 0 && (
                    <div className="mt-6">
                      <h2 className="mb-2 text-lg font-semibold text-foreground">
                        Social Links
                      </h2>
                      <div className="flex space-x-4">
                        {profile.socialLinks.discord && (
                          <a
                            href={`https://discord.com/users/${profile.socialLinks.discord}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-foreground-muted hover:text-foreground"
                          >
                            Discord
                          </a>
                        )}
                        {profile.socialLinks.twitter && (
                          <a
                            href={`https://twitter.com/${profile.socialLinks.twitter}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-foreground-muted hover:text-foreground"
                          >
                            Twitter
                          </a>
                        )}
                        {profile.socialLinks.steam && (
                          <a
                            href={`https://steamcommunity.com/id/${profile.socialLinks.steam}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-foreground-muted hover:text-foreground"
                          >
                            Steam
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                {profile.favoriteGames && profile.favoriteGames.length > 0 && (
                  <div className="mt-6">
                    <h2 className="mb-2 text-lg font-semibold text-foreground">
                      Favorite Games
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {profile.favoriteGames.map((gameId) => (
                        <a
                          key={gameId}
                          href={`/games/${gameId}`}
                          className="rounded-full bg-background px-3 py-1 text-sm text-foreground-muted hover:bg-background-lighter"
                        >
                          {gameId}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
