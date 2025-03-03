import { db } from './firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';

export async function addGameToCollection(collectionId: string, gameId: string) {
  const collectionRef = doc(db, 'collections', collectionId);
  await updateDoc(collectionRef, {
    gameIds: arrayUnion(gameId),
    updatedAt: new Date(),
  });
}
