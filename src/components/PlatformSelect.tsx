"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { addPlatform } from "@/actions/platforms";
import type { Platform } from "@/lib/types";

export function PlatformSelect({
  name,
  platforms,
  defaultValue,
}: {
  name: string;
  platforms: Platform[];
  defaultValue?: number;
}) {
  const [options, setOptions] = useState(platforms);
  const [selected, setSelected] = useState<number | undefined>(defaultValue);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleCreate() {
    startTransition(async () => {
      const result = await addPlatform(newName);
      if (!result.ok || !result.platform) {
        setError(result.error ?? "Could not create the platform.");
        return;
      }
      const platform = result.platform;
      setOptions((current) =>
        [...current, platform].sort((a, b) =>
          a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
        ),
      );
      setSelected(platform.id);
      setNewName("");
      setError(null);
      setCreating(false);
    });
  }

  return (
    <div className="space-y-2">
      <input type="hidden" name={name} value={selected ?? ""} />
      <Select
        value={selected ?? ""}
        onChange={(event) => setSelected(Number(event.target.value) || undefined)}
      >
        <option value="">Choose a platform</option>
        {options.map((platform) => (
          <option key={platform.id} value={platform.id}>
            {platform.name}
          </option>
        ))}
      </Select>

      {creating ? (
        <div className="flex items-center gap-2">
          <Input
            autoFocus
            value={newName}
            placeholder="Platform name"
            onChange={(event) => setNewName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                handleCreate();
              }
            }}
          />
          <Button size="sm" variant="primary" onClick={handleCreate} disabled={pending}>
            Add
          </Button>
          <Button size="sm" onClick={() => setCreating(false)} disabled={pending}>
            Cancel
          </Button>
        </div>
      ) : (
        <Button size="sm" variant="ghost" onClick={() => setCreating(true)}>
          + Create Platform
        </Button>
      )}

      {error ? <p className="text-xs text-danger">{error}</p> : null}
    </div>
  );
}
