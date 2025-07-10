// // 'use server';

// // import { db } from '@/lib/firebase';
// // import { doc, getDoc, deleteDoc, collection, getDocs, writeBatch } from 'firebase/firestore';
// // import { auth } from '@/lib/firebase';
// // import { revalidatePath } from 'next/cache';
// // import { z } from 'zod';

// // const deleteWorkspaceSchema = z.object({
// //   workspaceId: z.string().min(1, 'Workspace ID is required.'),
// // });

// // export async function deleteWorkspaceAction(input: { workspaceId: string }) {
// //   const validatedFields = deleteWorkspaceSchema.safeParse(input);

// //   if (!validatedFields.success) {
// //     return { error: 'Invalid workspace ID.' };
// //   }

// //   const { workspaceId } = validatedFields.data;
  
// //   // This server action relies on the auth state from the client,
// //   // but the definitive security check happens in Firestore rules.
// //   // We get the currently logged in user's UID to check ownership.
// //   // In a real app you might get this from a session instead.
// //   const user = auth.currentUser;


// //   if (!user) {
// //     return { error: 'You must be authenticated to delete a workspace.' };
// //   }

// //   const workspaceRef = doc(db, 'workspaces', workspaceId);

// //   try {
// //     const workspaceSnap = await getDoc(workspaceRef);

// //     if (!workspaceSnap.exists()) {
// //       return { error: 'Workspace not found.' };
// //     }

// //     const workspaceData = workspaceSnap.data();

// //     // This check provides a clear error message before Firestore rules would deny it.
// //     if (workspaceData.ownerId !== user.uid) {
// //       return { error: 'Permission denied. Only the owner can delete this workspace.' };
// //     }
    
// //     // NOTE: In a production app with many datasets/comments, this recursive delete
// //     // should be handled by a dedicated Cloud Function to prevent client-side timeouts.
// //     const batch = writeBatch(db);

// //     const datasetsRef = collection(db, 'workspaces', workspaceId, 'datasets');
// //     const datasetsSnap = await getDocs(datasetsRef);

// //     for (const datasetDoc of datasetsSnap.docs) {
// //       const commentsRef = collection(datasetDoc.ref, 'comments');
// //       const commentsSnap = await getDocs(commentsRef);
// //       commentsSnap.forEach((commentDoc) => {
// //         batch.delete(commentDoc.ref);
// //       });
// //       batch.delete(datasetDoc.ref);
// //     }
    
// //     batch.delete(workspaceRef);
// //     await batch.commit();

// //     // Tells Next.js to refresh the data on the workspace list page.
// //     revalidatePath('/workspace');
// //     return { success: true };
// //   } catch (error: any) {
// //     console.error('Error deleting workspace:', error);
// //     return { error: 'An unexpected error occurred while deleting the workspace.' };
// //   }
// // }


// 'use server';

// import { db } from '@/lib/firebase';
// import { doc, getDoc, deleteDoc, collection, getDocs, writeBatch } from 'firebase/firestore';
// import { revalidatePath } from 'next/cache';
// import { z } from 'zod';

// const deleteWorkspaceSchema = z.object({
//   workspaceId: z.string().min(1, 'Workspace ID is required.'),
//   userId: z.string().min(1, 'User ID is required.'),
// });

// // export async function deleteWorkspaceAction(input: { workspaceId: string; userId: string }) {
// //   const validatedFields = deleteWorkspaceSchema.safeParse(input);

// //   if (!validatedFields.success) {
// //     return { error: 'Invalid input.' };
// //   }

// //   const { workspaceId, userId } = validatedFields.data;

// //   const workspaceRef = doc(db, 'workspaces', workspaceId);

// //   try {
// //     const workspaceSnap = await getDoc(workspaceRef);

// //     if (!workspaceSnap.exists()) {
// //       return { error: 'Workspace not found.' };
// //     }

// //     const workspaceData = workspaceSnap.data();

// //     if (workspaceData.ownerId !== userId) {
// //       return { error: 'Permission denied. Only the owner can delete this workspace.' };
// //     }

// //     const batch = writeBatch(db);

// //     const datasetsRef = collection(db, 'workspaces', workspaceId, 'datasets');
// //     const datasetsSnap = await getDocs(datasetsRef);

