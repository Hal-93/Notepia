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
  const confirm = formData.get("confirm");
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
          uuid: "ユーザー名を入力してください",
          email: null,
          password: null,
        },
      },
      { status: 400 }
    );
  }

  const uuidRegex = /^[A-Za-z0-9_-]+$/;
  if (!uuidRegex.test(uuid)) {
    return json(
      {
        errors: {
          uuid: "ユーザー名には英数字および「-」「 _ 」のみ使用できます",
          email: null,
          password: null,
        },
      },
      { status: 400 }
    );
  }

  if (uuid.length < 4 || uuid.length > 10) {
    return json(
      {
        errors: {
          uuid: "ユーザー名は4文字以上10文字以内である必要があります",
          email: null,
          password: null,
        },
      },
      { status: 400 }
    );
  }

  const lowerUuid = uuid.toLowerCase();
  if (lowerUuid.includes("notepia") || lowerUuid.includes("official")) {
    return json(
      {
        errors: {
          uuid: "そのユーザー名は使用できません",
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
          uuid: "ユーザー名がすでに使われています",
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
          password: "パスワードは8文字以上である必要があります",
        },
      },
      { status: 400 }
    );
  }
  if (typeof confirm !== "string" || password !== confirm) {
    return json(
      {
        errors: {
          uuid: null,
          email: null,
          password: "パスワードが一致しません",
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
          email: "入力されたメールアドレスはすでに使用されています",
          password: null,
        },
      },
      { status: 400 }
    );
  }

  const user = await createUser(email, password, uuid);
  const redirectTo = "/map";

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
  const confirmRef = useRef<HTMLInputElement>(null);

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
    } else if (actionData?.errors?.password === "パスワードが一致しません") {
      confirmRef.current?.focus();
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
            <h2 className="text-white text-[3vh] md:text-[2.5vw] font-bold mt-[4vh]">
              新規登録
            </h2>

            <Form method="post" className="mt-[16px]">
              <div className="mt-[8px]">
                <Label htmlFor="uuid" className="text-white">
                  ユーザーID
                </Label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 border border-gray-600 bg-gray-800 text-gray-300 rounded-l-md">
                    @
                  </span>
                  <Input
                    id="uuid"
                    name="uuid"
                    type="text"
                    autoComplete="username"
                    required
                    ref={uuidRef}
                    className="flex-1 text-white rounded-none rounded-r-md"
                    aria-invalid={actionData?.errors?.uuid ? true : undefined}
                    aria-describedby="uuid-error"
                  />
                </div>
                {actionData?.errors?.uuid && (
                  <p className="text-red-600 text-sm" id="uuid-error">
                    {actionData.errors.uuid}
                  </p>
                )}
              </div>

              <div className="mt-[16px]">
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

              <div className="mt-[16px]">
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
              <div className="my-[16px]">
                <Label htmlFor="confirm" className="text-white">パスワード（確認）</Label>
                <Input
                  id="confirm"
                  name="confirm"
                  type="password"
                  autoComplete="new-password"
                  required
                  ref={confirmRef}
                  className="w-full text-white"
                  aria-invalid={actionData?.errors?.password ? true : undefined}
                  aria-describedby="confirm-error"
                />
                {actionData?.errors?.password && actionData.errors.password === "パスワードが一致しません" && (
                  <p className="text-red-600 text-sm" id="confirm-error">
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
                className="w-full md:text-[1.2vw] md:h-[2.5vw] mt-[16px] px-5 bg-gradient-to-r from-purple-800 to-indigo-600 text-white hover:bg-gradient-to-l hover:from-indigo-900 hover:to-purple-950 hover:text-zinc-400"
                disabled={!isVerify}
              >
                アカウント作成
              </Button>
            </Form>
            <p className="text-white text-xs text-center md:text-[1vw] pt-[16px] font-md">
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
