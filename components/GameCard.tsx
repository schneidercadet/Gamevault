/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Game } from "@/types/game";
import { PlusCircleIcon } from "@heroicons/react/24/outline";
import AddToCollectionDialog from "./AddToCollectionDialog";
import RemoveFromCollectionDialog from "./RemoveFromCollectionDialog";
import useCollections from "@/hooks/useCollections";

interface GameCardProps {
  game: Game;
  onRemove?: () => void;
  children?: React.ReactNode;
  inCollection?: boolean;
  priority?: boolean;
}

function GameCard({ game, onRemove, children, inCollection, priority = false }: GameCardProps) {
  const [isAddToCollectionOpen, setIsAddToCollectionOpen] = useState(false);
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);
  const { collections, addGameToCollection } = useCollections();

  // Check if game is in any collection 
  const isInCollection = useMemo(() => {
    return inCollection ?? collections.some((collection) =>
      (collection.gameIds || []).includes(game.id)
    );
  }, [collections, game.id, inCollection]);

  if (!game) return null;

  const platformIcons = {
    playstation: "fa-brands fa-playstation",
    xbox: "fa-brands fa-xbox",
    pc: "fa-solid fa-desktop",
    nintendo: "fa-solid fa-gamepad",
  } as const;

  const getUniquePlatforms = (platformString: string | null) => {
    const platformSet = new Set<string>();
    if (!platformString) return ["pc"];

    platformString.split(", ").forEach((platform) => {
      const lowerPlatform = platform.toLowerCase();
      if (lowerPlatform.includes("playstation")) platformSet.add("playstation");
      else if (lowerPlatform.includes("xbox")) platformSet.add("xbox");
      else if (lowerPlatform.includes("pc")) platformSet.add("pc");
      else if (lowerPlatform.includes("nintendo")) platformSet.add("nintendo");
      else platformSet.add("pc");
    });
    return Array.from(platformSet);
  };

  const handleAddOrRemoveClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isInCollection) {
      setIsRemoveDialogOpen(true);
    } else {
      // If there are no custom collections, add directly to "all"
      if (collections.length === 0) {
        try {
          const success = await addGameToCollection('all', game.id);
          if (!success) {
            console.error('Failed to add game to collection');
          }
        } catch (error) {
          console.error(error instanceof Error ? error.message : 'Failed to add game to collection');
        }
      } else {
        setIsAddToCollectionOpen(true);
      }
    }
  };

  return (
    <div className="group relative overflow-hidden rounded-lg border-2 border-primary-dark/10 bg-gradient-to-b from-background to-background-lighter p-4 transition-all duration-300 before:absolute before:-inset-1 before:rounded-lg before:border-2 before:border-primary-dark/20 before:opacity-0 before:transition-all hover:scale-[1.02] hover:before:opacity-100">
      {/* Add/Remove Button */}
      <button
        onClick={handleAddOrRemoveClick}
        className="absolute right-2 top-2 z-10 rounded-full bg-background p-1 opacity-0 shadow-lg transition-opacity group-hover:opacity-100"
      >
        {isInCollection ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="h-6 w-6 text-error hover:text-error/90"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        ) : (
          <PlusCircleIcon className="h-6 w-6 text-primary-dark hover:text-primary-dark/90" />
        )}
      </button>

      <Link href={`/game/${game.id}`} className="block">
        <div className="relative mb-4 aspect-video w-full overflow-hidden rounded-lg">
          {children || (
            game.coverUrl ? (
              <Image
                src={game.coverUrl || "/placeholder.jpg"}
                alt={game.title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="rounded-t-lg object-cover transition-all group-hover:brightness-50"
                priority={priority}
                loading={priority ? "eager" : "lazy"}
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-gradient-to-b from-background to-background-lighter">
                <i className="fas fa-gamepad text-4xl text-foreground-muted" />
              </div>
            )
          )}
        </div>

        <div className="space-y-2">
          <h3 className="line-clamp-1 text-lg font-semibold text-foreground">
            {game.title}
          </h3>

          <div className="flex items-center space-x-2">
            {getUniquePlatforms(game.platform).map((platform) => (
              <i
                key={platform}
                className={`${platformIcons[platform as keyof typeof platformIcons]} text-foreground-muted`}
              />
            ))}
          </div>

          {typeof game.rating === "number" && game.rating > 0 && (
            <div className="flex items-center space-x-1">
              <i className="fas fa-star text-primary-dark" />
              <span className="text-sm text-foreground-muted">
                {game.rating.toFixed(1)}
              </span>
            </div>
          )}
        </div>
      </Link>

      <AddToCollectionDialog
        isOpen={isAddToCollectionOpen}
        onClose={() => setIsAddToCollectionOpen(false)}
        game={game}
      />

      <RemoveFromCollectionDialog
        isOpen={isRemoveDialogOpen}
        onClose={() => setIsRemoveDialogOpen(false)}
        game={game}
      />
    </div>
  );
}

export default React.memo(GameCard, (prevProps, nextProps) => {
  return (
    prevProps.game.id === nextProps.game.id &&
    prevProps.onRemove === nextProps.onRemove &&
    prevProps.priority === nextProps.priority
  );
});
