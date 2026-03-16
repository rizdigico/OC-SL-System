import { NextResponse } from "next/server";

export async function POST() {
    return NextResponse.json(
        {
            message: "System Access Granted",
            user:    { role: "Sovereign" },
            // Placeholder token — replace with a real JWT once auth is wired up.
            token:   "dev-access-token",
        },
        { status: 200 }
    );
}
