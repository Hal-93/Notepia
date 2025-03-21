import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
} from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, Link, useActionData, useSearchParams } from "@remix-run/react";
import { useEffect, useRef } from "react";

import { createUser, getUserByEmail } from "~/models/user.server";
import { createUserSession, getUserId } from "~/session.server";
import { safeRedirect, validateEmail } from "~/utils";

import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const userId = await getUserId(request);
  if (userId) return redirect("/");
  return json({});
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const email = formData.get("email");
  const password = formData.get("password");
  const redirectTo = safeRedirect(formData.get("redirectTo"), "/");

  if (!validateEmail(email)) {
    return json({ errors: { email: "Invalid email address", password: null } }, { status: 400 });
  }

  if (typeof password !== "string" || password.length < 8) {
    return json({ errors: { email: null, password: "Password must be at least 8 characters" } }, { status: 400 });
  }

  const existingUser = await getUserByEmail(email);
  if (existingUser) {
    return json({ errors: { email: "A user already exists with this email", password: null } }, { status: 400 });
  }

  const user = await createUser(email, password);

  return createUserSession({
    redirectTo,
    remember: false,
    request,
    userId: user.id,
  });
};

export const meta: MetaFunction = () => [{ title: "Sign Up" }];

export default function Join() {
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? undefined;
  const actionData = useActionData<typeof action>();
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (actionData?.errors?.email) {
      emailRef.current?.focus();
    } else if (actionData?.errors?.password) {
      passwordRef.current?.focus();
    }
  }, [actionData]);

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-cover bg-center"
      style={{ backgroundImage: "url('/background.jpeg')" }} // 背景画像を設定
    >
      <Card className="bg-white/60 dark:bg-black/60 p-6 shadow-xl rounded-lg max-w-md w-full">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold text-gray-900 dark:text-white">
            新規登録
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form method="post" className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                // eslint-disable-next-line jsx-a11y/no-autofocus
                autoFocus
                ref={emailRef}
                className="w-full"
                aria-invalid={actionData?.errors?.email ? true : undefined}
                aria-describedby="email-error"
              />
              {actionData?.errors?.email && (
                <p className="text-red-600 text-sm" id="email-error">
                  {actionData.errors.email}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                ref={passwordRef}
                className="w-full"
                aria-invalid={actionData?.errors?.password ? true : undefined}
                aria-describedby="password-error"
              />
              {actionData?.errors?.password && (
                <p className="text-red-600 text-sm" id="password-error">
                  {actionData.errors.password}
                </p>
              )}
            </div>

            <input type="hidden" name="redirectTo" value={redirectTo} />

            <Button type="submit" className="w-full py-3 text-lg">
              アカウント作成
            </Button>

            <p className="text-sm text-gray-700 dark:text-gray-300 text-center mt-4">
              すでにアカウントをお持ちですか？{" "}
              <Link
                to={{
                  pathname: "/login",
                  search: searchParams.toString(),
                }}
                className="text-indigo-600 dark:text-indigo-400 underline"
              >
                ログイン
              </Link>
            </p>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}