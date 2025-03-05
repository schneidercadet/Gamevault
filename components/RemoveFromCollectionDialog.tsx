"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Game, GameDetails } from "@/types/game";
import useCollections from "@/hooks/useCollections";

interface RemoveFromCollectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  game: Game | GameDetails;
}

export default function RemoveFromCollectionDialog({
  isOpen,
  onClose,
  game,
}: RemoveFromCollectionDialogProps) {
  const [isRemoving, setIsRemoving] = useState(false);
  const { collections, removeGameFromCollection } = useCollections();

  const handleToggleCollection = async (collectionId: string) => {
    setIsRemoving(true);
    try {
      const success = await removeGameFromCollection(
        collectionId,
        game.id.toString()
      );
      if (!success) {
        console.error("Failed to remove game from collection");
      } else {
        onClose();
      }
    } catch (error) {
      console.error(
        error instanceof Error
          ? error.message
          : "Failed to remove game from collection"
      );
    } finally {
      setIsRemoving(false);
    }
  };

  // Get collections that have this game
  const collectionsWithGame = collections.filter((collection) =>
    (collection.gameIds || []).includes(game.id.toString())
  );

  if (collectionsWithGame.length === 0) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-background border border-background-lighter">
        <DialogHeader className="space-y-3 pb-4 border-b border-background-lighter">
          <DialogTitle className="text-xl font-bold text-foreground">Remove from Collections</DialogTitle>
          <DialogDescription className="text-foreground-muted">
            Select collections to remove <span className="font-medium text-foreground">{game.title}</span> from
          </DialogDescription>
        </DialogHeader>
        <div className="py-6 space-y-5">
          {collectionsWithGame.map((collection) => (
            <div key={collection.id} className="group flex items-center justify-between space-x-4 p-3 rounded-lg hover:bg-background-lighter transition-colors">
              <div className="flex-1">
                <label
                  htmlFor={collection.id}
                  className="block text-base font-medium text-foreground cursor-pointer"
                >
                  {collection.name}
                </label>
                <p className="text-sm text-foreground-muted mt-0.5">
                  {collection.gameIds?.length || 0} {collection.gameIds?.length === 1 ? 'game' : 'games'}
                </p>
              </div>
              <Checkbox
                id={collection.id}
                checked={true}
                onCheckedChange={() => handleToggleCollection(collection.id)}
                disabled={isRemoving}
                className="h-5 w-5 border-2 border-primary-dark data-[state=checked]:bg-primary-dark data-[state=checked]:border-primary-dark"
              />
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
