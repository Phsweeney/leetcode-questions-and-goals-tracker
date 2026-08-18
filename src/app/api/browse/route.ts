import { NextResponse } from "next/server";
import { browseDirectory } from "@/lib/fs/browse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request: Request) {
  const target = new URL(request.url).searchParams.get("path");
  return NextResponse.json(browseDirectory(target));
}
