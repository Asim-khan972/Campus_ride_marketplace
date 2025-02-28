import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend("re_KG1MpLk2_6b1R8WecVAFDcBW78v2h64M3");

export async function POST(request) {
  try {
    const { to, subject, html } = await request.json();

    const data = await resend.emails.send({
      from: "Campus Rides <notifications@campusrides.com>",
      to,
      subject,
      html,
    });

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error });
  }
}
