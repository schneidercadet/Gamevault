"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface DeleteCollectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  collectionName: string;
}

export default function DeleteCollectionDialog({
  isOpen,
  onClose,
  onConfirm,
  collectionName,
}: DeleteCollectionDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-background border border-background-lighter">
        <DialogHeader className="space-y-3 pb-4 border-b border-background-lighter">
          <DialogTitle className="text-xl font-bold text-foreground">Delete Collection</DialogTitle>
          <DialogDescription className="text-foreground-muted">
            Are you sure you want to delete <span className="font-medium text-foreground">{collectionName}</span>? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="pt-6">
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="bg-background hover:bg-background-lighter"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={onConfirm}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Delete
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
