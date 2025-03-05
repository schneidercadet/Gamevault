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

interface AddToCollectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  game: Game | GameDetails;
}

export default function AddToCollectionDialog({
  isOpen,
  onClose,
  game,
}: AddToCollectionDialogProps) {
  const [isAdding, setIsAdding] = useState(false);
  const { collections, addGameToCollection } = useCollections();

  const handleToggleCollection = async (collectionId: string) => {
    setIsAdding(true);
    try {
      const success = await addGameToCollection(collectionId, game.id.toString());
      if (!success) {
        console.error("Failed to add game to collection");
      } else {
        onClose();
      }
    } catch (error) {
      console.error(
        error instanceof Error
          ? error.message
          : "Failed to add game to collection"
      );
    } finally {
      setIsAdding(false);
    }
  };

  // Get collections that don't have this game
  const collectionsWithoutGame = collections.filter(
    (collection) =>
      !(collection.gameIds || []).includes(game.id.toString())
  );

  if (collectionsWithoutGame.length === 0) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-background border border-background-lighter">
        <DialogHeader className="space-y-3 pb-4 border-b border-background-lighter">
          <DialogTitle className="text-xl font-bold text-foreground">Add to Collections</DialogTitle>
          <DialogDescription className="text-foreground-muted">
            Select collections to add <span className="font-medium text-foreground">{game.title}</span> to
          </DialogDescription>
        </DialogHeader>
        <div className="py-6 space-y-5">
          {collectionsWithoutGame.map((collection) => (
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
                checked={false}
                onCheckedChange={() => handleToggleCollection(collection.id)}
                disabled={isAdding}
                className="h-5 w-5 border-2 border-primary-dark data-[state=checked]:bg-primary-dark data-[state=checked]:border-primary-dark"
              />
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
