
// src/app/settings/edit-profile/page.tsx
'use client';

import React from 'react';
import Sidebar from '@/components/layout/Sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea'; // Import Textarea
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Mock data for current user (replace with actual data fetching)
const currentUser = {
  username: "current_user",
  fullName: "Current User Name",
  avatarUrl: "https://picsum.photos/seed/currentuser/150/150",
  bio: "This is the bio of the current user. Exploring the world!",
  website: "https://example.com",
  email: "user@example.com", // Usually not directly editable here
  phone: "123-456-7890" // Usually not directly editable here
};


export default function EditProfilePage() {

  // TODO: Implement form handling (e.g., with react-hook-form) and submission logic

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-grow pl-[72px] lg:pl-[244px] transition-all duration-300 ease-in-out">
        <div className="container mx-auto max-w-2xl py-12 px-4">
          <h1 className="text-2xl font-semibold mb-8">Edit Profile</h1>

          <Card>
             <CardHeader className="flex flex-row items-center space-x-4 p-6">
                <Avatar className="h-14 w-14">
                  <AvatarImage src={currentUser.avatarUrl} alt={`${currentUser.username}'s avatar`} data-ai-hint="person profile"/>
                  <AvatarFallback>{currentUser.username.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                 <div>
                    <p className="text-lg font-medium">{currentUser.username}</p>
                    <Button variant="link" size="sm" className="p-0 h-auto text-primary">Change profile photo</Button>
                 </div>
             </CardHeader>
             <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label htmlFor="website" className="text-right pt-2 font-semibold">Website</Label>
                  <div className="col-span-3">
                      <Input id="website" defaultValue={currentUser.website} placeholder="Website" />
                      <p className="text-xs text-muted-foreground mt-1">Editing your links is only available on mobile. Visit the Instagram app and edit your profile to change the websites in your bio.</p>
                  </div>
                </div>

                <div className="grid grid-cols-4 items-start gap-4">
                  <Label htmlFor="bio" className="text-right pt-2 font-semibold">Bio</Label>
                  <div className="col-span-3">
                    <Textarea id="bio" defaultValue={currentUser.bio} placeholder="Bio" className="min-h-[80px]" />
                    <p className="text-xs text-muted-foreground mt-1">{currentUser.bio.length}/150</p> {/* Character count */}
                  </div>
                </div>

                 {/* Personal Information Section (Often non-editable or links elsewhere) */}
                 <div className="space-y-2 pt-4 border-t border-border">
                    <p className="font-semibold text-sm">Personal information</p>
                    <p className="text-xs text-muted-foreground">Provide your personal information, even if the account is used for a business, a pet or something else. This won't be a part of your public profile.</p>
                 </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right font-semibold">Email address</Label>
                  <Input id="email" value={currentUser.email} disabled className="col-span-3 bg-secondary cursor-not-allowed" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="phone" className="text-right font-semibold">Phone number</Label>
                  <Input id="phone" value={currentUser.phone} disabled className="col-span-3 bg-secondary cursor-not-allowed" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="gender" className="text-right font-semibold">Gender</Label>
                  {/* Gender is often a dropdown or custom component */}
                   <Button variant="outline" className="col-span-3 justify-start text-muted-foreground">Prefer not to say</Button>
                </div>

                 <div className="flex justify-end">
                    <Button type="submit">Submit</Button>
                 </div>

             </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
