import React from 'react';
import { redirect } from 'next/navigation';

// This page assumes a user is logged in and redirects to their profile.
// In a real app, you'd get the current user's username from session/auth state.
const CURRENT_USERNAME = "current_user"; // Replace with actual logic

export default function DefaultProfilePage() {
  // Redirect to the current user's profile page
  redirect(`/profile/${CURRENT_USERNAME}`);

  // Return null or a loading state if needed before redirect triggers
  // return <div>Loading profile...</div>;
}
