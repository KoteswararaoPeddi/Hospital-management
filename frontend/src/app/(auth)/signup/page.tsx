import Link from "next/link"
import type { Metadata } from "next"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@components/ui/card"
import { SignupForm } from "@features/auth/components"

export const metadata: Metadata = {
  title: "Create account | MediNex+",
}

export default function SignupPage() {
  return (
    <Card className="w-full max-w-sm shadow-md">
      <CardHeader className="text-center">
        <CardTitle className="text-h3 text-foreground">Create your account</CardTitle>
        <CardDescription>Set up your hospital workspace in minutes</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <SignupForm />
        <p className="text-center text-body-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
