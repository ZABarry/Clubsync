import { NextResponse } from "next/server";

import { createClient } from "@/lib/auth/supabase-server";
import { requireAuth } from "@/lib/auth/server";
import { validateImageBuffer } from "@/lib/security/image-validation";
import { checkRateLimit, rateLimitKey } from "@/lib/security/rate-limit";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export async function POST(request: Request) {
  let userId: string;
  try {
    const user = await requireAuth();
    userId = user.id;
    checkRateLimit(rateLimitKey("upload-image", userId), {
      limit: 20,
      windowMs: 60 * 60 * 1000,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "RateLimitError") {
      return NextResponse.json({ error: "Too many uploads. Try again later." }, { status: 429 });
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const validatedType = validateImageBuffer(buffer, file.type);
  if (!validatedType) {
    return NextResponse.json({ error: "Invalid image file" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${user.id}/${Date.now()}-${safeName}`;

  const { data, error } = await supabase.storage
    .from("club-images")
    .upload(path, buffer, {
      contentType: validatedType,
      upsert: false,
    });

  if (error || !data) {
    console.error("Club image upload failed:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("club-images").getPublicUrl(data.path);

  return NextResponse.json({ url: publicUrl });
}
