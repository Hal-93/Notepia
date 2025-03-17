import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
} from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, Link, useActionData, useSearchParams } from "@remix-run/react";
import { useEffect, useRef } from "react";

import { verifyLogin } from "~/models/user.server";
import { createUserSession, getUserId } from "~/session.server";
import { safeRedirect, validateEmail } from "~/utils";

import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { Checkbox } from "~/components/ui/checkbox";

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
  const remember = formData.get("remember");

  if (!validateEmail(email)) {
    return json({ errors: { email: "Invalid email address", password: null } }, { status: 400 });
  }

  if (typeof password !== "string" || password.length < 8) {
    return json({ errors: { email: null, password: "Password must be at least 8 characters" } }, { status: 400 });
  }

  const user = await verifyLogin(email, password);
  if (!user) {
    return json({ errors: { email: "Invalid email or password", password: null } }, { status: 400 });
  }

  return createUserSession({
    redirectTo,
    remember: remember === "on",
    request,
    userId: user.id,
  });
};

export const meta: MetaFunction = () => [{ title: "Login" }];

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/notes";
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
      style={{ backgroundImage: "url('/background.jpg')" }} // 背景画像を設定
    >
      <div className="bg-white/70 dark:bg-black/60 p-8 rounded-xl shadow-lg max-w-md w-full">
        <h2 className="text-center text-2xl font-bold text-gray-900 dark:text-white">
          ログイン
        </h2>

        <Form method="post" className="space-y-6 mt-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">
              Email address
            </Label>
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
            <Label htmlFor="password" className="text-gray-700 dark:text-gray-300">
              Password
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
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
            ログイン
          </Button>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox id="remember" name="remember" />
              <Label htmlFor="remember" className="text-gray-700 dark:text-gray-300 text-sm">
                Remember me
              </Label>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              アカウントをお持ちでないですか？{" "}
              <Link
                to={{
                  pathname: "/join",
                  search: searchParams.toString(),
                }}
                className="text-indigo-600 dark:text-indigo-400 underline"
              >
                登録する
              </Link>
            </p>
          </div>
        </Form>
      </div>
    </div>
  );
}