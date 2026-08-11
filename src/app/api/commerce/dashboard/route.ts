import { NextResponse } from "next/server";
import { commerceRepository } from "@/lib/commerce/repository";

export function GET() { return NextResponse.json({ data: commerceRepository.dashboard() }); }
