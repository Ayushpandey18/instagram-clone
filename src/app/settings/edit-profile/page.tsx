
// src/app/settings/edit-profile/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Sidebar from '@/components/layout/Sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from "@/hooks/use-toast";
import type { UserProfile } from '@/services/user'; // Import type only
import { getCurrentUser, updateUserProfile } from '@/services/user';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"; // Import Form components

// Define Zod schema for form validation
const profileFormSchema = z.object({
  fullName: z.string().min(1, "Full name cannot be empty").max(50, "Full name too long"),
  username: z.string(), // Display only, not editable here usually
  website: z.string().url({ message: "Please enter a valid URL (e.g., https://example.com)" }).or(z.literal('')).optional(),
  bio: z.string().max(150, "Bio cannot exceed 150 characters").optional(),
  // email: z.string(), // Read-only
  // phone: z.string(), // Read-only
  // gender: z.string().optional(), // Add if needed
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function EditProfilePage() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Initialize react-hook-form
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      fullName: '',
      username: '',
      website: '',
      bio: '',
    },
     mode: "onChange", // Validate on change
  });

  // Fetch current user data
  useEffect(() => {
    const fetchUser = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const user = await getCurrentUser();
        if (user) {
          setCurrentUser(user);
          // Set form default values once user data is fetched
          form.reset({
            fullName: user.fullName || '',
            username: user.username,
            website: user.website || '',
            bio: user.bio || '',
          });
        } else {
          setError("Could not load user profile. Please log in again.");
        }
      } catch (err) {
        console.error("Failed to fetch current user:", err);
        setError("Failed to load profile data.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, [form]); // Add form to dependency array to ensure reset happens after form init


  const onSubmit: SubmitHandler<ProfileFormValues> = async (data) => {
    if (!currentUser) return;
    setIsSubmitting(true);
    setError(null);

     // Only include fields that have changed (optional optimization)
     const changedData: Partial<UserProfile> = {};
     if (data.fullName !== currentUser.fullName) changedData.fullName = data.fullName;
     if (data.website !== currentUser.website) changedData.website = data.website || undefined; // Send undefined if cleared
     if (data.bio !== currentUser.bio) changedData.bio = data.bio;


     if (Object.keys(changedData).length === 0) {
         toast({ description: "No changes detected." });
         setIsSubmitting(false);
         return;
     }


    try {
        await updateUserProfile(currentUser.username, changedData);
        toast({
            title: "Profile Updated",
            description: "Your profile information has been saved.",
        });
         // Update local state to reflect changes immediately
         setCurrentUser(prev => prev ? { ...prev, ...changedData } : null);
    } catch (err) {
        console.error("Failed to update profile:", err);
        setError("Failed to save changes. Please try again.");
         toast({
            title: "Update Failed",
            description: "Could not save profile changes.",
            variant: "destructive",
        });
    } finally {
        setIsSubmitting(false);
    }
  };

   // --- Render Logic ---

  if (isLoading) {
      return (
        <div className="flex min-h-screen bg-background">
          <Sidebar />
          <main className="flex-grow pl-[72px] lg:pl-[244px] transition-all duration-300 ease-in-out">
            <div className="container mx-auto max-w-2xl py-12 px-4">
              <Skeleton className="h-8 w-1/3 mb-8" /> {/* Title */}
              <Card>
                  <CardHeader className="flex flex-row items-center space-x-4 p-6">
                      <Skeleton className="h-14 w-14 rounded-full" />
                      <div className="space-y-2">
                          <Skeleton className="h-5 w-32" />
                          <Skeleton className="h-4 w-24" />
                      </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-20 w-full" />
                       <Skeleton className="h-10 w-full" />
                       <Skeleton className="h-10 w-full" />
                      <div className="flex justify-end">
                          <Skeleton className="h-10 w-24" />
                      </div>
                  </CardContent>
              </Card>
            </div>
          </main>
        </div>
      );
  }

   if (error && !currentUser) {
      return (
          <div className="flex min-h-screen bg-background">
             <Sidebar />
             <main className="flex-grow pl-[72px] lg:pl-[244px] transition-all duration-300 ease-in-out">
                <div className="container mx-auto max-w-2xl py-12 px-4 flex flex-col items-center justify-center h-[calc(100vh-150px)]">
                    <Alert variant="destructive" className="w-full">
                         <AlertCircle className="h-4 w-4" />
                         <AlertTitle>Error</AlertTitle>
                         <AlertDescription>{error}</AlertDescription>
                    </Alert>
                     <Button variant="link" asChild className="mt-4">
                        <Link href="/">Go Home</Link>
                    </Button>
                </div>
             </main>
           </div>
      );
   }

   if (!currentUser) {
     // Fallback if loading finishes but user is still null (and no error)
     return <div>User not found.</div>;
   }


  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-grow pl-[72px] lg:pl-[244px] transition-all duration-300 ease-in-out">
        <div className="container mx-auto max-w-2xl py-12 px-4">
          <h1 className="text-2xl font-semibold mb-8">Edit Profile</h1>

           {error && !isSubmitting && ( // Show update errors here
              <Alert variant="destructive" className="mb-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Update Failed</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
              </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <Card>
                 <CardHeader className="flex flex-row items-center space-x-4 p-6">
                    <Avatar className="h-14 w-14">
                      <AvatarImage src={currentUser.avatarUrl} alt={`${currentUser.username}'s avatar`} data-ai-hint="person profile"/>
                      <AvatarFallback>{currentUser.username.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                     <div>
                        <p className="text-lg font-medium">{currentUser.username}</p>
                         {/* TODO: Implement photo change functionality */}
                        <Button type="button" variant="link" size="sm" className="p-0 h-auto text-primary">Change profile photo</Button>
                     </div>
                 </CardHeader>
                 <CardContent className="p-6 space-y-6">

                    {/* Username (Read-only) */}
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="username" className="text-right font-semibold">Username</Label>
                        <Input id="username" value={currentUser.username} disabled className="col-span-3 bg-secondary cursor-not-allowed" />
                     </div>

                    {/* Full Name */}
                    <FormField
                        control={form.control}
                        name="fullName"
                        render={({ field }) => (
                        <FormItem className="grid grid-cols-4 items-center gap-4">
                            <FormLabel className="text-right font-semibold">Name</FormLabel>
                            <FormControl className="col-span-3">
                                <Input placeholder="Full Name" {...field} disabled={isSubmitting} />
                            </FormControl>
                            <FormMessage className="col-start-2 col-span-3" />
                        </FormItem>
                        )}
                    />

                    {/* Website */}
                     <FormField
                        control={form.control}
                        name="website"
                        render={({ field }) => (
                        <FormItem className="grid grid-cols-4 items-start gap-4">
                           <FormLabel className="text-right pt-2 font-semibold">Website</FormLabel>
                           <div className="col-span-3">
                                <FormControl>
                                <Input placeholder="Website" {...field} disabled={isSubmitting} />
                                </FormControl>
                                <FormDescription className="text-xs text-muted-foreground mt-1">
                                Editing your links is only available on mobile. Visit the Instagram app and edit your profile to change the websites in your bio.
                                </FormDescription>
                                <FormMessage />
                           </div>
                        </FormItem>
                        )}
                    />

                     {/* Bio */}
                     <FormField
                        control={form.control}
                        name="bio"
                        render={({ field }) => (
                        <FormItem className="grid grid-cols-4 items-start gap-4">
                           <FormLabel className="text-right pt-2 font-semibold">Bio</FormLabel>
                           <div className="col-span-3">
                                <FormControl>
                                <Textarea placeholder="Bio" className="min-h-[80px]" {...field} disabled={isSubmitting} />
                                </FormControl>
                                <FormDescription className="text-xs text-muted-foreground mt-1">
                                    {field.value?.length || 0}/150
                                </FormDescription>
                                <FormMessage />
                           </div>
                        </FormItem>
                        )}
                    />

                     {/* Personal Information Section (Read-only) */}
                     <div className="space-y-2 pt-4 border-t border-border">
                        <p className="font-semibold text-sm">Personal information</p>
                        <p className="text-xs text-muted-foreground">Provide your personal information, even if the account is used for a business, a pet or something else. This won't be a part of your public profile.</p>
                     </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="email" className="text-right font-semibold">Email address</Label>
                      <Input id="email" value={currentUser.email || 'Not provided'} disabled className="col-span-3 bg-secondary cursor-not-allowed" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="phone" className="text-right font-semibold">Phone number</Label>
                      <Input id="phone" value={currentUser.phone || 'Not provided'} disabled className="col-span-3 bg-secondary cursor-not-allowed" />
                    </div>
                    {/* <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="gender" className="text-right font-semibold">Gender</Label>
                      <Button type="button" variant="outline" className="col-span-3 justify-start text-muted-foreground" disabled>Prefer not to say</Button>
                    </div> */}

                     <div className="flex justify-end pt-4">
                        <Button type="submit" disabled={isSubmitting || !form.formState.isDirty}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Submit
                        </Button>
                     </div>

                 </CardContent>
              </Card>
            </form>
          </Form>
        </div>
      </main>
    </div>
  );
}
