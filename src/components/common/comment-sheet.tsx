
'use client';

import { useState, useEffect, FormEvent } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Loader2, Send } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

export type Dataset = {
  id: string;
  title: string;
  createdAt: any;
  userEmail: string;
  data: any[];
};

type Comment = {
  id: string;
  text: string;
  userEmail: string;
  userId: string;
  createdAt: string;
  userPhotoURL?: string;
};

interface CommentSheetProps {
  workspaceId: string;
  dataset: Dataset | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommentSheet({ workspaceId, dataset, isOpen, onOpenChange }: CommentSheetProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    if (!workspaceId || !dataset || !isOpen) {
      setComments([]);
      return;
    }

    setLoading(true);
    const commentsRef = collection(db, 'workspaces', workspaceId, 'datasets', dataset.id, 'comments');
    const q = query(commentsRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedComments: Comment[] = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        let createdAtString = 'Just now';
        if (data.createdAt instanceof Timestamp) {
          createdAtString = data.createdAt.toDate().toLocaleString();
        }
        return {
          id: doc.id,
          text: data.text,
          userEmail: data.userEmail,
          userId: data.userId,
          userPhotoURL: data.userPhotoURL,
          createdAt: createdAtString,
        };
      });
      setComments(fetchedComments);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching comments: ", error);
      toast({
        variant: "destructive",
        title: "Could not load comments",
        description: "Please check your Firestore rules and internet connection.",
      });
      setLoading(false);
    });

    return () => unsubscribe();
  }, [workspaceId, dataset, isOpen, toast]);

  const handlePostComment = async (e: FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user || !dataset || !workspaceId) return;

    setPosting(true);
    try {
      const commentsRef = collection(db, 'workspaces', workspaceId, 'datasets', dataset.id, 'comments');
      await addDoc(commentsRef, {
        text: newComment,
        userId: user.uid,
        userEmail: user.email,
        userPhotoURL: user.photoURL || null,
        createdAt: serverTimestamp(),
      });
      setNewComment('');
    } catch (error) {
      console.error("Error posting comment: ", error);
      toast({
        variant: "destructive",
        title: "Failed to post comment",
        description: "There was an error sending your comment. Please try again.",
      });
    } finally {
      setPosting(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Comments for "{dataset?.title}"</SheetTitle>
          <SheetDescription>
            Discuss this dataset with your team.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 min-h-0">
          <ScrollArea className="h-full pr-4">
            {loading ? (
              <div className="flex justify-center items-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : comments.length > 0 ? (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex items-start gap-3">
                    <Avatar className="h-8 w-8 border">
                      <AvatarImage src={comment.userPhotoURL} />
                      <AvatarFallback>{comment.userEmail?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">{comment.userEmail}</Badge>
                        <span className="text-xs text-muted-foreground">{comment.createdAt}</span>
                      </div>
                      <p className="text-sm mt-1">{comment.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground pt-12">
                <p>No comments yet.</p>
                <p className="text-xs">Be the first to start the conversation!</p>
              </div>
            )}
          </ScrollArea>
        </div>
        <SheetFooter>
          <form onSubmit={handlePostComment} className="flex w-full gap-2 pt-4 border-t">
            <Input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              disabled={posting || loading || !user}
            />
            <Button type="submit" size="icon" disabled={!newComment.trim() || posting || loading || !user}>
              {posting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              <span className="sr-only">Post Comment</span>
            </Button>
          </form>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
