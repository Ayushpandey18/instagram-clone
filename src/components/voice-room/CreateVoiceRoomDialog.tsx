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
        title: "Error",
        description: "Room name cannot be empty.",
        variant: "destructive",
      });
      return;
    }
    if (isPasswordProtected && !password.trim()) {
        toast({
            title: "Error",
            description: "Password cannot be empty if protection is enabled.",
            variant: "destructive",
        });
        return;
    }

    setIsLoading(true);
    try {
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
            title: "Error",
            description: "Failed to create voice room. Please try again.",
            variant: "destructive",
        });
        setIsLoading(false); // Keep dialog open on error
    }
  };


  // Reset form when dialog is closed externally
  React.useEffect(() => {
      if (!isOpen) {
          resetForm();
      }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Voice Room</DialogTitle>
          <DialogDescription>
            Set up a new voice room for your friends or community.
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
              placeholder="e.g., Chill Hangout"
              disabled={isLoading}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
             <Label htmlFor="password-switch" className="text-right">
              Password
            </Label>
             <div className="col-span-3 flex items-center space-x-2">
                <Switch
                    id="password-switch"
                    checked={isPasswordProtected}
                    onCheckedChange={setIsPasswordProtected}
                    disabled={isLoading}
                    className="data-[state=checked]:bg-[#A29BFE] data-[state=unchecked]:bg-input"
                />
                <Label htmlFor="password-switch" className="text-sm text-muted-foreground">
                 {isPasswordProtected ? 'Enabled' : 'Disabled'}
                </Label>
            </div>
          </div>
           {isPasswordProtected && (
             <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="room-password" className="text-right">
                Set Password
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
          <Button type="button" onClick={handleCreateRoom} disabled={isLoading} className="voice-room-accent-bg hover:opacity-90 text-white">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Create Room
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
