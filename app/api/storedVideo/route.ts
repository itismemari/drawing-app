import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function POST(req: NextRequest){
    const formData = await req.formData();
    const file = formData.get("storedVideo") as File;

    if (!file) return NextResponse.json({error : "no files found!!"} , {status : 400});

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const uploadDir = path.join(process.cwd(), "public/videos");
    await fs.mkdir(uploadDir, { recursive: true });
    const filePath = path.join(uploadDir, file.name);

    await fs.writeFile(filePath , buffer);

    return NextResponse.json({ success: true, url: `/videos/${file.name}` });
}