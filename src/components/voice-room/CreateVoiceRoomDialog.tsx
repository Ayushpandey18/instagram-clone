
'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { createVoiceRoom } from '@/services/voice-room';
import type { VoiceRoom } from '@/services/voice-room'; // Import type only

interface CreateVoiceRoomDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onRoomCreated: (room: VoiceRoom) => void;
}

export default function CreateVoiceRoomDialog({ isOpen, onOpenChange, onRoomCreated }: CreateVoiceRoomDialogProps) {
  const [roomName, setRoomName] = useState('');
  const [isPasswordProtected, setIsPasswordProtected] = useState(false);
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const resetForm = () => {
    setRoomName('');
    setIsPasswordProtected(false);
    setPassword('');
    setIsLoading(false);
  };

  const handleCreateRoom = async () => {
    if (!roomName.trim()) {
      toast({
        title: "Validation Error",
        description: "Room name cannot be empty.",
        variant: "destructive",
      });
      return;
    }
     if (roomName.length > 50) { // Match backend validation
      toast({
        title: "Validation Error",
        description: "Room name cannot exceed 50 characters.",
        variant: "destructive",
      });
      return;
    }
    if (isPasswordProtected && !password.trim()) {
        toast({
            title: "Validation Error",
            description: "Password cannot be empty if protection is enabled.",
            variant: "destructive",
        });
        return;
    }
    // Add more robust password validation if needed (e.g., minimum length)


    setIsLoading(true);
    try {
      // Call the service function which now makes an API request
      const newRoom = await createVoiceRoom(roomName.trim(), isPasswordProtected ? password : undefined);
      toast({
        title: "Success",
        description: `Voice room "${newRoom.name}" created successfully.`,
      });
      onRoomCreated(newRoom); // Notify parent component
      resetForm();
      onOpenChange(false); // Close dialog
    } catch (error: any) { // Catch specific error type
        console.error("Failed to create voice room:", error);
        toast({
            title: "Creation Failed",
            // Use the error message from the API/service if available
            description: error.message || "Could not create the voice room. Please try again.",
            variant: "destructive",
        });
        // Don't reset form or close dialog on error
    } finally {
         setIsLoading(false);
    }
  };


  // Reset form when dialog is closed externally
  React.useEffect(() => {
      if (!isOpen) {
          const timer = setTimeout(resetForm, 300);
          return () => clearTimeout(timer);
      }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!isLoading) onOpenChange(open); }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Voice Room</DialogTitle>
          <DialogDescription>
            Set up a new voice room. Choose a name and optionally set a password.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="room-name" className="text-right">
              Name
            </Label>
            <Input
              id="room-name"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              className="col-span-3"
              placeholder="e.g., Gaming Session"
              disabled={isLoading}
              maxLength={50} // Consistent with backend validation
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
             <Label htmlFor="password-switch" className="text-right">
              Private
            </Label>
             <div className="col-span-3 flex items-center space-x-2">
                <Switch
                    id="password-switch"
                    checked={isPasswordProtected}
                    onCheckedChange={(checked) => {
                        setIsPasswordProtected(checked);
                        if (!checked) {
                            setPassword(''); // Clear password if switching to public
                        }
                    }}
                    disabled={isLoading}
                />
                <Label htmlFor="password-switch" className="text-sm text-muted-foreground cursor-pointer">
                 {isPasswordProtected ? 'Password enabled' : 'Open to everyone'}
                </Label>
            </div>
          </div>
           {isPasswordProtected && (
             <div className="grid grid-cols-4 items-center gap-4 transition-opacity duration-300 ease-in-out" style={{ opacity: isPasswordProtected ? 1 : 0 }}>
                <Label htmlFor="room-password" className="text-right">
                Password
                </Label>
                <Input
                id="room-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="col-span-3"
                placeholder="Enter room password"
                disabled={isLoading || !isPasswordProtected} // Also disable if not password protected
                />
            </div>
           )}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="button" onClick={handleCreateRoom} disabled={isLoading || !roomName.trim() || (isPasswordProtected && !password.trim())} className="bg-primary text-primary-foreground hover:bg-primary/90">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Create Room
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
