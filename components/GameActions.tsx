"use client";

import { useState, useEffect } from "react";
import { Game, GameDetails } from "@/types/game";
import RemoveFromCollectionDialog from "./RemoveFromCollectionDialog";
import AddToCollectionDialog from "./AddToCollectionDialog";
import { BookmarkIcon } from "@heroicons/react/24/outline";
import useCollections from "@/hooks/useCollections";

interface GameActionsProps {
  game: GameDetails | Game;
}

export default function GameActions({ game }: GameActionsProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { collections } = useCollections();
  const [isInAnyCollection, setIsInAnyCollection] = useState(false);

  // Update isInAnyCollection whenever collections change
  useEffect(() => {
    const hasGame = collections.some((collection) =>
      (collection.gameIds || []).includes(game.id.toString())
    );
    setIsInAnyCollection(hasGame);
  }, [collections, game.id]);

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
  };

  return (
    <div className="mt-6">
      <button
        onClick={() => setIsDialogOpen(true)}
        className="w-full rounded-lg bg-primary-dark px-6 py-3 text-center font-bold text-white hover:bg-primary-dark/90 focus:outline-none focus:ring-2 focus:ring-primary-dark focus:ring-offset-2"
      >
        <span className="flex items-center justify-center gap-2">
          <BookmarkIcon className="h-5 w-5" />
          {isInAnyCollection ? "Saved" : "Save"}
        </span>
      </button>

      <RemoveFromCollectionDialog
        isOpen={isDialogOpen && isInAnyCollection}
        onClose={handleCloseDialog}
        game={game}
      />
      <AddToCollectionDialog
        isOpen={isDialogOpen && !isInAnyCollection}
        onClose={handleCloseDialog}
        game={game}
      />
    </div>
  );
}
