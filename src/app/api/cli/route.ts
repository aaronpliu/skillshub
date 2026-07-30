import { NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";

export async function GET() {
  const cliPath = path.join(process.cwd(), "cli", "index.js");

  if (!fs.existsSync(cliPath)) {
    return NextResponse.json({ error: "CLI file not found" }, { status: 404 });
  }

  const content = fs.readFileSync(cliPath, "utf-8");

  return new NextResponse(content, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Content-Disposition": 'attachment; filename="skills-hub.js"',
      "Cache-Control": "public, max-age=3600",
    },
  });
}
