"use client";

import SignIn from "@/app/(auth)/sign-in/_components/sign-in";
import { SignUp } from "@/app/(auth)/sign-in/_components/sign-up";
import { Tabs } from "@/components/ui/tabs2";

export default function Page() {
  return (
    <div className="w-full">
      <div className="flex items-center flex-col justify-center w-full md:py-10">
        <div className="w-full max-w-md">
          <Tabs
            tabs={[
              {
                title: "Sign In",
                value: "sign-in",
                content: <SignIn />,
              },
              {
                title: "Sign Up",
                value: "sign-up",
                content: <SignUp />,
              },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
