"use client";

import { useSearchParams } from "next/navigation";
import SignIn from "@/app/(auth)/sign-in/_components/sign-in";
import { SignUp } from "@/app/(auth)/sign-in/_components/sign-up";
import { Tabs } from "@/components/ui/tabs2";

export default function Page() {
  const params = useSearchParams();
  const tab = params.get("tab") ?? "sign-in";
  const redirectTarget = params.get("redirect") ?? undefined;
  const defaultEmail = params.get("email") ?? undefined;

  return (
    <div className="w-full">
      <div className="flex items-center flex-col justify-center w-full md:py-10">
        <div className="w-full max-w-md">
          <Tabs
            defaultValue={tab}
            tabs={[
              {
                title: "Sign In",
                value: "sign-in",
                content: (
                  <SignIn redirectTarget={redirectTarget} defaultEmail={defaultEmail} />
                ),
              },
              {
                title: "Sign Up",
                value: "sign-up",
                content: (
                  <SignUp redirectTarget={redirectTarget} defaultEmail={defaultEmail} />
                ),
              },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
