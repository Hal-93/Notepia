import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
} from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import {
  Form,
  Link,
  useActionData,
  useLoaderData,
  useSearchParams,
} from "@remix-run/react";
import { useEffect, useRef, useState } from "react";

import { verifyLogin } from "~/models/user.server";
import { createUserSession, getUserId } from "~/session.server";
import { safeRedirect, validateEmail } from "~/utils";

import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { Checkbox } from "~/components/ui/checkbox";
import { Turnstile } from "@marsidev/react-turnstile";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const userId = await getUserId(request);
  if (userId) return redirect("/");
  const CF_TURNSTILE_SITE_KEY = process.env.CF_TURNSTILE_SITE_KEY;
  return json({ CF_TURNSTILE_SITE_KEY });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const email = formData.get("email");
  const password = formData.get("password");
  const redirectTo = safeRedirect(formData.get("redirectTo"), "/");
  const remember = formData.get("remember");
  const token = formData.get("token") as string;
  const ip = request.headers.get("CF-Connecting-IP") as string;

  const CF_TURNSTILE_SECRET_KEY = process.env.CF_TURNSTILE_SECRET_KEY as string;
  const url = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
  const tokenForm = new FormData();
  tokenForm.append("secret", CF_TURNSTILE_SECRET_KEY);
  tokenForm.append("response", token);
  tokenForm.append("remoteip", ip);

  const result = await fetch(url, {
    body: tokenForm,
    method: "POST",
  });
  const outcome = await result.json();
  if (!outcome.success) {
    return json({ errors: { email: null, password: null } }, { status: 400 });
  }

  if (!validateEmail(email)) {
    return json(
      { errors: { email: "メールアドレスまたはパスワードが違います", password: null } },
      { status: 400 }
    );
  }

  if (typeof password !== "string" || password.length < 8) {
    return json(
      {
        errors: {
          email: null,
          password: "メールアドレスまたはパスワードが違います",
        },
      },
      { status: 400 }
    );
  }

  const user = await verifyLogin(email, password);
  if (!user) {
    return json(
      { errors: { email: "メールアドレスまたはパスワードが違います", password: null } },
      { status: 400 }
    );
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
  const redirectTo = searchParams.get("redirectTo") || "/map";
  const actionData = useActionData<typeof action>();
  const { CF_TURNSTILE_SITE_KEY } = useLoaderData<typeof loader>();
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const [isVerify, setIsVerify] = useState(false);
  const [token, setToken] = useState<string>("");

  const turnstileRef = useRef<any>(null);

  const handleSuccess = (token: string) => {
    setToken(token);
    setIsVerify(true);
  };

  useEffect(() => {
    if (actionData?.errors?.email) {
      emailRef.current?.focus();
    } else if (actionData?.errors?.password) {
      passwordRef.current?.focus();
    }
  }, [actionData]);

  useEffect(() => {
    if (actionData?.errors) {
      setIsVerify(false);
      setToken("");
      turnstileRef.current?.reset();
    }
  }, [actionData]);

  return (
    <div className="h-screen grid md:grid-cols-3">
      {/* 左カラム */}
      <div className="relative bg-cover bg-center bg-[#141920] flex flex-col">
        {/* コンテンツ */}
        <nav className="relative flex flex-col px-8 z-10">
          <div className="h-screen justify-center">
            <Link to={"/start"}>
              <img
                src="/Notepia-light.svg"
                alt="Notepia"
                className="pt-0 mt-[10vh] md:mt-[5vh] w-[30vw] md:w-32 h-auto"
              />
            </Link>
            <h2 className="text-white text-[3vh] md:text-[2.5vw] font-bold pt-[4vh]">
              ログイン
            </h2>

            <Form method="post" className="space-y-6 pt-[16px]">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">
                  メールアドレス
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
                  className="w-full text-white"
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
                <Label htmlFor="password" className="text-white">
                  パスワード
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  ref={passwordRef}
                  className="w-full text-white"
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

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  name="remember"
                  className="border-white"
                />
                <Label htmlFor="remember" className="text-white">
                  Remember me
                </Label>
              </div>
              <Turnstile
                ref={turnstileRef}
                siteKey={CF_TURNSTILE_SITE_KEY!}
                onSuccess={(token) => {
                  handleSuccess(token);
                }}
                onError={() => {
                  setIsVerify(false);
                  setToken("");
                }}
                onExpire={() => {
                  setIsVerify(false);
                  setToken("");
                  turnstileRef.current?.reset();
                }}
                options={{ size: "flexible" }}
              />
              <input hidden={true} name="token" value={token} />
              <Button
                type="submit"
                className="w-full md:text-[1.2vw] md:h-[2.5vw] px-5 bg-gradient-to-r from-purple-700 to-orange-500 text-white hover:bg-gradient-to-l hover:from-orange-900 hover:to-purple-950 hover:text-zinc-400"
                disabled={!isVerify}
              >
                ログイン
              </Button>

              <p className="text-white text-xs text-center md:text-[1vw] font-md">
                まだアカウントをお持ちでないですか？{" "}
                <Link
                  to={{
                    pathname: "/join",
                    search: searchParams.toString(),
                  }}
                  className="text-indigo-700 text-xs text-center md:text-[1vw] md:font-md font-bold hover:underline hover:text-indigo-900 underline "
                >
                  登録する
                </Link>
              </p>
            </Form>
          </div>
        </nav>
      </div>
      {/* 右カラム */}
      <div
        className="hidden md:block col-span-2 bg-cover bg-center"
        style={{ backgroundImage: "url('/backGround250506.jpeg')" }}
      ></div>
    </div>
  );
}
