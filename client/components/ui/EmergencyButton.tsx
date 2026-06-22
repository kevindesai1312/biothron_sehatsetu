import React from 'react';
import { PhoneCall, MessageCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function EmergencyButton() {
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" className="h-14 w-14 rounded-full bg-red-600 hover:bg-red-700 shadow-lg animate-pulse" aria-label="Emergency Help">
            <PhoneCall className="h-6 w-6 text-white" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 mb-2">
          <DropdownMenuItem className="cursor-pointer" asChild>
            <a href="tel:108" className="flex items-center text-red-600 font-medium">
              <PhoneCall className="mr-2 h-4 w-4" />
              <span>Call Ambulance (108)</span>
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer" asChild>
            <a href="https://wa.me/919601262388?text=Emergency:%20I%20need%20immediate%20medical%20assistance" target="_blank" rel="noreferrer" className="flex items-center text-green-600 font-medium">
              <MessageCircle className="mr-2 h-4 w-4" />
              <span>WhatsApp Doctor</span>
            </a>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
