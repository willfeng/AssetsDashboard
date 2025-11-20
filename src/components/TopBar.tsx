import { UserCircle } from "lucide-react";

export function TopBar() {
    return (
        <div className="flex items-center p-4 border-b bg-background">
            <div className="ml-auto flex items-center gap-x-4">
                <div className="flex items-center gap-x-2 text-sm font-medium">
                    <span>Welcome, User</span>
                    <UserCircle className="h-8 w-8 text-muted-foreground" />
                </div>
            </div>
        </div>
    );
}
