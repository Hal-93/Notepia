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

import {
  createUser,
  getUserByEmail,
  getUserByUuid,
} from "~/models/user.server";
import { createUserSession, getUserId } from "~/session.server";
import { validateEmail } from "~/utils";

import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";

import { Turnstile } from "@marsidev/react-turnstile";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const userId = await getUserId(request);
  if (userId) return redirect("/");
  const CF_TURNSTILE_SITE_KEY = process.env.CF_TURNSTILE_SITE_KEY;
  return json({
    CF_TURNSTILE_SITE_KEY,
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const email = formData.get("email");
  const uuid = formData.get("uuid");
  const password = formData.get("password");
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
    return json(
      {
        errors: {
          uuid: null,
          email: null,
          password: null,
        },
      },
      { status: 400 }
    );
  }

  if (!validateEmail(email)) {
    return json(
      {
        errors: { uuid: null, email: "Invalid email address", password: null },
      },
      { status: 400 }
    );
  }

  if (typeof uuid !== "string" || !uuid) {
    return json(
      {
        errors: {
          uuid: "Invalid Username: Username must be a non-empty string",
          email: null,
          password: null,
        },
      },
      { status: 400 }
    );
  }

  const uuidRegex = /^[0-9a-zA-Z-_]+$/;
  if (!uuidRegex.test(uuid)) {
    return json(
      {
        errors: {
          uuid: "Invalid Username: Username contains invalid characters",
          email: null,
          password: null,
        },
      },
      { status: 400 }
    );
  }

  const existingUuid = await getUserByUuid(uuid);
  if (existingUuid) {
    return json(
      {
        errors: {
          uuid: "A user already exists with this Username",
          email: null,
          password: null,
        },
      },
      { status: 400 }
    );
  }

  if (typeof password !== "string" || password.length < 8) {
    return json(
      {
        errors: {
          uuid: null,
          email: null,
          password: "Password must be at least 8 characters",
        },
      },
      { status: 400 }
    );
  }

  const existingUser = await getUserByEmail(email);
  if (existingUser) {
    return json(
      {
        errors: {
          uuid: null,
          email: "A user already exists with this email",
          password: null,
        },
      },
      { status: 400 }
    );
  }

  const user = await createUser(email, password, uuid);
  const redirectTo = "/home";

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
  const { CF_TURNSTILE_SITE_KEY } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const uuidRef = useRef<HTMLInputElement>(null);

  const [isVerify, setIsVerify] = useState(false);
  const [token, setToken] = useState<string>("");

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
            <h2 className="text-white text-[3vh] md:text-[2.5vw] font-bold pt-[6vh]">
              新規登録
            </h2>

            <Form method="post" className="space-y-6 pt-10">
              <div className="space-y-2">
                <Label htmlFor="uuid" className="text-white">
                  ユーザーID
                </Label>
                <Input
                  id="uuid"
                  name="uuid"
                  type="text"
                  autoComplete="username"
                  required
                  // eslint-disable-next-line jsx-a11y/no-autofocus
                  autoFocus
                  ref={uuidRef}
                  className="w-full text-white"
                  aria-invalid={actionData?.errors?.uuid ? true : undefined}
                  aria-describedby="uuid-error"
                />
                {actionData?.errors?.uuid && (
                  <p className="text-red-600 text-sm" id="uuid-error">
                    {actionData.errors.uuid}
                  </p>
                )}
              </div>

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

              <div className="space-y-2 pb-[2vh]">
                <Label htmlFor="password" className="text-white">
                  パスワード
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
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
              <Turnstile
                siteKey={CF_TURNSTILE_SITE_KEY!}
                onSuccess={(token) => handleSuccess(token)}
                options={{ size: "flexible" }}
              />
              <input hidden={true} name="token" value={token} />
              <Button
                type="submit"
                className="w-full md:text-[1.2vw] md:h-[2.5vw] px-5 bg-gradient-to-r from-purple-800 to-indigo-600 text-white hover:bg-gradient-to-l hover:from-indigo-900 hover:to-purple-950 hover:text-zinc-400"
                disabled={!isVerify}
              >
                アカウント作成
              </Button>
            </Form>
            <p className="text-white text-xs text-center md:text-[1vw] pt-[2.5vh] font-md">
              すでに Notepia のアカウントをお持ちですか？{" "}
              <Link
                to={{
                  pathname: "/login",
                  search: searchParams.toString(),
                }}
                className="text-indigo-700 text-xs text-center md:text-[1vw] pt-1 md:font-md font-bold hover:underline hover:text-indigo-900 underline "
              >
                ログイン
              </Link>
            </p>
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
