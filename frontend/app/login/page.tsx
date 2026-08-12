"use client";
import { useState } from "react";
import { useSignInEmailPassword } from "@nhost/nextjs";
import { useRouter } from "next/navigation";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { signInEmailPassword, isLoading, isError, error } = useSignInEmailPassword();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const { isSuccess } = await signInEmailPassword(email, password);
    if (isSuccess) router.push("/");
  };

  return (
    <div className="flex h-full items-center justify-center">
      <form onSubmit={handleLogin} className="flex flex-col gap-4 p-8 border">
        <h1 className="text-xl">Login</h1>
        <input className="border p-2" type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
        <input className="border p-2" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
        <button type="submit" disabled={isLoading} className="bg-[#4CAF50] text-white p-2">Login</button>
        {isError && <div className="text-red-500">{error?.message}</div>}
      </form>
    </div>
  );
}