// //     for (const datasetDoc of datasetsSnap.docs) {
// //       const commentsRef = collection(datasetDoc.ref, 'comments');
// //       const commentsSnap = await getDocs(commentsRef);
// //       commentsSnap.forEach((commentDoc) => {
// //         batch.delete(commentDoc.ref);
// //       });
// //       batch.delete(datasetDoc.ref);
// //     }

// //     batch.delete(workspaceRef);
// //     await batch.commit();

// //     revalidatePath('/workspace');
// //     return { success: true };
// //   } catch (error: any) {
// //     console.error('Error deleting workspace:', error);
// //     return { error: 'An unexpected error occurred while deleting the workspace.' };
// //   }
// // }

// export async function deleteWorkspaceAction(input: { workspaceId: string; userId: string }) {
//   console.log("Received input in server action:", input);

//   const deleteWorkspaceSchema = z.object({
//     workspaceId: z.string().min(1, "Workspace ID is required."),
//     userId: z.string().min(1, "User ID is required."),
//   });

//   const validatedFields = deleteWorkspaceSchema.safeParse(input);

//   if (!validatedFields.success) {
//     return { error: "Invalid input." };
//   }

//   const { workspaceId, userId } = validatedFields.data;

//   const workspaceRef = doc(db, "workspaces", workspaceId);

//   try {
//     const workspaceSnap = await getDoc(workspaceRef);

//     if (!workspaceSnap.exists()) {
//       return { error: "Workspace not found." };
//     }

//     const workspaceData = workspaceSnap.data();

//     console.log("workspaceData.ownerId:", workspaceData.ownerId, "userId:", userId);

//     if (workspaceData.ownerId !== userId) {
//       return { error: "Permission denied. Only the owner can delete this workspace." };
//     }

//     // delete all nested documents using batch
//     const batch = writeBatch(db);

//     const datasetsRef = collection(db, "workspaces", workspaceId, "datasets");
//     const datasetsSnap = await getDocs(datasetsRef);

//     for (const datasetDoc of datasetsSnap.docs) {
//       const commentsRef = collection(datasetDoc.ref, "comments");
//       const commentsSnap = await getDocs(commentsRef);
//       commentsSnap.forEach((commentDoc) => {
//         batch.delete(commentDoc.ref);
//       });
//       batch.delete(datasetDoc.ref);
//     }

//     batch.delete(workspaceRef);
//     await batch.commit();

//     revalidatePath("/workspace");
//     return { success: true };
//   } catch (error: any) {
//     console.error("Error deleting workspace:", error?.message || error);
//     return { error: error?.message || "An unexpected error occurred while deleting the workspace." };
//   }
// }



'use server'

import { db } from '@/lib/firebase'
import { doc, getDoc, deleteDoc, collection, getDocs, writeBatch } from 'firebase/firestore'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const deleteWorkspaceSchema = z.object({
  workspaceId: z.string().min(1, 'Workspace ID is required.'),
  userId: z.string().min(1, 'User ID is required.'),
})

export async function deleteWorkspaceAction(input: { workspaceId: string, userId: string }) {
  const validatedFields = deleteWorkspaceSchema.safeParse(input)

  if (!validatedFields.success) {
    return { error: 'Invalid input.' }
  }

  const { workspaceId, userId } = validatedFields.data
  const workspaceRef = doc(db, 'workspaces', workspaceId)

  try {
    const workspaceSnap = await getDoc(workspaceRef)

    if (!workspaceSnap.exists()) {
      return { error: 'Workspace not found.' }
    }

    const workspaceData = workspaceSnap.data()

    if (workspaceData.ownerId !== userId) {
      return { error: 'Permission denied. Only the owner can delete this workspace.' }
    }

    const batch = writeBatch(db)

    const datasetsRef = collection(db, 'workspaces', workspaceId, 'datasets')
    const datasetsSnap = await getDocs(datasetsRef)

    for (const datasetDoc of datasetsSnap.docs) {
      const commentsRef = collection(datasetDoc.ref, 'comments')
      const commentsSnap = await getDocs(commentsRef)

      commentsSnap.forEach((commentDoc) => {
        batch.delete(commentDoc.ref)
      })

      batch.delete(datasetDoc.ref)
    }

    batch.delete(workspaceRef)
    await batch.commit()

    revalidatePath('/workspace')
    return { success: true }
  } catch (error: any) {
    console.error('Error deleting workspace:', error)
    return { error: 'An unexpected error occurred while deleting the workspace.' }
  }
}
