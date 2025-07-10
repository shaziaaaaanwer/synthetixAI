"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Users,
  AlertTriangle,
  Loader2,
  PlusCircle,
  Crown,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { CodeBlock } from "@/components/common/code-block";
import Link from "next/link";
import { deleteWorkspaceAction } from "./actions";

export type Member = {
  uid: string;
  email: string;
  role: "owner" | "editor" | "viewer";
};

export type Workspace = {
  id: string;
  name: string;
  ownerId: string;
  members: Member[];
  memberUids: string[];
};

const correctedRules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /workspaces/{workspaceId} {
      
      // Allow a user to get a workspace doc if they are a member.
      allow get: if request.auth.uid in resource.data.memberUids;
      
      // Securely allow a user to query for the list of workspaces they belong to.
      allow list: if request.auth.uid != null &&
                  request.query.where.get("memberUids") != null &&
                  request.query.where.get("memberUids")[1] == "array-contains" &&
                  request.query.where.get("memberUids")[2] == request.auth.uid;

      // Allow a user to create a workspace, making sure they are the owner.
      allow create: if request.auth.uid != null && 
                     request.auth.uid == request.resource.data.ownerId;
      
      // For now, allow any member of the workspace to update it (e.g., add members).
      // We can make this more granular later.
      allow update: if request.auth.uid in resource.data.memberUids;

      // Only the owner can delete the entire workspace.
      allow delete: if request.auth.uid == resource.data.ownerId;

      // Rules for subcollections
      match /datasets/{datasetId} {
        // Any member of the workspace can read, create, update, or delete datasets.
        allow read, write: if request.auth.uid in get(/databases/$(database)/documents/workspaces/$(workspaceId)).data.memberUids;

        match /comments/{commentId} {
          allow read, create: if request.auth.uid in get(/databases/$(database)/documents/workspaces/$(workspaceId)).data.memberUids;
          // Only the author of a comment can delete it.
          allow delete: if request.auth.uid != null && request.auth.uid == resource.data.userId;
        }
      }
    }
  }
}`;

export default function WorkspacePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [workspaceToDelete, setWorkspaceToDelete] = useState<Workspace | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const workspacesRef = collection(db, "workspaces");
    const q = query(
      workspacesRef,
      where("memberUids", "array-contains", user.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const fetchedWorkspaces: Workspace[] = querySnapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            } as Workspace)
        );

        setWorkspaces(fetchedWorkspaces);
        setError(null);
        setLoading(false);
      },
      (e: any) => {
        console.error("Error fetching workspaces:", e);
        const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
        const indexUrl = `https://console.firebase.google.com/project/${projectId}/firestore/indexes/composite/create?collectionId=workspaces&queryScope=COLLECTION&field[0].fieldPath=memberUids&field[0].order=ASCENDING`;

        if (e.code === "failed-precondition" && e.message.includes("index")) {
          setError(
            `This query requires a database index that hasn't been created yet. Please visit this direct link to create the required index in the Firebase console: ${indexUrl}`
          );
        } else {
          setError(
            `Permission Denied. Your Firestore security rules are blocking access. This is a common setup issue. Please go to your Firebase Console → Firestore → Rules and replace the entire content with the corrected code provided below. Raw error: "${e.message}"`
          );
        }
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim() || !user || !user.email) return;
    setIsCreating(true);
    try {
      const workspacesRef = collection(db, "workspaces");
      await addDoc(workspacesRef, {
        name: newWorkspaceName,
        ownerId: user.uid,
        members: [{ uid: user.uid, email: user.email, role: "owner" }],
        memberUids: [user.uid],
        createdAt: serverTimestamp(),
      });

      toast({
        title: "Workspace Created!",
        description: `"${newWorkspaceName}" has been successfully created.`,
      });

      setCreateDialogOpen(false);
      setNewWorkspaceName("");
    } catch (e: any) {
      console.error("Error creating workspace:", e);
      toast({
        variant: "destructive",
        title: "Creation Failed",
        description:
          e.message ||
          "Could not create the workspace. Please check your security rules and try again.",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, workspace: Workspace) => {
    e.preventDefault();
    e.stopPropagation();
    setWorkspaceToDelete(workspace);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteWorkspace = async () => {
    if (!workspaceToDelete) return;
    setIsDeleting(true);

    const result = await deleteWorkspaceAction({
      workspaceId: workspaceToDelete.id,
      userId: user?.uid || "",
    });

    if (result.error) {
      toast({
        variant: "destructive",
        title: "Deletion Failed",
        description: result.error,
      });
    } else {
      toast({
        title: "Workspace Deleted",
        description: `The workspace "${workspaceToDelete.name}" has been permanently removed.`,
      });
    }

    setIsDeleting(false);
    setIsDeleteDialogOpen(false);
    setWorkspaceToDelete(null);
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-start">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Team Workspaces
            </h1>
            <p className="text-muted-foreground">
              Create and manage shared workspaces for your team.
            </p>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Workspace
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create a new workspace</DialogTitle>
                <DialogDescription>
                  Workspaces help you organize your datasets and collaborate
                  with your team.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="workspace-name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="workspace-name"
                    value={newWorkspaceName}
                    onChange={(e) => setNewWorkspaceName(e.target.value)}
                    className="col-span-3"
                    placeholder="e.g., Q4 Marketing Project"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateWorkspace}
                  disabled={isCreating || !newWorkspaceName.trim()}
                >
                  {isCreating && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {loading && (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="sr-only">Loading...</span>
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Could Not Load Workspaces</AlertTitle>
            <AlertDescription>
              <div className="space-y-2">
                <p>{error}</p>
                {error.includes("Permission Denied") && (
                  <CodeBlock code={correctedRules} />
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {!loading && !error && !workspaces.length && (
          <Card className="mt-6">
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground flex flex-col items-center justify-center p-8">
                <Users className="mx-auto h-12 w-12 mb-4" />
                <h3 className="mt-2 text-lg font-semibold">
                  No workspaces found
                </h3>
                <p className="mt-1 text-sm">
                  Get started by creating your first workspace.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {!loading && workspaces.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {workspaces.map((workspace) => (
              <Card
                key={workspace.id}
                className="flex flex-col hover:shadow-md transition-shadow"
              >
                <Link
                  href={`/workspace/${workspace.id}`}
                  className="flex-grow flex flex-col"
                >
                  <CardHeader className="relative">
                    <CardTitle className="text-lg pr-8">
                      {workspace.name}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 text-xs pt-1">
                      <Users className="h-4 w-4" /> {workspace.members.length}{" "}
                      Member(s)
                    </CardDescription>
                    {workspace.ownerId === user?.uid && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={(e) => handleDeleteClick(e, workspace)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent className="flex-1 mt-auto">
                    {workspace.ownerId === user?.uid && (
                      <div className="flex items-center gap-2 text-xs text-amber-600">
                        <Crown className="h-4 w-4" />
                        <span>You are the owner</span>
                      </div>
                    )}
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>
        )}
      </div>
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete "{workspaceToDelete?.name}"?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action is permanent and cannot be undone. This will delete
              the workspace, all its datasets, and all comments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setWorkspaceToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteWorkspace}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Workspace
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
