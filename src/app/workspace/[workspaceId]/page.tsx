
"use client"

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, doc, onSnapshot, query, orderBy, updateDoc, arrayUnion, deleteDoc } from 'firebase/firestore';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Users, AlertTriangle, FileText, Crown, PlusCircle, MessageSquare, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { DatasetViewer } from '@/components/common/dataset-viewer';
import { CommentSheet } from '@/components/common/comment-sheet';
import type { Dataset as DatasetType } from '@/components/common/comment-sheet';


export type Member = {
    uid: string;
    email: string;
    role: 'owner' | 'editor' | 'viewer';
};

export type Workspace = {
    id: string;
    name:string;
    ownerId: string;
    members: Member[];
    memberUids: string[];
};

export default function WorkspaceDetailPage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.workspaceId as string;
  const { toast } = useToast();

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [datasets, setDatasets] = useState<DatasetType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isCommentSheetOpen, setIsCommentSheetOpen] = useState(false);
  const [selectedDataset, setSelectedDataset] = useState<DatasetType | null>(null);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [datasetToDelete, setDatasetToDelete] = useState<DatasetType | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [isInviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberUid, setNewMemberUid] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<'editor' | 'viewer'>('viewer');
  const [isInviting, setIsInviting] = useState(false);


  useEffect(() => {
    if (!workspaceId || !user) return;

    const workspaceRef = doc(db, 'workspaces', workspaceId);

    const unsubscribeWorkspace = onSnapshot(workspaceRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as Omit<Workspace, 'id'>;
        const ws = { id: docSnap.id, ...data };
        
        if (ws.memberUids.includes(user.uid)) {
            setWorkspace(ws);
            setError(null);
        } else {
            setWorkspace(null);
            setError("Access Denied: You are not a member of this workspace.");
        }

      } else {
        setError('Workspace not found.');
        setWorkspace(null);
      }
      setLoading(false);
    }, (err) => {
      console.error(err);
      setError('Failed to load workspace data. This might be a security rules issue.');
      setLoading(false);
    });

    const datasetsRef = collection(db, 'workspaces', workspaceId, 'datasets');
    const q = query(datasetsRef, orderBy('createdAt', 'desc'));

    const unsubscribeDatasets = onSnapshot(q, (querySnapshot) => {
      const fetchedDatasets: DatasetType[] = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as DatasetType));
      setDatasets(fetchedDatasets);
    }, (err) => {
        console.error("Dataset fetch error:", err);
        setError("Failed to load datasets. This is likely a security rules issue in your Firestore configuration.");
    });


    return () => {
      unsubscribeWorkspace();
      unsubscribeDatasets();
    };
  }, [workspaceId, user, router]);


  const handleOpenComments = (dataset: DatasetType) => {
    setSelectedDataset(dataset);
    setIsCommentSheetOpen(true);
  };
  
  const handleOpenDeleteDialog = (dataset: DatasetType) => {
    setDatasetToDelete(dataset);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteDataset = async () => {
    if (!datasetToDelete || !workspaceId) return;
    setIsDeleting(true);

    try {
        const datasetRef = doc(db, 'workspaces', workspaceId, 'datasets', datasetToDelete.id);
        await deleteDoc(datasetRef);

        toast({
            title: "Dataset Deleted",
            description: `The dataset has been removed.`,
        });
    } catch(err: any) {
        console.error("Error deleting dataset:", err);
        toast({
            variant: "destructive",
            title: "Failed to Delete Dataset",
            description: err.message || "An unexpected error occurred.",
        });
    } finally {
        setIsDeleting(false);
        setIsDeleteDialogOpen(false);
        setDatasetToDelete(null);
    }
  }

  const handleInviteMember = async () => {
    if (!newMemberUid.trim() || !newMemberEmail.trim() || !workspace) return;
    setIsInviting(true);

    if (workspace.memberUids.includes(newMemberUid)) {
        toast({ variant: "destructive", title: "User is already a member." });
        setIsInviting(false);
        return;
    }

    try {
        const workspaceRef = doc(db, 'workspaces', workspace.id);
        const newMember: Member = { uid: newMemberUid, email: newMemberEmail, role: newMemberRole };

        await updateDoc(workspaceRef, {
            members: arrayUnion(newMember),
            memberUids: arrayUnion(newMemberUid)
        });

        toast({ title: "Member Added!", description: `${newMemberEmail} has been added to the workspace.` });
        setInviteDialogOpen(false);
        setNewMemberEmail("");
        setNewMemberUid("");

    } catch(error: any) {
        console.error("Error adding member:", error);
        toast({ variant: "destructive", title: "Failed to Add Member", description: error.message || "An unexpected error occurred." });
    } finally {
        setIsInviting(false);
    }
  }


  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!workspace) {
    return null; // or a 'not found' component
  }
  
  const isOwner = workspace.ownerId === user?.uid;

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-start">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{workspace.name}</h1>
            </div>
        </div>

        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Members</CardTitle>
                    <CardDescription>{workspace.members.length} member(s) in this workspace.</CardDescription>
                </div>
                {isOwner && (
                    <Dialog open={isInviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm">
                                <PlusCircle className="mr-2 h-4 w-4" /> Add Member
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add a new member</DialogTitle>
                                <DialogDescription>
                                    Enter the Firebase UID and email of the user you want to invite. For security, we use the unguessable Firebase UID to identify users. You can find a user's UID in your Firebase Authentication console.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="uid-input">User UID</Label>
                                    <Input id="uid-input" value={newMemberUid} onChange={(e) => setNewMemberUid(e.target.value)} placeholder="Firebase User ID" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email-input">User Email</Label>
                                    <Input id="email-input" type="email" value={newMemberEmail} onChange={(e) => setNewMemberEmail(e.target.value)} placeholder="user@example.com" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="role-select">Role</Label>
                                    <Select value={newMemberRole} onValueChange={(value) => setNewMemberRole(value as 'editor' | 'viewer')}>
                                        <SelectTrigger id="role-select">
                                            <SelectValue placeholder="Select a role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="editor">Editor</SelectItem>
                                            <SelectItem value="viewer">Viewer</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>Cancel</Button>
                                <Button onClick={handleInviteMember} disabled={isInviting || !newMemberUid || !newMemberEmail}>
                                    {isInviting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Add Member
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {workspace.members.map((member) => (
                        <div key={member.uid} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Users className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <p className="font-medium">{member.email}</p>
                                    <p className="text-sm text-muted-foreground capitalize">{member.role}</p>
                                </div>
                            </div>
                             <div className="flex items-center gap-2">
                                {member.role === 'owner' && <Crown className="h-5 w-5 text-amber-500" />}
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>


        <div>
            <h2 className="text-2xl font-semibold tracking-tight">Datasets</h2>
            {datasets.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-4">
                {datasets.map((dataset) => (
                    <Card key={dataset.id} className="flex flex-col">
                      <Dialog>
                          <DialogTrigger asChild>
                              <div className="flex-grow cursor-pointer hover:bg-accent/50 transition-colors">
                                  <CardHeader>
                                      <CardTitle className='flex items-center gap-2'><FileText className="h-5 w-5 text-primary" /> {dataset.title || `Dataset ${dataset.id}`}</CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                      <p className="text-sm text-muted-foreground">
                                          Created by: <span className='font-mono text-xs'>{dataset.userEmail}</span>
                                      </p>
                                      <p className="text-sm text-muted-foreground">
                                          On: {dataset.createdAt?.toDate() ? new Date(dataset.createdAt.toDate()).toLocaleDateString() : 'Date not available'}
                                      </p>
                                  </CardContent>
                              </div>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl h-5/6 flex flex-col">
                             <DatasetViewer 
                                  data={JSON.stringify(dataset.data, null, 2)}
                                  title={dataset.title}
                              />
                          </DialogContent>
                      </Dialog>
                      <CardFooter className="p-2 border-t flex items-center gap-1">
                          <Button variant="ghost" className="w-full justify-center text-sm" onClick={() => handleOpenComments(dataset)}>
                              <MessageSquare className="mr-2 h-4 w-4" /> Comments
                          </Button>
                          <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 shrink-0" onClick={() => handleOpenDeleteDialog(dataset)}>
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete Dataset</span>
                          </Button>
                      </CardFooter>
                    </Card>
                ))}
                </div>
            ) : (
                <Card className="mt-4">
                    <CardContent className="pt-6">
                    <div className="text-center text-muted-foreground flex flex-col items-center justify-center p-8">
                        <FileText className="mx-auto h-12 w-12 mb-4" />
                        <h3 className="mt-2 text-lg font-semibold">No datasets yet</h3>
                        <p className="mt-1 text-sm">
                          Generate some data and save it to this workspace to get started.
                        </p>
                    </div>
                    </CardContent>
                </Card>
            )}
        </div>
      </div>

      {/* Dialogs and Sheets */}
      <CommentSheet 
          workspaceId={workspaceId}
          dataset={selectedDataset}
          isOpen={isCommentSheetOpen}
          onOpenChange={setIsCommentSheetOpen}
      />
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                   This action cannot be undone. This will permanently delete the dataset "{datasetToDelete?.title}" and all associated comments.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setDatasetToDelete(null)}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                    onClick={handleDeleteDataset}
                    disabled={isDeleting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                    {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Continue
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
