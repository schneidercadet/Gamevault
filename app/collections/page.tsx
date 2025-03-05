/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useAuthContext } from "@/components/AuthProvider";
import GameCard from "@/components/GameCard";
import { useState } from "react";
import useCollections from "@/hooks/useCollections";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TrashIcon } from "@heroicons/react/24/outline";
import BackButton from "@/components/BackButton";
import Image from "next/image";
import DeleteCollectionDialog from "@/components/DeleteCollectionDialog";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EllipsisVerticalIcon, PencilIcon } from "@heroicons/react/24/outline";
import { Spinner } from "@/components/ui/spinner";

export default function CollectionsPage() {
  const { user } = useAuthContext();
  const [activeCollection, setActiveCollection] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [collectionToDelete, setCollectionToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [collectionToRename, setCollectionToRename] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [newCollectionDesc, setNewCollectionDesc] = useState("");
  const [sortOrder, setSortOrder] = useState<
    "newest" | "oldest" | "rating" | "title"
  >("newest");

  const {
    collections,
    loading,
    error,
    createCollection,
    getCollectionGames,
    deleteCollection,
    removeGameFromCollection,
    updateCollection,
  } = useCollections();

  if (!user) {
    return null;
  }

  const currentCollection =
    activeCollection === "all"
      ? null
      : collections.find((c) => c.id === activeCollection);

  const games =
    activeCollection === "all"
      ? getCollectionGames("all")
      : currentCollection
        ? getCollectionGames(currentCollection.id)
        : [];

  // Sort games based on selected order
  const sortedGames = [...games].sort((a, b) => {
    switch (sortOrder) {
      case "newest":
        const bDate = b.releaseDate ? new Date(b.releaseDate).getTime() : 0;
        const aDate = a.releaseDate ? new Date(a.releaseDate).getTime() : 0;
        return bDate - aDate;
      case "oldest":
        const aDateOld = a.releaseDate ? new Date(a.releaseDate).getTime() : 0;
        const bDateOld = b.releaseDate ? new Date(b.releaseDate).getTime() : 0;
        return aDateOld - bDateOld;
      case "rating":
        return (b.rating || 0) - (a.rating || 0);
      case "title":
        return (a.name || "").localeCompare(b.name || "");
      default:
        return 0;
    }
  });

  const handleDeleteCollection = async (collectionId: string) => {
    try {
      const success = await deleteCollection(collectionId);
      if (!success) {
        console.error("Failed to delete collection");
      }
      if (success) {
        setActiveCollection("all");
      }
    } catch (error) {
      console.error(
        error instanceof Error
          ? error.message
          : "Failed to delete collection"
      );
    } finally {
      setCollectionToDelete(null);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleRenameCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collectionToRename) return;

    try {
      const success = await updateCollection(collectionToRename.id, {
        name: newCollectionName,
      });
      if (!success) {
        console.error("Failed to rename collection");
      }
    } catch (error) {
      console.error(
        error instanceof Error
          ? error.message
          : "Failed to rename collection"
      );
    } finally {
      setCollectionToRename(null);
      setIsRenameDialogOpen(false);
      setNewCollectionName("");
    }
  };

  const openDeleteDialog = (collection: { id: string; name: string }) => {
    setCollectionToDelete(collection);
    setIsDeleteDialogOpen(true);
  };

  const openRenameDialog = (collection: { id: string; name: string }) => {
    setCollectionToRename(collection);
    setIsRenameDialogOpen(true);
    setNewCollectionName(collection.name);
  };

  const handleRemoveGame = async (gameId: string) => {
    if (!currentCollection) return;
    try {
      const success = await removeGameFromCollection(
        currentCollection.id,
        gameId
      );
      if (!success) {
        console.error("Failed to remove game from collection");
      }
    } catch (error) {
      console.error(
        error instanceof Error
          ? error.message
          : "Failed to remove game from collection"
      );
    }
  };

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollectionName.trim()) return;

    const collection = await createCollection(
      newCollectionName.trim(),
      newCollectionDesc.trim() || undefined
    );

    if (collection) {
      setNewCollectionName("");
      setNewCollectionDesc("");
      setIsCreateDialogOpen(false);
      setActiveCollection(collection.id);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <BackButton className="mb-6" />
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">My Collections</h1>
        <button
          onClick={() => setIsCreateDialogOpen(true)}
          className="rounded-md bg-primary-dark px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark/90 focus:outline-none focus:ring-2 focus:ring-primary-dark focus:ring-offset-2"
        >
          Create Collection
        </button>
      </div>

      {/* Collection Navigation */}
      <div className="mb-8">
        <nav className="flex flex-wrap gap-4" aria-label="Collections">
          <div
            onClick={() => setActiveCollection("all")}
            className={`group relative flex cursor-pointer items-center justify-between gap-2 rounded-lg px-4 py-3 text-left transition-colors ${
              activeCollection === "all"
                ? "bg-primary-dark text-white"
                : "hover:bg-background-lighter"
            }`}
          >
            <span className="font-medium">All Games</span>
            <span className="bg-background-lighter ml-2 rounded-full px-2 py-0.5 text-xs">
              {getCollectionGames("all").length}
            </span>
          </div>
          {collections.map((collection) => (
            <div
              key={collection.id}
              onClick={() => setActiveCollection(collection.id)}
              className={`group relative flex cursor-pointer items-center justify-between gap-2 rounded-lg px-4 py-3 text-left transition-colors ${
                activeCollection === collection.id
                  ? "bg-primary-dark text-white"
                  : "hover:bg-background-lighter"
              }`}
            >
              <span className="font-medium">{collection.name}</span>
              <div className="flex items-center gap-2">
                <span className="bg-background-lighter rounded-full px-2 py-0.5 text-xs">
                  {getCollectionGames(collection.id).length}
                </span>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    asChild
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      className={`rounded-full p-1.5 transition-colors ${
                        activeCollection === collection.id
                          ? "hover:bg-primary-dark/90"
                          : "hover:bg-background"
                      }`}
                    >
                      <EllipsisVerticalIcon className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-48 rounded-lg border border-background-lighter bg-background p-1 shadow-lg"
                  >
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        openRenameDialog(collection);
                      }}
                      className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-foreground hover:bg-background-lighter"
                    >
                      <PencilIcon className="h-4 w-4" />
                      Rename Collection
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        openDeleteDialog(collection);
                      }}
                      className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-red-500 hover:bg-background-lighter"
                    >
                      <TrashIcon className="h-4 w-4" />
                      Delete Collection
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Collection Content */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold">
              {activeCollection === "all"
                ? "All Games"
                : collections.find((c) => c.id === activeCollection)?.name}
            </h2>
          </div>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as typeof sortOrder)}
            className="rounded-lg border border-background-lighter bg-background px-3 py-2 text-sm focus:border-primary-dark focus:outline-none focus:ring-1 focus:ring-primary-dark"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="rating">Highest Rated</option>
            <option value="title">A-Z</option>
          </select>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {loading ? (
            <div className="col-span-full flex min-h-[300px] items-center justify-center">
              <Spinner className="h-8 w-8 text-primary-dark" />
            </div>
          ) : sortedGames.length === 0 ? (
            <div className="col-span-full flex min-h-[300px] flex-col items-center justify-center gap-4 rounded-lg bg-background-lighter p-8">
              <p className="text-foreground-muted text-center text-lg">
                {activeCollection === "all"
                  ? "You haven't added any games yet."
                  : "This collection is empty."}
              </p>
              <div className="flex gap-4">
                <Link
                  href="/games"
                  className="rounded-md bg-primary-dark px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark/90"
                >
                  Browse Games
                </Link>
              </div>
            </div>
          ) : (
            sortedGames.map((game, index) => (
              <div key={game.id} className="group relative">
                <GameCard
                  game={{
                    ...game,
                    platform: game.platform || "Unknown",
                    genre: game.genre || "Unknown",
                    rating: game.rating || 0,
                    title: game.title || "Unknown Game",
                    coverUrl: game.coverUrl || null,
                  }}
                  inCollection={true}
                  onRemove={() => handleRemoveGame(game.id.toString())}
                  priority={index < 6}
                >
                  <Image
                    src={game.coverUrl || "/placeholder.jpg"}
                    alt={game.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="rounded-t-lg object-cover transition-all group-hover:brightness-50"
                    priority={true}
                    loading="eager"
                  />
                </GameCard>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create Collection Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Collection</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateCollection} className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="text-foreground-muted block text-sm font-medium"
              >
                Collection Name
              </label>
              <input
                type="text"
                id="name"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                className="border-background-lighter placeholder-foreground-muted mt-1 block w-full rounded-md border bg-background px-3 py-2 text-foreground focus:border-primary-dark focus:outline-none focus:ring-1 focus:ring-primary-dark"
                placeholder="Enter collection name"
                required
              />
            </div>
            <div>
              <label
                htmlFor="description"
                className="text-foreground-muted block text-sm font-medium"
              >
                Description (Optional)
              </label>
              <textarea
                id="description"
                value={newCollectionDesc}
                onChange={(e) => setNewCollectionDesc(e.target.value)}
                className="border-background-lighter placeholder-foreground-muted mt-1 block w-full rounded-md border bg-background px-3 py-2 text-foreground focus:border-primary-dark focus:outline-none focus:ring-1 focus:ring-primary-dark"
                placeholder="Enter collection description"
                rows={3}
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setIsCreateDialogOpen(false)}
                className="border-background-lighter hover:bg-background-lighter rounded-md border px-4 py-2 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary-dark focus:ring-offset-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-md bg-primary-dark px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark/90 focus:outline-none focus:ring-2 focus:ring-primary-dark focus:ring-offset-2"
              >
                Create
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Rename Collection Dialog */}
      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Collection</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleRenameCollection} className="space-y-4">
            <div>
              <label
                htmlFor="rename-name"
                className="text-foreground-muted block text-sm font-medium"
              >
                Collection Name
              </label>
              <input
                type="text"
                id="rename-name"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                className="border-background-lighter placeholder-foreground-muted mt-1 block w-full rounded-md border bg-background px-3 py-2 text-foreground focus:border-primary-dark focus:outline-none focus:ring-1 focus:ring-primary-dark"
                placeholder="Enter new collection name"
                required
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsRenameDialogOpen(false)}
                className="rounded-md border border-background-lighter px-4 py-2 text-sm font-semibold text-foreground hover:bg-background-lighter"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-md bg-primary-dark px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark/90"
              >
                Rename
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Collection Dialog */}
      <DeleteCollectionDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setCollectionToDelete(null);
        }}
        onConfirm={() =>
          collectionToDelete && handleDeleteCollection(collectionToDelete.id)
        }
        collectionName={collectionToDelete?.name || ""}
      />
    </div>
  );
}
