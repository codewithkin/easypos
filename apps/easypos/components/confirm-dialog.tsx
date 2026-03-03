import * as React from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";

interface ConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    destructive?: boolean;
    onConfirm: () => void;
    isLoading?: boolean;
}

export function ConfirmDialog({
    open,
    onOpenChange,
    title,
    description,
    confirmText = "Confirm",
    cancelText = "Cancel",
    destructive = false,
    onConfirm,
    isLoading = false,
}: ConfirmDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <DialogFooter className="mt-2 flex-row gap-3">
                    <Button
                        variant="outline"
                        className="flex-1"
                        onPress={() => onOpenChange(false)}
                        disabled={isLoading}
                    >
                        <Text>{cancelText}</Text>
                    </Button>
                    <Button
                        variant={destructive ? "destructive" : "default"}
                        className="flex-1"
                        onPress={() => {
                            onConfirm();
                            onOpenChange(false);
                        }}
                        disabled={isLoading}
                    >
                        <Text className={destructive ? "text-white" : "text-primary-foreground"}>
                            {isLoading ? "Please wait…" : confirmText}
                        </Text>
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
