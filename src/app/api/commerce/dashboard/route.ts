import { NextResponse } from "next/server";
import { commerceRepository } from "@/lib/commerce/repository";
import { apiError } from "@/lib/server/http";

export async function GET() {
  try {
    return NextResponse.json({ data: await commerceRepository.dashboard() });
  } catch (error) {
    return apiError(error);
  }
}