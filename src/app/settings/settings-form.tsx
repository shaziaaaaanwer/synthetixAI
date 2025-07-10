
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/hooks/use-auth';
import { auth } from '@/lib/firebase';
import { updateProfile, deleteUser, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, User, Palette, Key, AlertTriangle } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { Alert } from '@/components/ui/alert';


// Schema for profile form
const profileSchema = z.object({
  displayName: z.string().min(2, "Name must be at least 2 characters."),
});

// Key for GitHub token in local storage
const GITHUB_TOKEN_KEY = 'github-pat';

export function SettingsForm() {
  const { user, loading } = useAuth();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isSavingToken, setIsSavingToken] = useState(false);
  
  const [githubToken, setGithubToken] = useState('');
  
  const [isReauthDialogOpen, setIsReauthDialogOpen] = useState(false);
  const [passwordForReauth, setPasswordForReauth] = useState('');


  const { register, handleSubmit, formState: { errors }, setValue } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: ""
    }
  });
  
  // Pre-fill forms when user data is loaded
  useEffect(() => {
    if (user) {
      setValue('displayName', user.displayName || '');
    }
    const storedToken = localStorage.getItem(GITHUB_TOKEN_KEY);
    if (storedToken) {
      setGithubToken(storedToken);
    }
  }, [user, setValue]);

  const onProfileSubmit = async (data: any) => {
    if (!user) return;
    setIsSavingProfile(true);
    try {
      await updateProfile(user, { displayName: data.displayName });
      toast({ title: 'Profile Updated', description: 'Your display name has been changed.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Update Failed', description: error.message });
    } finally {
      setIsSavingProfile(false);
    }
  };
  
  const handleSaveToken = () => {
    setIsSavingToken(true);
    localStorage.setItem(GITHUB_TOKEN_KEY, githubToken);
    toast({ title: 'GitHub Token Saved', description: 'Your token has been saved in this browser.' });
    setIsSavingToken(false);
  };
  
  const handleClearToken = () => {
    localStorage.removeItem(GITHUB_TOKEN_KEY);
    setGithubToken('');
    toast({ title: 'GitHub Token Cleared', description: 'Your token has been removed.' });
  };
  
  const handleDeleteAccount = async () => {
      if (!user) return;

      const provider = user.providerData.find(p => p.providerId === EmailAuthProvider.PROVIDER_ID);
      
      // If user signed in with email/password, we need to reauthenticate them first.
      if (provider) {
          setIsReauthDialogOpen(true);
      } else {
          // For social providers, we can proceed, though this may fail if they haven't signed in recently.
          await performDelete();
      }
  };

  const performDelete = async () => {
      if (!user) return;
      setIsDeletingAccount(true);

      try {
          await deleteUser(user);
          toast({ title: "Account Deleted", description: "Your account has been permanently deleted." });
      } catch (error: any) {
          toast({
              variant: "destructive",
              title: "Deletion Failed",
              description: "This is a sensitive operation and requires a recent sign-in. Please sign out and sign back in, then try again.",
              duration: 8000
          });
          setIsDeletingAccount(false);
      }
  }

  const handleReauthAndDetele = async () => {
      if (!user || !user.email) return;
      setIsDeletingAccount(true);
      
      const credential = EmailAuthProvider.credential(user.email, passwordForReauth);
      
      try {
          await reauthenticateWithCredential(user, credential);
          await performDelete();
      } catch (error: any) {
          toast({ variant: 'destructive', title: 'Reauthentication Failed', description: 'The password you entered is incorrect.' });
          setIsDeletingAccount(false);
      } finally {
          setIsReauthDialogOpen(false);
          setPasswordForReauth('');
      }
  }


  if (loading) {
    return <Loader2 className="h-8 w-8 animate-spin" />;
  }
  
  if (!user) {
    return (
        <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Not Authenticated</AlertTitle>
            <CardDescription>You need to be signed in to view this page.</CardDescription>
        </Alert>
    );
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><User /> Profile Settings</CardTitle>
          <CardDescription>Update your personal information.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onProfileSubmit)} className="space-y-4 max-w-lg">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input id="displayName" {...register('displayName')} />
              {errors.displayName && <p className="text-sm text-destructive">{errors.displayName.message as string}</p>}
            </div>
            <div className="space-y-2">
                <Label>Email</Label>
                <Input value={user.email || ''} disabled />
            </div>
            <Button type="submit" disabled={isSavingProfile}>
              {isSavingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Profile
            </Button>
          </form>
        </CardContent>
      </Card>
      
      <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Palette /> Theme Preferences</CardTitle>
            <CardDescription>Choose how you want the application to look.</CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup value={theme} onValueChange={setTheme} className="flex flex-col sm:flex-row gap-4">
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="light" id="light" />
                    <Label htmlFor="light">Light</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="dark" id="dark" />
                    <Label htmlFor="dark">Dark</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="system" id="system" />
                    <Label htmlFor="system">System</Label>
                </div>
            </RadioGroup>
          </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Key /> API Keys</CardTitle>
          <CardDescription>Manage your personal access tokens for integrations. Tokens are stored locally in your browser and never sent to our servers.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 max-w-lg">
            <div className="space-y-2">
                <Label htmlFor="github-token">GitHub Personal Access Token</Label>
                <Input 
                    id="github-token" 
                    type="password"
                    value={githubToken} 
                    onChange={(e) => setGithubToken(e.target.value)} 
                    placeholder="ghp_..."
                />
            </div>
            <div className="flex gap-2">
                <Button onClick={handleSaveToken} disabled={isSavingToken}>
                    {isSavingToken && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Token
                </Button>
                 <Button variant="outline" onClick={handleClearToken}>Clear</Button>
            </div>
        </CardContent>
      </Card>
      
      <Card className="border-destructive">
          <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive"><AlertTriangle/> Danger Zone</CardTitle>
              <CardDescription>These actions are permanent and cannot be undone.</CardDescription>
          </CardHeader>
          <CardContent>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive">Delete Account</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete your account and all associated data, including workspaces you own. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteAccount} disabled={isDeletingAccount} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                            {isDeletingAccount ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Yes, delete my account
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
          </CardContent>
      </Card>

      <Dialog open={isReauthDialogOpen} onOpenChange={setIsReauthDialogOpen}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>Re-authentication Required</DialogTitle>
                  <DialogDescription>
                      For your security, please enter your password to confirm you want to delete your account.
                  </DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-2">
                  <Label htmlFor="password-reauth">Password</Label>
                  <Input 
                      id="password-reauth"
                      type="password"
                      value={passwordForReauth}
                      onChange={(e) => setPasswordForReauth(e.target.value)}
                  />
              </div>
              <DialogFooter>
                  <Button variant="outline" onClick={() => {setIsReauthDialogOpen(false); setIsDeletingAccount(false)}}>Cancel</Button>
                  <Button variant="destructive" onClick={handleReauthAndDetele} disabled={isDeletingAccount || !passwordForReauth}>
                    {isDeletingAccount && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Confirm & Delete
                  </Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
    </div>
  );
}
