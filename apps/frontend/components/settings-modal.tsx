"use client";

import type React from "react";

import { useState } from "react";
import Link from "next/link";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function SettingsModal() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="ghost" size="icon" onClick={() => setOpen(true)}>
        <Settings className="h-5 w-5" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl p-0 gap-0">
          <Tabs defaultValue="company" className="w-full">
            <TabsList className="w-full grid grid-cols-1 rounded-none h-12">
              <TabsTrigger
                value="company"
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-[#1ECAD3] rounded-none"
              >
                <div className="flex flex-col items-center">
                  <span className="font-medium">Settings</span>
                </div>
              </TabsTrigger>
            </TabsList>

            <div className="p-3">
              <TabsContent value="company" className="mt-0">
                <div className="grid grid-cols-1 gap-4">
                  <Link href="/account-settings" onClick={() => setOpen(false)}>
                    <Button
                      variant="ghost"
                      className="justify-start h-auto py-2 px-0 font-normal hover:bg-transparent hover:underline text-gray-700 w-full"
                    >
                      Account and settings
                    </Button>
                  </Link>
                  <Link
                    href="/user-administration"
                    onClick={() => setOpen(false)}
                  >
                    <Button
                      variant="ghost"
                      className="justify-start h-auto py-2 px-0 font-normal hover:bg-transparent hover:underline text-gray-700 w-full"
                    >
                      Manage users
                    </Button>
                  </Link>
                  <SettingsLink>Chart of accounts</SettingsLink>
                </div>
              </TabsContent>
            </div>
          </Tabs>

          <div className="flex items-center justify-between border-t p-4 text-sm">
            <div className="flex items-center gap-1">
              <span className="text-gray-500">
                You are viewing ADSTRATEGIC in Admin view.
              </span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function SettingsLink({ children }: { children: React.ReactNode }) {
  return (
    <Button
      variant="ghost"
      className="justify-start h-auto py-2 px-0 font-normal hover:bg-transparent hover:underline text-gray-700"
    >
      {children}
    </Button>
  );
}
