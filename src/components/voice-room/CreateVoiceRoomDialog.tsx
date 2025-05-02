
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
    if (isPasswordProtected && !password.trim()) {
        toast({
            title: "Validation Error",
            description: "Password cannot be empty if protection is enabled.",
            variant: "destructive",
        });
        return;
    }
    if (isPasswordProtected && password.length < 4) { // Example: Basic password length validation
         toast({
            title: "Validation Error",
            description: "Password must be at least 4 characters long.",
            variant: "destructive",
        });
        return;
    }


    setIsLoading(true);
    try {
        // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      const newRoom = await createVoiceRoom(roomName, isPasswordProtected ? password : undefined);
      toast({
        title: "Success",
        description: `Voice room "${newRoom.name}" created successfully.`,
      });
      onRoomCreated(newRoom); // Notify parent component
      resetForm();
      onOpenChange(false); // Close dialog
    } catch (error) {
        console.error("Failed to create voice room:", error);
        toast({
            title: "Creation Failed",
            description: "Could not create the voice room. Please try again.",
            variant: "destructive",
        });
        setIsLoading(false); // Keep dialog open on error
    }
  };


  // Reset form when dialog is closed externally
  React.useEffect(() => {
      if (!isOpen) {
          // Delay reset slightly to allow closing animation
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
              maxLength={50} // Add max length
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
                    onCheckedChange={setIsPasswordProtected}
                    disabled={isLoading}
                    // Use theme colors via data attributes implicitly handled by Switch component
                    // className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-input"
                />
                <Label htmlFor="password-switch" className="text-sm text-muted-foreground cursor-pointer">
                 {isPasswordProtected ? 'Password enabled' : 'Open to everyone'}
                </Label>
            </div>
          </div>
           {isPasswordProtected && (
             <div className="grid grid-cols-4 items-center gap-4 transition-all duration-300 ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" data-state={isPasswordProtected ? 'open' : 'closed'}>
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
                disabled={isLoading}
                />
            </div>
           )}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="button" onClick={handleCreateRoom} disabled={isLoading} className="bg-primary text-primary-foreground hover:bg-primary/90">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Create Room
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
