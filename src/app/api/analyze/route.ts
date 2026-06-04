import { NextResponse } from "next/server";

import { analyzeError } from "@/lib/analyzer";

const headers = {
  "Cache-Control": "no-store",
};

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const text = typeof body?.text === "string" ? body.text : "";
    const framework = typeof body?.framework === "string" ? body.framework : undefined;
    const useAI = typeof body?.useAI === "boolean" ? body.useAI : true;
    const result = await analyzeError(text, { framework, useAI });

    return NextResponse.json(
      {
        ok: true,
        ...result,
      },
      { status: 200, headers }
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Analysis failed.",
      },
      { status: 400, headers }
    );
  }
}
