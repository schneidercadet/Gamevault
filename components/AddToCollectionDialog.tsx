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
import { useError } from "@/contexts/ErrorContext";
import { auth } from "@/lib/firebase";
import { useAuthContext } from "@/components/AuthProvider"; // Import useAuthContext

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
  const { setError } = useError();
  const { user } = useAuthContext(); // Get user from AuthContext

  const handleToggleCollection = async (collectionId: string) => {
    // Try getting user from both direct auth and context for redundancy
    const currentUser = auth.currentUser || user;
    
    if (!currentUser) {
      console.error("User not authenticated - from both direct check and context");
      setError(new Error('You must be logged in to add games to your collection'));
      return;
    }
    
    setIsAdding(true);
    console.log(`Attempting to add game ${game.id} to collection ${collectionId}`, {
      userId: currentUser.uid,
      authMethod: auth.currentUser ? 'direct' : 'context'
    });
    
    try {
      const success = await addGameToCollection(collectionId, game.id.toString());
      if (!success) {
        console.error(`Failed to add game ${game.id} to collection ${collectionId}`);
        setError(new Error(`Failed to add game to collection "${collectionId}"`));
      } else {
        console.log(`Successfully added game ${game.id} to collection ${collectionId}`);
        onClose();
      }
    } catch (error) {
      console.error(`Error adding game ${game.id} to collection ${collectionId}:`, error);
      setError(
        error instanceof Error
          ? error
          : new Error(`Failed to add game to collection "${collectionId}"`)
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
