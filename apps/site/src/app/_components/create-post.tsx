"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { api } from "@/trpc/react";
import { Button } from "@/ui/components/button";
import { Input } from "@/ui/components/input";

export function CreatePost() {
  const router = useRouter();
  const [name, setName] = useState("");

  const createPost = api.usc.create.useMutation({
    onSuccess: () => {
      router.refresh();
      setName("");
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        createPost.mutate({ name });
      }}
      className="flex flex-col gap-2"
    >
      <Input
        type="text"
        placeholder="Title"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <Button type="submit" disabled={createPost.isLoading}>
        {createPost.isLoading ? "Submitting..." : "Submit"}
      </Button>
    </form>
  );
}
